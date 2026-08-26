package com.schoolos.android.feature.assignments

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission
import com.schoolos.android.domain.repository.AssignmentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AssignmentDetailUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val userRole: String = "student",
    val assignment: Assignment? = null,
    val submission: AssignmentSubmission? = null, // Student specific
    val allSubmissions: List<AssignmentSubmission> = emptyList(), // Teacher specific
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val submitError: String? = null,
)

@HiltViewModel
class AssignmentDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: AssignmentRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val assignmentId: String = savedStateHandle["id"] ?: ""

    private val _state = MutableStateFlow(AssignmentDetailUiState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(userRole = auth.role ?: "student")
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getAssignment(assignmentId)
                .onSuccess { assignment ->
                    _state.value = _state.value.copy(isLoading = false, assignment = assignment)
                    loadSubmissions()
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Assignment not found")
                }
        }
    }

    private suspend fun loadSubmissions() {
        val role = _state.value.userRole.lowercase()
        val isTeacher = role == "teacher" || role == "guru"
        
        repository.getSubmissions(assignmentId)
            .onSuccess { submissions ->
                if (isTeacher) {
                    _state.value = _state.value.copy(allSubmissions = submissions)
                } else {
                    _state.value = _state.value.copy(submission = submissions.firstOrNull())
                }
            }
    }

    fun submit(content: String = "") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSubmitting = true, submitError = null)
            repository.submitAssignment(assignmentId, content.ifBlank { null }, null)
                .onSuccess { submission ->
                    _state.value = _state.value.copy(isSubmitting = false, submitSuccess = true, submission = submission)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isSubmitting = false, submitError = e.message ?: "Failed to submit")
                }
        }
    }

    fun dismissSubmitSuccess() {
        _state.value = _state.value.copy(submitSuccess = false)
    }
}
