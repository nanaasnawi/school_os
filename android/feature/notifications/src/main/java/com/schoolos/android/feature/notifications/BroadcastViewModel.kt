package com.schoolos.android.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BroadcastUiState(
    val isLoading: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class BroadcastViewModel @Inject constructor(
    private val repository: NotificationRepository
) : ViewModel() {

    private val _state = MutableStateFlow(BroadcastUiState())
    val state = _state.asStateFlow()

    fun sendBroadcast(
        title: String,
        message: String,
        targetStudents: Boolean,
        targetParents: Boolean
    ) {
        val roles = mutableListOf<String>()
        if (targetStudents) roles.add("student")
        if (targetParents) roles.add("parent")
        
        if (roles.isEmpty()) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.broadcastNotification(
                classId = "class_7a",
                title = title,
                body = message,
                targetRoles = roles
            ).onSuccess {
                _state.value = _state.value.copy(isLoading = false, success = true)
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to send broadcast")
            }
        }
    }

    fun resetState() {
        _state.value = BroadcastUiState()
    }
}
