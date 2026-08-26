package com.schoolos.android.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.domain.repository.AuthRepository
import com.schoolos.android.domain.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val userName: String = "",
    val userRole: String = "student",
    val userEmail: String = "",
    val unreadCount: Int = 0,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val authManager: AuthManager,
    private val notificationRepository: NotificationRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state = _state.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                val name = if (!auth.name.isNull_or_empty_or_blank()) auth.name!! else "Pengguna School OS"
                val role = if (!auth.role.isNull_or_empty_or_blank()) auth.role!! else "student"
                _state.value = _state.value.copy(
                    userName = name,
                    userRole = role,
                    userEmail = auth.email ?: "",
                )
            }
        }
        viewModelScope.launch {
            notificationRepository.getUnreadCount().onSuccess { count ->
                _state.value = _state.value.copy(unreadCount = count)
            }
        }
    }

    private fun String?.isNull_or_empty_or_blank(): Boolean {
        return this == null || this.trim().isEmpty()
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}
