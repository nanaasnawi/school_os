package com.schoolos.android.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.Notification
import com.schoolos.android.domain.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationListUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val userRole: String = "student",
    val notifications: List<Notification> = emptyList(),
    val unreadCount: Int = 0,
    val markingAll: Boolean = false,
)

@HiltViewModel
class NotificationListViewModel @Inject constructor(
    private val repository: NotificationRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationListUiState())
    val state = _state.asStateFlow()

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
            repository.getNotifications()
                .onSuccess { notifications ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        notifications = notifications.sortedByDescending { it.createdAt },
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = e.message ?: "Failed to load notifications",
                    )
                }
            repository.getUnreadCount().onSuccess { count ->
                _state.value = _state.value.copy(unreadCount = count)
            }
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            repository.markRead(id)
            _state.value = _state.value.copy(
                notifications = _state.value.notifications.map {
                    if (it.id == id) it.copy(isRead = true) else it
                },
                unreadCount = (_state.value.unreadCount - 1).coerceAtLeast(0),
            )
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            _state.value = _state.value.copy(markingAll = true)
            repository.markAllRead()
            _state.value = _state.value.copy(
                markingAll = false,
                notifications = _state.value.notifications.map { it.copy(isRead = true) },
                unreadCount = 0,
            )
        }
    }
}
