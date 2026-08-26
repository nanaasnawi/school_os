package com.schoolos.android.feature.profile

import android.content.Context
import android.content.pm.PackageManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.common.Settings
import com.schoolos.android.core.common.SettingsManager
import com.schoolos.android.domain.model.User
import com.schoolos.android.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: User? = null,
    val isDarkMode: Boolean = false,
    val currentLanguage: String = "en",
    val appVersion: String = "",
    val loggingOut: Boolean = false,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val authManager: AuthManager,
    private val settingsManager: SettingsManager,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    val settings: StateFlow<Settings> = settingsManager.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), Settings())

    init {
        viewModelScope.launch {
            val pkg = try {
                context.packageManager.getPackageInfo(context.packageName, 0)
            } catch (_: PackageManager.NameNotFoundException) { null }
            _state.value = _state.value.copy(appVersion = pkg?.versionName ?: "1.0.0")
        }
        viewModelScope.launch {
            authManager.authState.collect { authState ->
                _state.value = _state.value.copy(
                    user = if (authState.isLoggedIn) User(
                        id = authState.userId ?: "",
                        name = authState.name ?: "",
                        email = authState.email ?: "",
                        role = authState.role ?: "",
                    ) else null,
                )
            }
        }
    }

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch { settingsManager.setDarkMode(enabled) }
    }

    fun setLanguage(language: String) {
        viewModelScope.launch { settingsManager.setLanguage(language) }
    }

    fun logout() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loggingOut = true)
            authRepository.logout()
        }
    }
}
