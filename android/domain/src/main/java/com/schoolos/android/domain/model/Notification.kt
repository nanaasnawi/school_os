package com.schoolos.android.domain.model

data class Notification(
    val id: String,
    val userId: String,
    val title: String,
    val body: String,
    val notificationType: String,
    val channel: String,
    val referenceType: String?,
    val referenceId: String?,
    val isRead: Boolean,
    val readAt: String?,
    val createdAt: String,
)
