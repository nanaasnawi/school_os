package com.schoolos.android.core.network

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.common.BuildConfig
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

class DynamicHostInterceptor(
    private val authManager: AuthManager,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val customUrl = runBlocking {
            try {
                authManager.getCustomServerUrl()
            } catch (_: Exception) {
                null
            }
        }

        var primaryRequest = originalRequest
        if (!customUrl.isNullOrBlank()) {
            val targetHttpUrl = customUrl.toHttpUrlOrNull()
            if (targetHttpUrl != null) {
                val isLocalIp = targetHttpUrl.host.startsWith("192.168.")
                    || targetHttpUrl.host.startsWith("10.")
                    || targetHttpUrl.host == "127.0.0.1"
                    || targetHttpUrl.host == "10.0.2.2"
                val originalIsHttps = originalRequest.url.isHttps

                // Only apply customUrl if original is not HTTPS, or customUrl is also a remote host
                if (!(originalIsHttps && isLocalIp)) {
                    val newUrl = originalRequest.url.newBuilder()
                        .scheme(targetHttpUrl.scheme)
                        .host(targetHttpUrl.host)
                        .port(targetHttpUrl.port)
                        .build()
                    primaryRequest = originalRequest.newBuilder().url(newUrl).build()
                }
            }
        }

        return try {
            chain.proceed(primaryRequest)
        } catch (e: Exception) {
            // Smart auto-fallback for physical devices & network changes
            val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.HARDWARE.contains("goldfish")
                || android.os.Build.HARDWARE.contains("ranchu")

            val buildConfigUrl = try {
                com.schoolos.android.core.common.BuildConfig.API_BASE_URL.toHttpUrlOrNull()
            } catch (_: Exception) { null }

            val rawCandidates = if (isEmulator) {
                listOfNotNull(
                    buildConfigUrl,
                    "http://10.0.2.2:8000/api/v1/".toHttpUrlOrNull(),
                    "http://127.0.0.1:8000/api/v1/".toHttpUrlOrNull(),
                )
            } else {
                listOfNotNull(
                    buildConfigUrl,
                    "http://192.168.1.11:8000/api/v1/".toHttpUrlOrNull(),
                ).filter { it.host != "10.0.2.2" && it.host != "127.0.0.1" }
            }

            val currentHost = primaryRequest.url.host
            val currentPort = primaryRequest.url.port
            val candidateUrls = rawCandidates.distinct().filter { 
                it.host != currentHost || it.port != currentPort 
            }

            var lastException: Exception = e
            for (targetUrl in candidateUrls) {
                try {
                    val fallbackUrl = primaryRequest.url.newBuilder()
                        .scheme(targetUrl.scheme)
                        .host(targetUrl.host)
                        .port(targetUrl.port)
                        .build()
                    val fallbackRequest = primaryRequest.newBuilder().url(fallbackUrl).build()
                    val response = chain.proceed(fallbackRequest)

                    // Fallback worked! Persist working URL so next calls are instant
                    runBlocking {
                        try {
                            authManager.saveCustomServerUrl(targetUrl.toString())
                        } catch (_: Exception) {}
                    }
                    return response
                } catch (fallbackEx: Exception) {
                    lastException = fallbackEx
                }
            }
            throw lastException
        }
    }
}

@Singleton
class ApiClient @Inject constructor(
    private val authManager: AuthManager,
    private val maintenanceManager: MaintenanceManager,
) {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(DynamicHostInterceptor(authManager))
            .addInterceptor(MaintenanceInterceptor(maintenanceManager))
            .addInterceptor(AuthInterceptor(authManager))
            .addInterceptor(RetryInterceptor())
            .authenticator(TokenRefreshInterceptor(authManager))
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                }
            )
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .certificatePinner(CertificatePinnerFactory.create())
            .build()
    }

    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(httpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    inline fun <reified T> create(): T = retrofit.create(T::class.java)
}
