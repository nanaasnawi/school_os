package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.User

interface AuthRepository {
    suspend fun login(username: String, password: String): Result<User>
    suspend fun loginWithQr(token: String): Result<User>
    suspend fun logout()
    suspend fun refreshToken(): Result<String>
    suspend fun isLoggedIn(): Boolean
}

