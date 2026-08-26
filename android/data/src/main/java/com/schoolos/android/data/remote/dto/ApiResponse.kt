package com.schoolos.android.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiErrorDetail? = null,
    val requestId: String = "",
    val timestamp: String = "",
    val version: String = "",
)

@Serializable
data class ApiErrorDetail(
    val code: String,
    val message: String,
    val details: kotlinx.serialization.json.JsonObject? = null,
    val traceId: String = "",
    val correlationId: String = "",
)
