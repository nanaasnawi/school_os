package com.schoolos.android.feature.assignments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.repository.AssignmentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.inject.Inject

data class AssignmentListUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val userRole: String = "student",
    val active: List<Assignment> = emptyList(),
    val dueSoon: List<Assignment> = emptyList(),
    val completed: List<Assignment> = emptyList(),
)

@HiltViewModel
class AssignmentListViewModel @Inject constructor(
    private val repository: AssignmentRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(AssignmentListUiState())
    val state = _state.asStateFlow()

    private val classId = "" // Sprint B+: resolve from auth/settings

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
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getAssignments(classId)
                .onSuccess { assignments ->
                    val grouped = groupAssignments(assignments)
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        active = grouped.active,
                        dueSoon = grouped.dueSoon,
                        completed = grouped.completed,
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = e.message ?: "Failed to load assignments",
                    )
                }
        }
    }

    private fun groupAssignments(assignments: List<Assignment>): Grouped {
        val now = Instant.now()
        val active = mutableListOf<Assignment>()
        val dueSoon = mutableListOf<Assignment>()
        val completed = mutableListOf<Assignment>()

        for (a in assignments) {
            when (a.status) {
                "submitted", "graded" -> completed.add(a)
                else -> {
                    val dueAt = a.dueAt?.let {
                        try {
                            Instant.parse(it)
                        } catch (_: Exception) {
                            null
                        }
                    }
                    if (dueAt != null && ChronoUnit.DAYS.between(now, dueAt) <= 3 && ChronoUnit.DAYS.between(now, dueAt) >= 0) {
                        dueSoon.add(a)
                    } else {
                        active.add(a)
                    }
                }
            }
        }

        return Grouped(
            active = active.sortedBy { it.dueAt },
            dueSoon = dueSoon.sortedBy { it.dueAt },
            completed = completed.sortedByDescending { it.updatedAt },
        )
    }

    private data class Grouped(
        val active: List<Assignment>,
        val dueSoon: List<Assignment>,
        val completed: List<Assignment>,
    )
}
