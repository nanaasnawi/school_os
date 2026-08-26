package com.schoolos.android.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey val id: String,
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
