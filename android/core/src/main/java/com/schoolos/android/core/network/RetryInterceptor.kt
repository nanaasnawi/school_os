package com.schoolos.android.core.network

import okhttp3.Interceptor
import okhttp3.Response
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Singleton
class RetryInterceptor : Interceptor {

    companion object {
        private const val MAX_RETRIES = 1
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response: Response? = null
        var attempt = 0

        while (attempt <= MAX_RETRIES) {
            try {
                response = chain.proceed(request)
                // Never retry successful requests or client errors (4xx, e.g. 401 Unauthorized, 400, 403, 404)
                if (response.isSuccessful || response.code in 400..499 || attempt == MAX_RETRIES) {
                    return response
                }
                response.close()
            } catch (e: Exception) {
                if (attempt == MAX_RETRIES) {
                    throw e
                }
            }
            attempt++
            if (attempt <= MAX_RETRIES) {
                TimeUnit.MILLISECONDS.sleep(500L)
            }
        }

        return response ?: chain.proceed(request)
    }
}
