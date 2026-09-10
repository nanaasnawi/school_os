package com.schoolos.android.feature.assignments

import androidx.lifecycle.SavedStateHandle
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
    val childName: String = "",
    val active: List<Assignment> = emptyList(),
    val dueSoon: List<Assignment> = emptyList(),
    val completed: List<Assignment> = emptyList(),
    val subjectFilter: String? = null,
)

@HiltViewModel
class AssignmentListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: AssignmentRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(AssignmentListUiState())
    val state = _state.asStateFlow()

    private val classId = ""

    /** Optional subject filter passed via navigation (e.g. from a session detail). */
    private var subjectFilter: String? = savedStateHandle.get<String>("subjectId")?.takeIf { it.isNotBlank() }

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(
                    userRole = auth.role ?: "student",
                    childName = auth.childName ?: ""
                )
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
                    val filtered = subjectFilter?.let { filter -> assignments.filter { a -> matchesSubject(a.subjectName, filter) } } ?: assignments
                    val grouped = groupAssignments(filtered)
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        active = grouped.active,
                        dueSoon = grouped.dueSoon,
                        completed = grouped.completed,
                        subjectFilter = subjectFilter,
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

    /** Tolerant subject matching: exact, or bidirectional contains (case-insensitive). */
    private fun matchesSubject(itemSubject: String?, filter: String): Boolean {
        if (itemSubject.isNullOrBlank()) return false
        val a = itemSubject.trim()
        val b = filter.trim()
        return a.equals(b, ignoreCase = true) || a.contains(b, ignoreCase = true) || b.contains(a, ignoreCase = true)
    }

    fun clearSubjectFilter() {
        subjectFilter = null
        _state.value = _state.value.copy(subjectFilter = null)
        refresh()
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
