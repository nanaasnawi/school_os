package com.schoolos.android.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.common.BuildConfig
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit
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
    val showQrScanner: Boolean = false,
    val isSyncingServer: Boolean = false,
    val serverSyncMessage: String? = null,
    val serverSyncSuccess: Boolean = false,
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
        // Observe custom server URL reactively
        viewModelScope.launch {
            authManager.customServerUrlFlow.collect { url ->
                _state.value = _state.value.copy(customServerUrl = url)
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

        // Silent auto-discovery from Super Admin Command Center on launch
        viewModelScope.launch {
            delay(300)
            syncWithCommandCenter(silent = true)
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

    fun clearServerSyncMessage() {
        _state.value = _state.value.copy(serverSyncMessage = null)
    }

    fun syncWithCommandCenter(manualHost: String? = null, silent: Boolean = false) {
        viewModelScope.launch {
            if (!silent) {
                _state.value = _state.value.copy(isSyncingServer = true, serverSyncMessage = null)
            }
            val candidates = mutableListOf<String>()
            if (!manualHost.isNullOrBlank()) {
                var clean = manualHost.trim()
                if (!clean.startsWith("http")) clean = "http://$clean"
                clean = clean.trimEnd('/')
                if (!clean.endsWith("/api/v1")) clean = "$clean/api/v1"
                candidates.add("$clean/")
            }
            val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.HARDWARE.contains("goldfish")
                || android.os.Build.HARDWARE.contains("ranchu")

            candidates.add(BuildConfig.API_BASE_URL)
            if (_state.value.customServerUrl.isNotBlank()) {
                candidates.add(_state.value.customServerUrl)
            }
            if (isEmulator) {
                candidates.add("http://10.0.2.2:8000/api/v1/")
                candidates.add("http://127.0.0.1:8000/api/v1/")
            } else {
                candidates.add("http://192.168.1.11:8000/api/v1/")
            }

            val distinctCandidates = candidates.filter { it.isNotBlank() && (isEmulator || (!it.contains("10.0.2.2") && !it.contains("127.0.0.1"))) }.distinct()
            val client = OkHttpClient.Builder()
                .connectTimeout(3, TimeUnit.SECONDS)
                .readTimeout(4, TimeUnit.SECONDS)
                .build()

            var foundUrl: String? = null
            var serverName: String? = null

            withContext(Dispatchers.IO) {
                for (cand in distinctCandidates) {
                    try {
                        val target = cand.trimEnd('/') + "/system/mobile-config"
                        val req = Request.Builder().url(target).get().build()
                        val res = client.newCall(req).execute()
                        if (res.isSuccessful) {
                            val body = res.body?.string().orEmpty()
                            if (body.isNotBlank()) {
                                val root = JSONObject(body)
                                val data = root.optJSONObject("data")
                                val sUrl = data?.optString("server_url")
                                val sName = data?.optString("server_name")
                                if (!sUrl.isNullOrBlank() && sUrl.startsWith("http")) {
                                    foundUrl = sUrl.trim()
                                    serverName = sName
                                    break
                                } else {
                                    foundUrl = cand
                                    serverName = sName
                                    break
                                }
                            }
                        }
                    } catch (_: Exception) {
                        // Try next candidate
                    }
                }
            }

            if (!foundUrl.isNullOrBlank()) {
                authManager.saveCustomServerUrl(foundUrl!!)
                val updated = authManager.getCustomServerUrl() ?: foundUrl!!
                _state.value = _state.value.copy(
                    customServerUrl = updated,
                    isSyncingServer = false,
                    serverSyncSuccess = true,
                    serverSyncMessage = if (!silent) "Sinkron berhasil: ${serverName ?: "Command Center"} ($updated)" else null
                )
                // Refresh school public info
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
                } catch (_: Exception) {}
            } else if (!silent) {
                _state.value = _state.value.copy(
                    isSyncingServer = false,
                    serverSyncSuccess = false,
                    serverSyncMessage = "Gagal menemukan Command Center. Silakan atur URL server secara manual."
                )
            }
        }
    }

    fun onSaveServerUrl(url: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSyncingServer = true, serverSyncMessage = null)
            authManager.saveCustomServerUrl(url)
            val updated = authManager.getCustomServerUrl() ?: BuildConfig.API_BASE_URL
            _state.value = _state.value.copy(customServerUrl = updated)

            // Test connection
            val client = OkHttpClient.Builder()
                .connectTimeout(3, TimeUnit.SECONDS)
                .readTimeout(4, TimeUnit.SECONDS)
                .build()

            var success = false
            var testMsg = ""
            withContext(Dispatchers.IO) {
                try {
                    val req = Request.Builder().url(updated.trimEnd('/') + "/system/mobile-config").get().build()
                    val res = client.newCall(req).execute()
                    if (res.isSuccessful) {
                        success = true
                        testMsg = "Server aktif & terverifikasi!"
                    } else {
                        testMsg = "Server merespons kode: ${res.code}"
                    }
                } catch (e: Exception) {
                    testMsg = "URL disimpan, namun server belum merespons: ${e.message ?: "Connection error"}"
                }
            }

            _state.value = _state.value.copy(
                isSyncingServer = false,
                serverSyncSuccess = success,
                serverSyncMessage = testMsg
            )

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
                    username = "41e992f0@student.schoolos.id",
                    password = "admin123",
                    selectedRoleTab = 1,
                    error = null
                )
            }
            "guru" -> {
                _state.value = _state.value.copy(
                    username = "a20acca4@guru.schoolos.id",
                    password = "admin123",
                    selectedRoleTab = 2,
                    error = null
                )
            }
            "wali", "ortu" -> {
                _state.value = _state.value.copy(
                    username = "ortu1@schoolos.id",
                    password = "admin123",
                    selectedRoleTab = 3,
                    error = null
                )
            }
            "admin" -> {
                _state.value = _state.value.copy(
                    username = "admin@pkbmsalafiyah.com",
                    password = "admin123",
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
                            "Gagal terhubung ke server. Periksa koneksi internet Anda atau hubungi Administrator Sekolah."
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

    fun openQrScanner() {
        _state.value = _state.value.copy(showQrScanner = true, error = null)
    }

    fun closeQrScanner() {
        _state.value = _state.value.copy(showQrScanner = false)
    }

    fun loginWithQr(rawToken: String) {
        val s = _state.value
        val trimmed = rawToken.trim().trim('"', '\'', '`')
        val cleanToken = if (trimmed.contains("sch_qr_v1_")) {
            val startIdx = trimmed.indexOf("sch_qr_v1_")
            val sub = trimmed.substring(startIdx)
            val endIdx = sub.indexOfFirst { !it.isLetterOrDigit() && it != '_' }
            if (endIdx != -1) sub.substring(0, endIdx) else sub
        } else {
            trimmed
        }

        if (cleanToken.isBlank()) {
            _state.value = s.copy(error = "Token QR Code tidak valid.")
            return
        }

        viewModelScope.launch {
            _state.value = s.copy(isLoading = true, showQrScanner = false, error = null)
            authRepository.loginWithQr(cleanToken)
                .onSuccess {
                    _state.value = _state.value.copy(isLoading = false, isLoggedIn = true)
                }
                .onFailure { e ->
                    val errMsg = e.message ?: ""
                    val formatted = when {
                        errMsg.contains("Failed to connect", ignoreCase = true) || errMsg.contains("CLEARTEXT", ignoreCase = true) || errMsg.contains("Connection refused", ignoreCase = true) || errMsg.contains("timeout", ignoreCase = true) -> {
                            "Gagal terhubung ke server. Periksa koneksi internet Anda atau hubungi Administrator Sekolah."
                        }
                        else -> errMsg.ifBlank { "QR Login gagal. Silakan gunakan QR Code aktif yang sah." }
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = formatted
                    )
                }
        }
    }
}



