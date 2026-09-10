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
import androidx.compose.material.icons.filled.EventAvailable
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
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
fun LazyListScope.studentAgendaContent(
    activeItems: List<LearningSession>,
    upcomingItems: List<LearningSession>,
    completedItems: List<LearningSession>,
    onSessionClick: (String) -> Unit,
    accentColor: Color,
) {
    if (activeItems.isEmpty() && upcomingItems.isEmpty() && completedItems.isEmpty()) {
        item {
            EmptyState(
                message = "Tidak ada jadwal untuk hari ini",
                icon = Icons.Default.EventAvailable,
                modifier = Modifier.fillMaxWidth().height(200.dp),
            )
        }
    } else {
        renderAgendaSection("SEDANG BERLANGSUNG", activeItems, { NeonSuccess }, onSessionClick)
        renderAgendaSection("SESI MENDATANG", upcomingItems, { StudentNeon }, onSessionClick)
        renderAgendaSection("SESI SELESAI", completedItems, { TextTertiary }, onSessionClick)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
private fun LazyListScope.renderAgendaSection(
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
        StudentSessionCard(session = session, accentColor = color, onClick = { onSessionClick(session.id) })
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
private fun StudentSessionCard(
    session: LearningSession,
    accentColor: Color,
    onClick: () -> Unit,
) {
    val title = session.subjectName ?: session.notes ?: "Pelajaran"
    val subjectName = title.substringBefore(" • ").substringBefore(" (Ruang").trim()
    val isActive = session.status == "active"
    val isCompleted = session.status == "completed"

    val (emoji, iconColor) = when {
        subjectName.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        subjectName.contains("IPA", ignoreCase = true) || subjectName.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        subjectName.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        subjectName.contains("Penjaskes", ignoreCase = true) || subjectName.contains("Olahraga", ignoreCase = true) -> Pair("⚽", Color(0xFFF97316))
        subjectName.contains("Agama", ignoreCase = true) -> Pair("🕌", NeonSuccess)
        subjectName.contains("IPS", ignoreCase = true) || subjectName.contains("Sejarah", ignoreCase = true) -> Pair("🌍", NeonWarning)
        subjectName.contains("Seni", ignoreCase = true) || subjectName.contains("Budaya", ignoreCase = true) -> Pair("🎨", AccentNeonPurple)
        else -> Pair("📖", TextTertiary)
    }

    val room = session.room ?: "Ruang Kelas"
    val teacherName = session.teacherName ?: "Guru Pengampu"
    val timeText = formatSessionTime(session.scheduledAt, session.endedAt)

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
                        Text("Oleh: $teacherName", fontSize = 12.sp, color = TextTertiary, fontWeight = FontWeight.SemiBold)
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

private fun formatSessionTime(scheduledAt: String?, endedAt: String?): String {
    if (scheduledAt == null) return "07.30 — 09.00 WIB"
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val outFormatter = SimpleDateFormat("HH.mm", Locale.getDefault()).apply {
            timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        }
        val cleanStart = scheduledAt.substringBefore(".")
        val startDate = parser.parse(cleanStart)
        val startTime = startDate?.let { outFormatter.format(it) } ?: "07.30"

        val endTime = if (endedAt != null) {
            val cleanEnd = endedAt.substringBefore(".")
            val endDate = parser.parse(cleanEnd)
            endDate?.let { outFormatter.format(it) } ?: "09.00"
        } else {
            val endCal = java.util.Calendar.getInstance(TimeZone.getTimeZone("Asia/Jakarta")).apply {
                if (startDate != null) time = startDate
                add(java.util.Calendar.MINUTE, 90)
            }
            outFormatter.format(endCal.time)
        }
        "$startTime — $endTime WIB"
    } catch (e: Exception) {
        "07.30 — 09.00 WIB"
    }
}