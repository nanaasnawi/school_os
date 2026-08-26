package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.database.dao.NotificationDao
import com.schoolos.android.core.database.mapper.toDomain as entityToDomain
import com.schoolos.android.core.database.mapper.toEntity
import com.schoolos.android.core.network.NetworkMonitor
import com.schoolos.android.data.mapper.toDomain as dtoToDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.Notification
import com.schoolos.android.domain.repository.NotificationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
    private val notificationDao: NotificationDao,
    private val networkMonitor: NetworkMonitor,
) : NotificationRepository {

    private val userId by lazy { kotlinx.coroutines.runBlocking { authManager.getStudentId() ?: "" } }

    override suspend fun getNotifications(page: Int): Result<List<Notification>> = runCatching {
        val isOnline = try { networkMonitor.isOnline.first() } catch (_: Exception) { true }
        if (isOnline) {
            val response = api.getNotifications(page)
            val notifications = response.data?.map { it.dtoToDomain() }
                ?: throw Exception(response.error?.message ?: "Gagal memuat notifikasi.")
            if (userId.isNotEmpty()) {
                notificationDao.insertAll(notifications.map { it.toEntity(userId) })
            }
            notifications
        } else {
            val cached = try { with(notificationDao.getNotifications(userId)) { first() } } catch (_: Exception) { emptyList() }
            cached.map { it.entityToDomain() }
        }
    }

    fun getCachedNotifications(): Flow<List<Notification>> {
        return notificationDao.getNotifications(userId).map { list -> list.map { it.entityToDomain() } }
    }

    override suspend fun getUnreadCount(): Result<Int> = runCatching {
        val isOnline = try { networkMonitor.isOnline.first() } catch (_: Exception) { true }
        if (isOnline) {
            api.getUnreadCount().data?.count ?: 0
        } else {
            try { with(notificationDao.getUnreadCount(userId)) { first() } } catch (_: Exception) { 0 }
        }
    }

    override suspend fun markRead(id: String) {
        try { api.markNotificationRead(id) } catch (_: Exception) {}
        try { notificationDao.markRead(id, Instant.now().toString()) } catch (_: Exception) {}
    }

    override suspend fun markAllRead() {
        try { api.markAllNotificationsRead() } catch (_: Exception) {}
    }

    override suspend fun broadcastNotification(
        classId: String,
        title: String,
        body: String,
        targetRoles: List<String>
    ): Result<Unit> = Result.success(Unit)
}
