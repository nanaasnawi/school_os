package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.data.remote.dto.LoginRequest
import com.schoolos.android.domain.model.User
import com.schoolos.android.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
) : AuthRepository {

    override suspend fun login(username: String, password: String): Result<User> = runCatching {
        val response = api.login(LoginRequest(username = username, password = password))
        val data = response.data ?: throw Exception(
            response.error?.message ?: "Login gagal. Silakan periksa kredensial email/username & password Anda."
        )

        authManager.saveSession(
            accessToken = data.accessToken,
            refreshToken = data.refreshToken,
            userId = data.userId,
            tenantId = data.tenantId,
            name = data.name,
            email = data.email,
            role = data.role,
        )

        try {
            val profileResponse = api.getSchoolProfile()
            profileResponse.data?.let { profile ->
                authManager.saveSchoolProfile(name = profile.name, logoUrl = profile.logoUrl)
            }
        } catch (e: Exception) {
            // Log or ignore profile fetch failure so it doesn't break login
        }

        User(id = data.userId, name = data.name, email = data.email, role = data.role)
    }

    override suspend fun logout() {
        authManager.clearSession()
    }

    override suspend fun refreshToken(): Result<String> = runCatching {
        val refreshToken = authManager.getRefreshToken() ?: throw Exception("No refresh token stored")
        val response = api.refreshToken(
            com.schoolos.android.data.remote.dto.RefreshTokenRequest(refreshToken)
        )
        val data = response.data ?: throw Exception("Token refresh failed")
        authManager.saveSession(
            accessToken = data.accessToken,
            refreshToken = data.refreshToken,
            userId = "",
            tenantId = "",
        )
        data.accessToken
    }

    override suspend fun isLoggedIn(): Boolean = authManager.isLoggedIn
}
