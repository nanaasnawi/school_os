package com.schoolos.android.feature.grades

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.SubjectGradeSummary
import com.schoolos.android.domain.model.toSubjectSummary
import com.schoolos.android.domain.repository.AcademicRepository
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
    val userRole: String = "student",
    val subjects: List<SubjectGradeSummary> = emptyList(),
    val classes: List<AcademicClass> = emptyList(),
)

@HiltViewModel
class GradebookListViewModel @Inject constructor(
    private val repository: GradeRepository,
    private val academicRepository: AcademicRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(GradebookUiState())
    val state = _state.asStateFlow()

    private val classId = ""

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

            val classesResult = academicRepository.getClasses()
            val classes = classesResult.getOrDefault(emptyList())

            val subjectsResult = academicRepository.getSubjects()
            val subjectMap = subjectsResult.getOrDefault(emptyList()).associate { it.id to it.name }

            repository.getGradebook(classId)
                .onSuccess { entries ->
                    if (entries.isEmpty()) {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            isRefreshing = false,
                            subjects = emptyList(),
                            classes = classes,
                            error = null,
                        )
                        return@onSuccess
                    }
                    val subjectIds = entries.map { it.subjectId }.distinct()
                    val summaries = subjectIds.mapNotNull { id ->
                        val realName = subjectMap[id] ?: return@mapNotNull null
                        entries.toSubjectSummary(id, realName)
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        subjects = summaries.sortedByDescending { it.finalScore },
                        classes = classes,
                        error = null,
                    )
                }
                .onFailure { _ ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        subjects = emptyList(),
                        classes = classes,
                        error = null,
                    )
                }
        }
    }
}
