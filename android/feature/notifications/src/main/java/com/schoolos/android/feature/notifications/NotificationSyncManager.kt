package com.schoolos.android.feature.notifications

import android.content.Context
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.notification.SystemNotificationHelper
import com.schoolos.android.domain.repository.NotificationRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import com.schoolos.android.core.network.MaintenanceManager
import javax.inject.Singleton

@Singleton
class NotificationSyncManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val notificationRepository: NotificationRepository,
    private val authManager: AuthManager,
    private val maintenanceManager: MaintenanceManager,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val prefs = context.getSharedPreferences("schoolos_notif_sync", Context.MODE_PRIVATE)
    private var isStarted = false

    fun start() {
        if (isStarted) return
        isStarted = true

        // 1. Real-time SSE Stream Listener (Instant < 1s alert)
        listenSseStream()

        // 2. Periodic Polling & Maintenance Check (every 15 seconds)
        scope.launch {
            while (isActive) {
                try {
                    val isMaint = maintenanceManager.checkServerStatus()
                    if (!isMaint && authManager.isLoggedIn) {
                        syncNotifications()
                    }
                } catch (_: Exception) {}
                delay(15_000)
            }
        }
    }

    private fun listenSseStream() {
        scope.launch {
            val client = OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .build()

            while (isActive) {
                try {
                    val token = authManager.getAccessToken()
                    if (!token.isNullOrBlank()) {
                        val serverUrl = authManager.getCustomServerUrl() ?: com.schoolos.android.core.common.BuildConfig.API_BASE_URL
                        val streamUrl = serverUrl.trimEnd('/') + "/announcements/stream"

                        val request = Request.Builder()
                            .url(streamUrl)
                            .addHeader("Accept", "text/event-stream")
                            .addHeader("Authorization", "Bearer $token")
                            .build()

                        client.newCall(request).execute().use { response ->
                            if (response.isSuccessful) {
                                val source = response.body?.source()
                                while (isActive && source != null && !source.exhausted()) {
                                    val line = source.readUtf8Line() ?: break
                                    if (line.startsWith("data:")) {
                                        val jsonStr = line.removePrefix("data:").trim()
                                        if (jsonStr.isNotBlank()) {
                                            try {
                                                val obj = JSONObject(jsonStr)
                                                val id = obj.optString("id")
                                                val title = obj.optString("title")
                                                val content = obj.optString("content")

                                                val shownIds = prefs.getStringSet("shown_notif_ids", emptySet()) ?: emptySet()
                                                if (id.isNotBlank() && !shownIds.contains(id)) {
                                                    val mutableShownIds = shownIds.toMutableSet()
                                                    mutableShownIds.add(id)
                                                    prefs.edit().putStringSet("shown_notif_ids", mutableShownIds).apply()

                                                    SystemNotificationHelper.showNotification(
                                                        context = context,
                                                        notificationId = id.hashCode(),
                                                        title = "📢 $title",
                                                        message = content
                                                    )
                                                }
                                            } catch (_: Exception) {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (_: Exception) {
                    // Connection dropped, retry after 5 seconds
                }
                delay(5_000)
            }
        }
    }

    suspend fun syncNotifications() {
        try {
            val result = notificationRepository.getNotifications(page = 1)
            result.onSuccess { notifications ->
                val shownIds = prefs.getStringSet("shown_notif_ids", emptySet()) ?: emptySet()
                val mutableShownIds = shownIds.toMutableSet()
                var newShown = false

                // Process unread notifications
                val unread = notifications.filter { !it.isRead }
                for (notif in unread) {
                    if (!mutableShownIds.contains(notif.id)) {
                        mutableShownIds.add(notif.id)
                        newShown = true

                        // Trigger native Android system notification
                        val notifId = notif.id.hashCode()
                        SystemNotificationHelper.showNotification(
                            context = context,
                            notificationId = notifId,
                            title = "📢 ${notif.title}",
                            message = notif.body
                        )
                    }
                }

                if (newShown) {
                    prefs.edit().putStringSet("shown_notif_ids", mutableShownIds).apply()
                }
            }
        } catch (_: Exception) {
            // Silently ignore network failures during background poll
        }
    }
}
