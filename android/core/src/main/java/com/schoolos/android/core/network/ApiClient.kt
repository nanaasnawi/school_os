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
        var request = chain.request()
        val customUrl = runBlocking {
            try {
                authManager.getCustomServerUrl()
            } catch (_: Exception) {
                null
            }
        }

        if (!customUrl.isNullOrBlank()) {
            val targetHttpUrl = customUrl.toHttpUrlOrNull()
            if (targetHttpUrl != null) {
                val newUrl = request.url.newBuilder()
                    .scheme(targetHttpUrl.scheme)
                    .host(targetHttpUrl.host)
                    .port(targetHttpUrl.port)
                    .build()
                request = request.newBuilder().url(newUrl).build()
            }
        }

        return chain.proceed(request)
    }
}

@Singleton
class ApiClient @Inject constructor(
    private val authManager: AuthManager,
) {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(DynamicHostInterceptor(authManager))
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
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
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
