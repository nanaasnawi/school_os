package com.schoolos.android.feature.sessions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance
import com.schoolos.android.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZonedDateTime
import javax.inject.Inject

data class TodayUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val userRole: String = "student",
    val active: List<LearningSession> = emptyList(),
    val upcoming: List<LearningSession> = emptyList(),
    val completed: List<LearningSession> = emptyList(),
)

@HiltViewModel
class TodayViewModel @Inject constructor(
    private val repository: SessionRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(TodayUiState())
    val state = _state.asStateFlow()

    private val classId = "" // Sprint B+: resolve from auth

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(userRole = auth.role ?: "student")
            }
        }
        load()
    }

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true)
        load(_selectedDate.value)
    }

    private val _selectedDate = MutableStateFlow(LocalDate.now())

    fun onDateSelected(date: LocalDate) {
        _selectedDate.value = date
        load(date)
    }

    private fun load(targetDate: LocalDate = LocalDate.now()) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getSessions(classId)
                .onSuccess { sessions ->
                    val targetSessions = sessions.filter { s ->
                        val scheduled = s.scheduledAt?.let { parseDate(it) }
                        val started = s.startedAt?.let { parseDate(it) }
                        scheduled == targetDate || started == targetDate
                    }
                    val grouped = groupSessions(targetSessions)
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        active = grouped.active,
                        upcoming = grouped.upcoming,
                        completed = grouped.completed,
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = e.message ?: "Failed to load sessions",
                    )
                }
        }
    }

    private fun groupSessions(sessions: List<LearningSession>): Grouped {
        val active = mutableListOf<LearningSession>()
        val upcoming = mutableListOf<LearningSession>()
        val completed = mutableListOf<LearningSession>()

        for (s in sessions) {
            when (s.status) {
                "active" -> active.add(s)
                "completed" -> completed.add(s)
                else -> upcoming.add(s)
            }
        }

        return Grouped(
            active = active.sortedBy { it.scheduledAt },
            upcoming = upcoming.sortedBy { it.scheduledAt },
            completed = completed.sortedByDescending { it.endedAt ?: it.scheduledAt ?: "" },
        )
    }

    private fun parseDate(iso: String): LocalDate? {
        return try {
            ZonedDateTime.parse(iso).toLocalDate()
        } catch (_: Exception) {
            try {
                java.time.Instant.parse(iso).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
            } catch (_: Exception) { null }
        }
    }

    private data class Grouped(
        val active: List<LearningSession>,
        val upcoming: List<LearningSession>,
        val completed: List<LearningSession>,
    )
}
