package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NotificationDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    val body: String = "",
    @SerialName("notification_type") val notificationType: String,
    val channel: String = "in_app",
    @SerialName("reference_type") val referenceType: String? = null,
    @SerialName("reference_id") val referenceId: String? = null,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("read_at") val readAt: String? = null,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class PaginatedNotificationResponse(
    val items: List<NotificationDto> = emptyList(),
    @SerialName("total_items") val totalItems: Long = 0,
    val page: Int = 1,
    @SerialName("page_size") val pageSize: Int = 20,
    @SerialName("total_pages") val totalPages: Int = 0,
)
