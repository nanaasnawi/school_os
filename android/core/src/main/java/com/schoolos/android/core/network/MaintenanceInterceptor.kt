package com.schoolos.android.core.network

import okhttp3.Interceptor
import okhttp3.Response
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MaintenanceInterceptor @Inject constructor(
    private val maintenanceManager: MaintenanceManager,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)

        // Don't intercept the check endpoint itself to avoid loops
        if (request.url.encodedPath.contains("maintenance-status")) {
            return response
        }

        if (response.code == 503 || response.code == 423) {
            try {
                val peekBody = response.peekBody(4096).string()
                var message = "Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit."
                if (peekBody.isNotBlank()) {
                    try {
                        val json = JSONObject(peekBody)
                        val msg = json.optString("message", "")
                        if (msg.isNotBlank()) message = msg
                    } catch (_: Exception) {}
                }
                maintenanceManager.setMaintenance(true, message)
            } catch (_: Exception) {
                maintenanceManager.setMaintenance(true)
            }
        }

        return response
    }
}
