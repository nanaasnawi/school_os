package com.schoolos.android.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val username: String,
    val password: String,
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val tenantId: String,
    val name: String,
    val email: String,
    val role: String,
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String,
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val refreshToken: String,
)

@Serializable
data class SchoolProfileResponse(
    val id: String,
    val name: String,
    @kotlinx.serialization.SerialName("logo_url") val logoUrl: String? = null,
)

@Serializable
data class SchoolPublicInfoResponse(
    val name: String,
    @kotlinx.serialization.SerialName("logo_url") val logoUrl: String? = null,
    val npsn: String? = null,
)
