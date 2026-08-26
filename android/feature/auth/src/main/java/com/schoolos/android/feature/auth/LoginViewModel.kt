package com.schoolos.android.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.common.BuildConfig
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val username: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val schoolName: String? = null,
    val schoolLogoUrl: String? = null,
    val schoolNpsn: String? = null,
    val selectedRoleTab: Int = 0,
    val rememberMe: Boolean = true,
    val customServerUrl: String = BuildConfig.API_BASE_URL,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val authManager: AuthManager,
    private val api: SchoolOsApi,
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state = _state.asStateFlow()

    init {
        // Observe persisted school profile and custom server URL
        viewModelScope.launch {
            val savedUrl = authManager.getCustomServerUrl()
            if (!savedUrl.isNullOrBlank()) {
                _state.value = _state.value.copy(customServerUrl = savedUrl)
            }
        }

        viewModelScope.launch {
            authManager.authState.collect { authState ->
                _state.value = _state.value.copy(
                    schoolName = authState.schoolName,
                    schoolLogoUrl = authState.schoolLogoUrl,
                )
            }
        }

        // Fetch school public info to show school name on login screen before login
        viewModelScope.launch {
            try {
                val response = api.getSchoolPublicInfo(npsn = null)
                response.data?.let { info ->
                    _state.value = _state.value.copy(
                        schoolName = info.name,
                        schoolLogoUrl = info.logoUrl,
                        schoolNpsn = info.npsn,
                    )
                    // Persist so it survives restarts even without login
                    authManager.saveSchoolProfile(name = info.name, logoUrl = info.logoUrl)
                }
            } catch (_: Exception) {
                // Silently ignore — cached value from DataStore will be used
            }
        }
    }

    fun onUsernameChanged(value: String) {
        _state.value = _state.value.copy(username = value, error = null)
    }

    fun onPasswordChanged(value: String) {
        _state.value = _state.value.copy(password = value, error = null)
    }

    fun onRoleTabChanged(tabIndex: Int) {
        _state.value = _state.value.copy(selectedRoleTab = tabIndex, error = null)
    }

    fun onRememberMeChanged(checked: Boolean) {
        _state.value = _state.value.copy(rememberMe = checked)
    }

    fun onSaveServerUrl(url: String) {
        viewModelScope.launch {
            authManager.saveCustomServerUrl(url)
            val updated = authManager.getCustomServerUrl() ?: BuildConfig.API_BASE_URL
            _state.value = _state.value.copy(customServerUrl = updated, error = null)
            
            // Try re-fetching school public info
            try {
                val response = api.getSchoolPublicInfo(npsn = null)
                response.data?.let { info ->
                    _state.value = _state.value.copy(
                        schoolName = info.name,
                        schoolLogoUrl = info.logoUrl,
                        schoolNpsn = info.npsn,
                    )
                    authManager.saveSchoolProfile(name = info.name, logoUrl = info.logoUrl)
                }
            } catch (_: Exception) {
                // ignore
            }
        }
    }

    fun onQuickFillDemo(role: String) {
        when (role.lowercase()) {
            "siswa" -> {
                _state.value = _state.value.copy(
                    username = "siswa1@schoolos.id",
                    password = "password123",
                    selectedRoleTab = 1,
                    error = null
                )
            }
            "guru" -> {
                _state.value = _state.value.copy(
                    username = "guru1@schoolos.id",
                    password = "password123",
                    selectedRoleTab = 2,
                    error = null
                )
            }
            "wali", "ortu" -> {
                _state.value = _state.value.copy(
                    username = "ortu1@schoolos.id",
                    password = "password123",
                    selectedRoleTab = 3,
                    error = null
                )
            }
            "admin" -> {
                _state.value = _state.value.copy(
                    username = "admin@schoolos.id",
                    password = "password123",
                    selectedRoleTab = 0,
                    error = null
                )
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    fun login() {
        val s = _state.value
        if (s.username.isBlank() || s.password.isBlank()) {
            _state.value = s.copy(error = "Username/Email dan kata sandi wajib diisi.")
            return
        }
        viewModelScope.launch {
            _state.value = s.copy(isLoading = true, error = null)
            authRepository.login(s.username.trim(), s.password)
                .onSuccess { _state.value = _state.value.copy(isLoading = false, isLoggedIn = true) }
                .onFailure { e ->
                    val errMsg = e.message ?: ""
                    val formatted = when {
                        errMsg.contains("Failed to connect", ignoreCase = true) || errMsg.contains("CLEARTEXT", ignoreCase = true) || errMsg.contains("Connection refused", ignoreCase = true) || errMsg.contains("timeout", ignoreCase = true) -> {
                            "Gagal terhubung ke server (${s.customServerUrl.removePrefix("http://").removeSuffix("/api/v1/")}). Pastikan HP dan Komputer berada di jaringan Wi-Fi yang sama."
                        }
                        else -> errMsg.ifBlank { "Login gagal. Silakan periksa kembali akun Anda." }
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = formatted
                    )
                }
        }
    }
}

