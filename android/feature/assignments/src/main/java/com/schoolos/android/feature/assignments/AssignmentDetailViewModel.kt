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
    val childName: String = "",
    val assignment: Assignment? = null,
    val submission: AssignmentSubmission? = null, // Student specific
    val allSubmissions: List<AssignmentSubmission> = emptyList(), // Teacher specific
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val submitError: String? = null,
    // Grading state
    val isGrading: Boolean = false,
    val gradeSuccess: Boolean = false,
    val gradeError: String? = null,
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
                _state.value = _state.value.copy(
                    userRole = auth.role ?: "student",
                    childName = auth.childName ?: ""
                )
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
        val isTeacher = com.schoolos.android.core.auth.isTeacherRole(_state.value.userRole)
        val studentId = authManager.getStudentId()

        repository.getSubmissions(assignmentId)
            .onSuccess { submissions ->
                if (isTeacher) {
                    // Teachers see all submissions for grading
                    _state.value = _state.value.copy(allSubmissions = submissions)
                } else {
                    // Students only see their own submission - filter by student ID
                    val ownSubmission = submissions.firstOrNull { it.studentId == studentId }
                        ?: submissions.firstOrNull() // Fallback for backward compatibility
                    _state.value = _state.value.copy(submission = ownSubmission)
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

    fun gradeSubmission(submissionId: String, score: Int, feedback: String?) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isGrading = true, gradeError = null, gradeSuccess = false)
            repository.gradeSubmission(assignmentId, submissionId, score, feedback)
                .onSuccess { gradedSubmission ->
                    // Update the submission in the list
                    val updatedList = _state.value.allSubmissions.map { sub ->
                        if (sub.id == submissionId) gradedSubmission else sub
                    }
                    _state.value = _state.value.copy(
                        isGrading = false,
                        gradeSuccess = true,
                        allSubmissions = updatedList,
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isGrading = false, gradeError = e.message ?: "Gagal menyimpan nilai")
                }
        }
    }

    fun dismissSubmitSuccess() {
        _state.value = _state.value.copy(submitSuccess = false)
    }

    fun dismissGradeSuccess() {
        _state.value = _state.value.copy(gradeSuccess = false)
    }

    fun dismissGradeError() {
        _state.value = _state.value.copy(gradeError = null)
    }
}


