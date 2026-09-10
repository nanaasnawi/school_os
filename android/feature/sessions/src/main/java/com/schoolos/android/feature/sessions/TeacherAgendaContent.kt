package com.schoolos.android.feature.sessions

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningSession
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
fun LazyListScope.teacherAgendaContent(
    activeItems: List<LearningSession>,
    upcomingItems: List<LearningSession>,
    completedItems: List<LearningSession>,
    onSessionClick: (String) -> Unit,
    accentColor: Color,
) {
    if (activeItems.isEmpty() && upcomingItems.isEmpty() && completedItems.isEmpty()) {
        item {
            EmptyState(
                message = "Tidak ada agenda mengajar hari ini",
                icon = Icons.Default.Schedule,
                modifier = Modifier.fillMaxWidth().height(200.dp),
            )
        }
    } else {
        renderTeacherSection("MENGAJAR SEKARANG", activeItems, { NeonSuccess }, onSessionClick)
        renderTeacherSection("SESI BERIKUTNYA", upcomingItems, { TeacherNeon }, onSessionClick)
        renderTeacherSection("SESI SELESAI", completedItems, { TextTertiary }, onSessionClick)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
private fun LazyListScope.renderTeacherSection(
    title: String,
    items: List<LearningSession>,
    colorProvider: @Composable () -> Color,
    onSessionClick: (String) -> Unit,
) {
    if (items.isEmpty()) return

    item {
        SectionHeader(
            title = title,
            count = items.size,
            color = colorProvider(),
        )
    }

    items(items, key = { it.id }) { session ->
        val color = colorProvider()
        TeacherSessionCard(session = session, accentColor = color, onClick = { onSessionClick(session.id) })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SectionHeader(
    title: String,
    count: Int,
    color: Color,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 10.dp),
    ) {
        // Section marker bar
        Box(
            modifier = Modifier
                .width(4.dp)
                .height(18.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(color)
        )
        Spacer(Modifier.width(8.dp))
        Text(title, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = color, letterSpacing = 0.8.sp)
        Spacer(Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(color.copy(alpha = 0.12f))
                .padding(horizontal = 9.dp, vertical = 2.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text("$count", color = color, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TeacherSessionCard(
    session: LearningSession,
    accentColor: Color,
    onClick: () -> Unit,
) {
    val title = session.notes ?: "Pelajaran"
    val subjectName = session.subjectName ?: title.substringBefore(" • ").substringBefore(" (Ruang").trim()
    val isActive = session.status == "active"
    val isCompleted = session.status == "completed"

    val (emoji, iconColor) = when {
        title.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        title.contains("IPA", ignoreCase = true) || title.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        title.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        title.contains("Penjaskes", ignoreCase = true) || title.contains("Olahraga", ignoreCase = true) -> Pair("⚽", Color(0xFFF97316))
        title.contains("IPS", ignoreCase = true) || title.contains("Sejarah", ignoreCase = true) -> Pair("🌍", NeonWarning)
        title.contains("Agama", ignoreCase = true) -> Pair("🕌", NeonSuccess)
        title.contains("Seni", ignoreCase = true) || title.contains("Budaya", ignoreCase = true) -> Pair("🎨", AccentNeonPurple)
        else -> Pair("📖", TextTertiary)
    }

    val period = formatSessionPeriod(session.scheduledAt)
    val timeText = formatTeacherTime(session.scheduledAt)
    val room = session.room ?: "Ruang Kelas"

    Box(
        modifier = Modifier
            .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .background(
                if (isActive) Brush.linearGradient(listOf(accentColor.copy(alpha = 0.07f), Color.Transparent))
                else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
            )
            .border(
                1.dp,
                if (isActive) accentColor.copy(alpha = 0.55f) else GlassBorder,
                RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .animateContentSize(),
    ) {
        Column {
            // Main Content Row
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Subject Icon
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(iconColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(emoji, fontSize = 26.sp)
                }

                Spacer(Modifier.width(16.dp))

                // Content
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        subjectName,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 16.sp,
                        color = if (isCompleted) TextSecondary else TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.height(4.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(session.className ?: "Kelas Binaan", fontSize = 12.sp, color = TextTertiary, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(if (isActive) accentColor else TextTertiary.copy(alpha = 0.4f))
                        )
                    }
                }

                StatusChip(label = session.status)
            }

            HorizontalDivider(color = GlassBorder, thickness = 1.dp)

            // Metadata Strip
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Period Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isActive) accentColor.copy(alpha = 0.15f) else CosmicSurface3)
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                        ) {
                            Text(
                                period,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isActive) accentColor else TextTertiary,
                                letterSpacing = 0.3.sp,
                            )
                        }
                        Spacer(Modifier.width(10.dp))

                        // Time
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, null, tint = if (isActive) accentColor else TextTertiary, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                timeText,
                                fontSize = 12.sp,
                                color = if (isActive) TextPrimary else TextSecondary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(Modifier.width(16.dp))

                        // Room
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, null, tint = TextTertiary, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                room,
                                fontSize = 12.sp,
                                color = TextSecondary,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }

                    if (isActive) {
                        LiveIndicator(accentColor)
                    }
                }
            }

            // Active Progress Bar
            if (isActive) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(accentColor.copy(alpha = 0.12f)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.65f)
                            .height(4.dp)
                            .background(accentColor)
                            .clip(RoundedCornerShape(2.dp)),
                    )
                }
            }
        }
    }
}

@Composable
private fun LiveIndicator(accentColor: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(accentColor.copy(alpha = 0.1f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(accentColor)
                    .animateInfinitePulse(accentColor),
            )
            Spacer(Modifier.width(6.dp))
            Text(
                "LIVE",
                fontSize = 9.sp,
                color = accentColor,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.5.sp,
            )
        }
    }
}

@Composable
private fun Modifier.animateInfinitePulse(color: Color): Modifier = composed {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
        label = "pulseAlpha",
    )
    this.drawBehind {
        drawCircle(
            color = color.copy(alpha = alpha),
            radius = (3.dp).toPx(),
            center = androidx.compose.ui.geometry.Offset((3.dp).toPx(), (3.dp).toPx()),
        )
    }
}

private fun formatTeacherTime(dateStr: String?): String {
    if (dateStr.isNullOrBlank()) return "08.00 WIB"
    return try {
        val instant = Instant.parse(dateStr)
        val zdt = instant.atZone(ZoneId.of("Asia/Jakarta"))
        String.format(java.util.Locale.US, "%02d.%02d WIB", zdt.hour, zdt.minute)
    } catch (_: Exception) {
        "08.00 WIB"
    }
}

fun formatSessionPeriod(dateStr: String?): String {
    if (dateStr.isNullOrBlank()) return "Jam Ke-1"
    return try {
        val instant = Instant.parse(dateStr)
        val zdt = instant.atZone(ZoneId.of("Asia/Jakarta"))
        val hour = zdt.hour
        val minute = zdt.minute
        val totalMinutes = hour * 60 + minute
        when {
            totalMinutes < 9 * 60 + 30 -> "Jam Ke-1"
            totalMinutes < 11 * 60 -> "Jam Ke-2"
            totalMinutes < 12 * 60 + 45 -> "Jam Ke-3"
            totalMinutes < 14 * 60 -> "Jam Ke-4"
            else -> "Jam Ke-5"
        }
    } catch (_: Exception) {
        "Jam Ke-1"
    }
}