package com.schoolos.android.feature.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.EmptyState
import com.schoolos.android.core.designsystem.ErrorState
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.PullRefreshContainer
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.Notification
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationListScreen(
    onBack: (() -> Unit)? = null,
    onNotificationClick: (Notification) -> Unit = {},
    viewModel: NotificationListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val role = state.userRole.lowercase()
    val isTeacher = role == "teacher" || role == "guru"
    val isParent  = role == "parent" || role == "ortu" || role == "wali"

    Scaffold(containerColor = CosmicBlack) { padding ->
        PullRefreshContainer(
            isRefreshing = state.isRefreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    ErrorState(message = state.error!!, onRetry = viewModel::refresh)
                }
                state.notifications.isEmpty() -> {
                    EmptyState(
                        if (isTeacher) "Belum ada laporan aktivitas kelas" 
                        else if (isParent) "Belum ada notifikasi untuk Ahmad" 
                        else "Belum ada notifikasi baru", 
                        Icons.Default.Notifications
                    )
                }
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    // ── REFACTORED NON-OVERLAPPING LIST HEADER ─────────────
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 0.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (onBack != null) {
                                    CustomBackButton(onClick = onBack)
                                }
                            }
                        }
                    }

                    // Section Header
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                            Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(NeonBlue))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                if (isTeacher) "Aktivitas Terbaru" else if (isParent) "Update Untuk Ahmad" else "Terbaru", 
                                fontWeight = FontWeight.Black, fontSize = 14.sp, color = TextPrimary
                            )
                            Spacer(Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(NeonBlue.copy(alpha = 0.08f))
                                    .padding(horizontal = 8.dp, vertical = 2.dp),
                            ) {
                                Text("${state.notifications.count { !it.isRead }} Baru", fontSize = 10.sp, color = NeonBlue, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    items(state.notifications, key = { it.id }) { notification ->
                        CompactNotificationCard(
                            notification = notification,
                            onClick = { onNotificationClick(notification) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactNotificationCard(notification: Notification, onClick: () -> Unit) {
    val icon = iconForType(notification.notificationType)
    val color = colorForType(notification.notificationType)
    val isUnread = !notification.isRead

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (isUnread) Color.White else Color.White.copy(alpha = 0.6f))
            .border(
                1.dp,
                if (isUnread) color.copy(alpha = 0.2f) else GlassBorder2,
                RoundedCornerShape(14.dp),
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.08f))
                    .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        notification.title,
                        fontWeight = if (isUnread) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 13.sp,
                        color = if (isUnread) TextPrimary else TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    if (isUnread) {
                        Spacer(Modifier.width(6.dp))
                        Box(Modifier.size(6.dp).clip(CircleShape).background(NeonError))
                    }
                }
                notification.body.takeIf { it.isNotBlank() }?.let {
                    Spacer(Modifier.height(2.dp))
                    Text(it, fontSize = 11.sp, color = TextTertiary, maxLines = 2, overflow = TextOverflow.Ellipsis, lineHeight = 16.sp)
                }
                Spacer(Modifier.height(4.dp))
                Text(formatRelative(notification.createdAt), fontSize = 9.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
            }
        }
    }
}

private fun iconForType(type: String): ImageVector = when {
    type.contains("assignment") -> Icons.AutoMirrored.Filled.Assignment
    type.contains("quiz") -> Icons.Default.Quiz
    type.contains("grade") -> Icons.Default.Grade
    type.contains("lesson") || type.contains("session") -> Icons.Default.Book
    type.contains("progress") -> Icons.AutoMirrored.Filled.TrendingUp
    type.contains("achievement") -> Icons.Default.EmojiEvents
    else -> Icons.Default.Notifications
}

private fun colorForType(type: String): Color = when {
    type.contains("assignment") -> StudentNeon
    type.contains("quiz") -> NeonBlue
    type.contains("grade") -> NeonSuccess
    type.contains("lesson") || type.contains("session") -> NeonWarning
    type.contains("progress") -> NeonBlue
    type.contains("achievement") -> NeonWarning
    else -> NeonError
}

private fun formatRelative(iso: String): String {
    return try {
        val instant = Instant.parse(iso)
        val now = Instant.now()
        val minutes = ChronoUnit.MINUTES.between(instant, now)
        val hours = ChronoUnit.HOURS.between(instant, now)
        val days = ChronoUnit.DAYS.between(instant, now)
        when {
            minutes < 1 -> "Baru saja"
            minutes < 60 -> "${minutes} m lalu"
            hours < 24 -> "${hours} j lalu"
            days < 7 -> "${days} h lalu"
            else -> {
                val zdt = ZonedDateTime.ofInstant(instant, ZoneId.systemDefault())
                zdt.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM"))
            }
        }
    } catch (_: Exception) { iso }
}
