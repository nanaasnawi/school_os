package com.schoolos.android.core.network

import okhttp3.Interceptor
import okhttp3.Response
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Singleton
class RetryInterceptor : Interceptor {

    companion object {
        private const val MAX_RETRIES = 3
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response: Response? = null
        var attempt = 0

        while (attempt <= MAX_RETRIES) {
            try {
                response = chain.proceed(request)
                if (response.isSuccessful || attempt == MAX_RETRIES) {
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
                val delayMs = (1000L * Math.pow(2.0, (attempt - 1).toDouble())).toLong()
                TimeUnit.MILLISECONDS.sleep(delayMs)
            }
        }

        return response ?: chain.proceed(request)
    }
}
