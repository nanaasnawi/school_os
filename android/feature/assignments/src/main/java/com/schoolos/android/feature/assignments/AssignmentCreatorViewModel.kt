package com.schoolos.android.feature.assignments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.repository.AssignmentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AssignmentCreatorUiState(
    val isLoading: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AssignmentCreatorViewModel @Inject constructor(
    private val repository: AssignmentRepository
) : ViewModel() {

    private val _state = MutableStateFlow(AssignmentCreatorUiState())
    val state = _state.asStateFlow()

    fun createAssignment(
        title: String,
        description: String,
        instructions: String,
        maxScore: Int,
        dueAt: String,
        classId: String = "class_7a"
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.createAssignment(
                title = title,
                description = description,
                instructions = instructions,
                maxScore = maxScore,
                dueAt = dueAt,
                classId = classId,
                assignmentType = "HOMEWORK"
            ).onSuccess {
                _state.value = _state.value.copy(isLoading = false, success = true)
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to create assignment")
            }
        }
    }

    fun resetState() {
        _state.value = AssignmentCreatorUiState()
    }
}
