package com.schoolos.android.core.network

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.common.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MaintenanceManager @Inject constructor(
    private val authManager: AuthManager,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _isMaintenance = MutableStateFlow(false)
    val isMaintenance: StateFlow<Boolean> = _isMaintenance.asStateFlow()

    private val _maintenanceMessage = MutableStateFlow(
        "Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit."
    )
    val maintenanceMessage: StateFlow<String> = _maintenanceMessage.asStateFlow()

    fun setMaintenance(active: Boolean, message: String? = null) {
        if (!message.isNullOrBlank()) {
            _maintenanceMessage.value = message
        }
        _isMaintenance.value = active
    }

    suspend fun checkServerStatus(): Boolean = withContext(Dispatchers.IO) {
        val primaryUrl = authManager.getCustomServerUrl() ?: BuildConfig.API_BASE_URL
        val candidateUrls = listOf(
            primaryUrl,
            BuildConfig.API_BASE_URL,
            "http://10.0.2.2:8000/api/v1/",
            "http://127.0.0.1:8000/api/v1/",
        ).distinct()

        val client = OkHttpClient.Builder()
            .connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        for (candidateUrl in candidateUrls) {
            try {
                val statusUrl = candidateUrl.trimEnd('/') + "/system/maintenance-status"
                val request = Request.Builder().url(statusUrl).get().build()
                val response = client.newCall(request).execute()

                if (response.isSuccessful || response.code == 503 || response.code == 423) {
                    // Candidate is live! Persist if different from primary
                    if (candidateUrl != primaryUrl) {
                        try {
                            authManager.saveCustomServerUrl(candidateUrl)
                        } catch (_: Exception) {}
                    }

                    if (response.code == 503 || response.code == 423) {
                        setMaintenance(true, "Server merespons kode 503 (Mode Pemeliharaan Aktif).")
                        return@withContext true
                    }

                    val bodyStr = response.body?.string().orEmpty()
                    if (bodyStr.isNotBlank()) {
                        val root = JSONObject(bodyStr)
                        val data = root.optJSONObject("data")
                        val isMode = data?.optBoolean("maintenance_mode", false) ?: false
                        val msg = data?.optString("maintenance_message")
                        setMaintenance(isMode, if (!msg.isNullOrBlank()) msg else null)
                    } else {
                        setMaintenance(false)
                    }

                    // Auto-sync latest mobile server URL configured centrally by Super Admin
                    try {
                        val mobileConfigUrl = candidateUrl.trimEnd('/') + "/system/mobile-config"
                        val mobileReq = Request.Builder().url(mobileConfigUrl).get().build()
                        val mobileRes = client.newCall(mobileReq).execute()
                        if (mobileRes.isSuccessful) {
                            val mBody = mobileRes.body?.string().orEmpty()
                            if (mBody.isNotBlank()) {
                                val mRoot = JSONObject(mBody)
                                val mData = mRoot.optJSONObject("data")
                                val remoteUrl = mData?.optString("server_url")
                                if (!remoteUrl.isNullOrBlank() && remoteUrl.startsWith("http")) {
                                    val cleanRemote = remoteUrl.trim()
                                    if (cleanRemote != candidateUrl) {
                                        authManager.saveCustomServerUrl(cleanRemote)
                                    }
                                }
                            }
                        }
                    } catch (_: Exception) {}

                    return@withContext _isMaintenance.value
                }
            } catch (_: Exception) {
                // Try next candidate
            }
        }

        _isMaintenance.value
    }
}
