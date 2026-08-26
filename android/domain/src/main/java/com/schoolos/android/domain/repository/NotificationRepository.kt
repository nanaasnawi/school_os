package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.Notification

interface NotificationRepository {
    suspend fun getNotifications(page: Int = 1): Result<List<Notification>>
    suspend fun getUnreadCount(): Result<Int>
    suspend fun markRead(id: String)
    suspend fun markAllRead()
    suspend fun broadcastNotification(
        classId: String,
        title: String,
        body: String,
        targetRoles: List<String>
    ): Result<Unit>
}
