package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val username: String,
    val password: String,
)

@Serializable
data class QrLoginRequest(
    val token: String,
)

@Serializable
data class LoginResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String = "Bearer",
    @SerialName("expires_in") val expiresIn: Long = 86400,
    @SerialName("refresh_token") val refreshToken: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("tenant_id") val tenantId: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "",
    @SerialName("school_name") val schoolName: String? = null,
    @SerialName("school_logo_url") val schoolLogoUrl: String? = null,
    val identifier: String? = null,
    @SerialName("class_name") val className: String? = null,
    @SerialName("child_name") val childName: String? = null,
    @SerialName("child_id") val childId: String? = null,
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
    @SerialName("logo_url") val logoUrl: String? = null,
)

@Serializable
data class SchoolPublicInfoResponse(
    val name: String,
    @SerialName("logo_url") val logoUrl: String? = null,
    val npsn: String? = null,
)

@Serializable
data class UserDto(
    val id: String = "",
    val email: String = "",
    @SerialName("full_name") val fullName: String = "",
    val role: String = "",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("school_name") val schoolName: String? = null,
    @SerialName("school_logo_url") val schoolLogoUrl: String? = null,
    val identifier: String? = null,
    @SerialName("class_name") val className: String? = null,
    @SerialName("child_name") val childName: String? = null,
    @SerialName("child_id") val childId: String? = null,
)
