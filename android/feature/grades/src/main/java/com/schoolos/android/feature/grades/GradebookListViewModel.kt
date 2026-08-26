package com.schoolos.android.feature.grades

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.SubjectGradeSummary
import com.schoolos.android.domain.model.toSubjectSummary
import com.schoolos.android.domain.repository.GradeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GradebookUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val subjects: List<SubjectGradeSummary> = emptyList(),
)

@HiltViewModel
class GradebookListViewModel @Inject constructor(
    private val repository: GradeRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(GradebookUiState())
    val state = _state.asStateFlow()

    private val classId = ""

    init {
        load()
    }

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true)
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getGradebook(classId)
                .onSuccess { entries ->
                    val subjectIds = entries.map { it.subjectId }.distinct()
                    // Sprint B+: subject_name should come from backend projection
                    // Hardcoded mapping for MVP demo
                    val subjectNames = emptyMap<String, String>()
                    val summaries = subjectIds.map { id ->
                        entries.toSubjectSummary(id, subjectNames[id] ?: "Subject ${id.take(8)}")
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        subjects = summaries.sortedByDescending { it.finalScore },
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = e.message ?: "Failed to load gradebook",
                    )
                }
        }
    }
}
