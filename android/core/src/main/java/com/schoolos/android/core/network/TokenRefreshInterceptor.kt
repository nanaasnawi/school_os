package com.schoolos.android.core.network

import com.schoolos.android.core.auth.AuthManager
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class RefreshBody(val refreshToken: String)

@Serializable
data class RefreshResult(val accessToken: String, val refreshToken: String)

@Singleton
class TokenRefreshInterceptor @Inject constructor(
    private val authManager: AuthManager,
) : Authenticator {

    private val json = Json { ignoreUnknownKeys = true }

    private val refreshClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) return null

        return runBlocking {
            val refreshToken = authManager.getRefreshToken() ?: return@runBlocking null

            try {
                val body = json.encodeToString(
                    RefreshBody.serializer(),
                    RefreshBody(refreshToken),
                )
                val originalUrl = response.request.url
                val refreshUrl = "${originalUrl.scheme}://${originalUrl.host}:${originalUrl.port}/api/v1/auth/refresh"

                val refreshResponse = refreshClient.newCall(
                    Request.Builder()
                        .url(refreshUrl)
                        .post(body.toRequestBody("application/json".toMediaType()))
                        .build()
                ).execute()

                if (!refreshResponse.isSuccessful) {
                    authManager.clearSession()
                    return@runBlocking null
                }

                val responseBody = refreshResponse.body?.string() ?: return@runBlocking null
                val tokenResponse = json.decodeFromString<RefreshResult>(responseBody)

                authManager.saveSession(
                    accessToken = tokenResponse.accessToken,
                    refreshToken = tokenResponse.refreshToken,
                    userId = "",
                    tenantId = "",
                )

                response.request.newBuilder()
                    .header("Authorization", "Bearer ${tokenResponse.accessToken}")
                    .build()
            } catch (_: Exception) {
                authManager.clearSession()
                null
            }
        }
    }
}
