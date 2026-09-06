package com.schoolos.android.feature.notifications

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.EmptyState
import com.schoolos.android.core.designsystem.ErrorState
import com.schoolos.android.core.designsystem.GlassBorder
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
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationListScreen(
    onBack: (() -> Unit)? = null,
    onNotificationClick: (Notification) -> Unit = {},
    viewModel: NotificationListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val isParent  = com.schoolos.android.core.auth.isParentRole(state.userRole)
    val isTeacher = com.schoolos.android.core.auth.isTeacherRole(state.userRole)
    val child = if (state.childName.isNotBlank()) state.childName else "Anak"

    var selectedFilter by remember { mutableStateOf("Semua") }
    var selectedNotificationForDetail by remember { mutableStateOf<Notification?>(null) }

    val filterOptions = listOf("Semua", "Tugas & Kuis", "Nilai Akademik", "Materi & Kelas", "Pengumuman")

    val filteredNotifications = remember(state.notifications, selectedFilter) {
        when (selectedFilter) {
            "Tugas & Kuis" -> state.notifications.filter {
                val t = it.notificationType.lowercase()
                t.contains("assignment") || t.contains("quiz") || t.contains("tugas") || t.contains("kuis")
            }
            "Nilai Akademik" -> state.notifications.filter {
                val t = it.notificationType.lowercase()
                t.contains("grade") || t.contains("assessment") || t.contains("nilai")
            }
            "Materi & Kelas" -> state.notifications.filter {
                val t = it.notificationType.lowercase()
                t.contains("lesson") || t.contains("session") || t.contains("material") || t.contains("progress")
            }
            "Pengumuman" -> state.notifications.filter {
                val t = it.notificationType.lowercase()
                !t.contains("assignment") && !t.contains("quiz") && !t.contains("grade") &&
                        !t.contains("assessment") && !t.contains("lesson") && !t.contains("session")
            }
            else -> state.notifications
        }
    }

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
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 46.dp, bottom = 100.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        // ── 1. COSMIC TOP HEADER ─────────────────────────────
                        item {
                            CosmicNotificationTopBar(
                                onBack = onBack,
                                unreadCount = state.unreadCount,
                                markingAll = state.markingAll,
                                onMarkAllRead = { viewModel.markAllRead() }
                            )
                        }

                        // ── 2. ROLE SUMMARY BANNER ───────────────────────────
                        item {
                            NotificationHeroCard(
                                isTeacher = isTeacher,
                                isParent = isParent,
                                childName = child,
                                unreadCount = state.unreadCount,
                                totalCount = state.notifications.size
                            )
                        }

                        // ── 3. CATEGORY FILTER CHIPS ─────────────────────────
                        item {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                            ) {
                                items(filterOptions) { filter ->
                                    val isSelected = filter == selectedFilter
                                    val count = remember(state.notifications, filter) {
                                        when (filter) {
                                            "Tugas & Kuis" -> state.notifications.count {
                                                val t = it.notificationType.lowercase()
                                                t.contains("assignment") || t.contains("quiz") || t.contains("tugas") || t.contains("kuis")
                                            }
                                            "Nilai Akademik" -> state.notifications.count {
                                                val t = it.notificationType.lowercase()
                                                t.contains("grade") || t.contains("assessment") || t.contains("nilai")
                                            }
                                            "Materi & Kelas" -> state.notifications.count {
                                                val t = it.notificationType.lowercase()
                                                t.contains("lesson") || t.contains("session") || t.contains("material") || t.contains("progress")
                                            }
                                            "Pengumuman" -> state.notifications.count {
                                                val t = it.notificationType.lowercase()
                                                !t.contains("assignment") && !t.contains("quiz") && !t.contains("grade") &&
                                                        !t.contains("assessment") && !t.contains("lesson") && !t.contains("session")
                                            }
                                            else -> state.notifications.size
                                        }
                                    }

                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(if (isSelected) NeonBlue.copy(alpha = 0.15f) else CosmicNavy)
                                            .border(
                                                1.dp,
                                                if (isSelected) NeonBlue.copy(alpha = 0.5f) else GlassBorder,
                                                RoundedCornerShape(14.dp),
                                            )
                                            .clickable { selectedFilter = filter }
                                            .padding(horizontal = 14.dp, vertical = 8.dp),
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                filter,
                                                fontSize = 12.sp,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                color = if (isSelected) NeonBlue else TextSecondary,
                                            )
                                            if (count > 0) {
                                                Spacer(Modifier.width(6.dp))
                                                Box(
                                                    modifier = Modifier
                                                        .clip(CircleShape)
                                                        .background(if (isSelected) NeonBlue else CosmicSurface)
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(
                                                        count.toString(),
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Black,
                                                        color = if (isSelected) Color.White else TextTertiary
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // ── 4. NOTIFICATION LIST OR EMPTY STATE ───────────────
                        if (filteredNotifications.isEmpty()) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 40.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    EmptyState(
                                        message = if (selectedFilter != "Semua") "Tidak ada notifikasi dalam kategori $selectedFilter"
                                        else if (isTeacher) "Belum ada aktivitas baru dari kelas"
                                        else if (isParent) "Belum ada notifikasi untuk $child"
                                        else "Belum ada notifikasi baru",
                                        icon = Icons.Default.Notifications
                                    )
                                }
                            }
                        } else {
                            items(filteredNotifications, key = { it.id }) { notification ->
                                CosmicNotificationCard(
                                    notification = notification,
                                    onClick = {
                                        viewModel.markRead(notification.id)
                                        selectedNotificationForDetail = notification
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // ── INTERACTIVE NOTIFICATION DETAIL DIALOG ────────────────────────────────
    selectedNotificationForDetail?.let { notif ->
        NotificationDetailDialog(
            notification = notif,
            onDismiss = { selectedNotificationForDetail = null },
            onOpenRelated = {
                selectedNotificationForDetail = null
                onNotificationClick(notif)
            }
        )
    }
}

@Composable
private fun CosmicNotificationTopBar(
    onBack: (() -> Unit)?,
    unreadCount: Int,
    markingAll: Boolean,
    onMarkAllRead: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (onBack != null) {
                CustomBackButton(onClick = onBack)
                Spacer(Modifier.width(12.dp))
            }
            Column {
                Text(
                    "Pusat Notifikasi",
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp,
                    color = TextPrimary,
                    letterSpacing = (-0.5).sp
                )            
            }
        }

        if (unreadCount > 0) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonBlue.copy(alpha = 0.12f))
                    .border(1.dp, NeonBlue.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                    .clickable(enabled = !markingAll, onClick = onMarkAllRead)
                    .padding(horizontal = 12.dp, vertical = 7.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (markingAll) {
                        CircularProgressIndicator(
                            strokeWidth = 2.dp,
                            color = NeonBlue,
                            modifier = Modifier.size(13.dp)
                        )
                    } else {
                        Icon(
                            Icons.Default.DoneAll,
                            contentDescription = null,
                            tint = NeonBlue,
                            modifier = Modifier.size(15.dp)
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "Baca Semua",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonBlue
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationHeroCard(
    isTeacher: Boolean,
    isParent: Boolean,
    childName: String,
    unreadCount: Int,
    totalCount: Int,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.linearGradient(
                    listOf(
                        if (unreadCount > 0) StudentNeon.copy(alpha = 0.85f) else NeonBlue.copy(alpha = 0.75f),
                        CosmicNavy
                    )
                )
            )
            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
            .padding(18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (unreadCount > 0) NeonWarning else NeonSuccess)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        if (unreadCount > 0) "$unreadCount BELUM DIBACA" else "SEMUA SUDAH DIBACA",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White.copy(alpha = 0.9f),
                        letterSpacing = 1.sp
                    )
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    if (isTeacher) "Pantau Seluruh Aktivitas Akademik & Pengumpulan Siswa"
                    else if (isParent) "Pemberitahuan Tugas, Nilai, & Kehadiran $childName"
                    else "Pantau Tugas, Materi, dan Hasil Penilaian Belajarmu",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    lineHeight = 18.sp
                )
            }
            Spacer(Modifier.width(12.dp))
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White.copy(alpha = 0.15f))
                    .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (unreadCount > 0) Icons.Default.NotificationsActive else Icons.Default.Notifications,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
private fun CosmicNotificationCard(notification: Notification, onClick: () -> Unit) {
    val icon = iconForType(notification.notificationType)
    val accentColor = colorForType(notification.notificationType)
    val isUnread = !notification.isRead
    val categoryLabel = labelForType(notification.notificationType)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (isUnread) CosmicNavy else CosmicNavy.copy(alpha = 0.7f))
            .border(
                1.dp,
                if (isUnread) accentColor.copy(alpha = 0.45f) else GlassBorder,
                RoundedCornerShape(16.dp),
            )
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            // Neon Icon Container
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.12f))
                    .border(1.dp, accentColor.copy(alpha = 0.3f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = accentColor, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(accentColor.copy(alpha = 0.12f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            categoryLabel,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = accentColor,
                            letterSpacing = 0.5.sp
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            formatRelative(notification.createdAt),
                            fontSize = 10.sp,
                            color = TextTertiary,
                            fontWeight = FontWeight.Medium
                        )
                        if (isUnread) {
                            Spacer(Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(NeonError)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(6.dp))

                Text(
                    text = notification.title,
                    fontWeight = if (isUnread) FontWeight.Bold else FontWeight.SemiBold,
                    fontSize = 13.sp,
                    color = if (isUnread) TextPrimary else TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )

                if (notification.body.isNotBlank()) {
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = notification.body,
                        fontSize = 12.sp,
                        color = TextTertiary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 17.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationDetailDialog(
    notification: Notification,
    onDismiss: () -> Unit,
    onOpenRelated: () -> Unit,
) {
    val accentColor = colorForType(notification.notificationType)
    val icon = iconForType(notification.notificationType)
    val category = labelForType(notification.notificationType)

    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(CosmicNavy)
                .border(1.dp, GlassBorder, RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(accentColor.copy(alpha = 0.15f))
                                .border(1.dp, accentColor.copy(alpha = 0.35f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(icon, null, tint = accentColor, modifier = Modifier.size(20.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(accentColor.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(category, fontSize = 10.sp, fontWeight = FontWeight.Black, color = accentColor)
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(CosmicSurface)
                    ) {
                        Icon(Icons.Default.Close, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
                    }
                }

                Spacer(Modifier.height(16.dp))

                Text(
                    notification.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Spacer(Modifier.height(6.dp))

                Text(
                    formatFullDate(notification.createdAt),
                    fontSize = 11.sp,
                    color = TextTertiary,
                    fontWeight = FontWeight.Medium
                )

                Spacer(Modifier.height(14.dp))
                HorizontalDivider(color = GlassBorder, thickness = 0.8.dp)
                Spacer(Modifier.height(14.dp))

                Text(
                    notification.body.ifBlank { "Tidak ada rincian tambahan untuk notifikasi ini." },
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp
                )

                Spacer(Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicSurface)
                            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                            .clickable(onClick = onDismiss)
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Tutup", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }

                    Spacer(Modifier.width(10.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Brush.horizontalGradient(listOf(StudentNeon, NeonBlue)))
                            .clickable(onClick = onOpenRelated)
                            .padding(horizontal = 18.dp, vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Buka Terkait", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}

private fun labelForType(type: String): String = when {
    type.contains("assignment") || type.contains("tugas") -> "TUGAS"
    type.contains("quiz") || type.contains("kuis") -> "KUIS"
    type.contains("grade") || type.contains("assessment") || type.contains("nilai") -> "NILAI"
    type.contains("lesson") || type.contains("session") || type.contains("materi") -> "MATERI"
    type.contains("progress") -> "PROGRES"
    type.contains("achievement") -> "PENGHARGAAN"
    else -> "PENGUMUMAN"
}

private fun iconForType(type: String): ImageVector = when {
    type.contains("assignment") || type.contains("tugas") -> Icons.AutoMirrored.Filled.Assignment
    type.contains("quiz") || type.contains("kuis") -> Icons.Default.Quiz
    type.contains("grade") || type.contains("assessment") || type.contains("nilai") -> Icons.Default.Grade
    type.contains("lesson") || type.contains("session") || type.contains("materi") -> Icons.Default.Book
    type.contains("progress") -> Icons.AutoMirrored.Filled.TrendingUp
    type.contains("achievement") -> Icons.Default.EmojiEvents
    else -> Icons.Default.Notifications
}

private fun colorForType(type: String): Color = when {
    type.contains("assignment") || type.contains("tugas") -> StudentNeon
    type.contains("quiz") || type.contains("kuis") -> NeonWarning
    type.contains("grade") || type.contains("assessment") || type.contains("nilai") -> NeonSuccess
    type.contains("lesson") || type.contains("session") || type.contains("materi") -> NeonBlue
    type.contains("progress") -> NeonBlue
    type.contains("achievement") -> StudentNeon
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
            minutes < 60 -> "${minutes}m lalu"
            hours < 24 -> "${hours}j lalu"
            days < 7 -> "${days}h lalu"
            else -> {
                val zdt = ZonedDateTime.ofInstant(instant, ZoneId.systemDefault())
                zdt.format(DateTimeFormatter.ofPattern("dd MMM"))
            }
        }
    } catch (_: Exception) {
        iso.substringBefore("T")
    }
}

private fun formatFullDate(iso: String): String {
    return try {
        val instant = Instant.parse(iso)
        val zdt = ZonedDateTime.ofInstant(instant, ZoneId.of("Asia/Jakarta"))
        zdt.format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy • HH:mm 'WIB'", Locale("id", "ID")))
    } catch (_: Exception) {
        iso
    }
}
