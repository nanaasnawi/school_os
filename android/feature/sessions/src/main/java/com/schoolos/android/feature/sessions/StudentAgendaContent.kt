package com.schoolos.android.feature.sessions

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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassOverlay
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.StatusChip
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.LearningSession

fun LazyListScope.studentAgendaContent(
    activeItems: List<LearningSession>,
    upcomingItems: List<LearningSession>,
    completedItems: List<LearningSession>,
    onSessionClick: (String) -> Unit
) {
    if (activeItems.isEmpty() && upcomingItems.isEmpty() && completedItems.isEmpty()) {
        item {
            Box(modifier = Modifier.fillMaxWidth().height(300.dp), contentAlignment = Alignment.Center) {
                Text("Tidak ada jadwal untuk hari ini", color = TextTertiary, fontSize = 14.sp)
            }
        }
    } else {
        renderAgendaSection("🔴 SEDANG BERLANGSUNG", activeItems, { NeonSuccess }, onSessionClick)
        renderAgendaSection("⏱ SESI MENDATANG", upcomingItems, { StudentNeon }, onSessionClick)
        renderAgendaSection("✅ SESI SELESAI", completedItems, { TextTertiary }, onSessionClick)
    }
}

private fun LazyListScope.renderAgendaSection(
    title: String,
    items: List<LearningSession>,
    colorProvider: @Composable () -> Color,
    onSessionClick: (String) -> Unit,
) {
    if (items.isEmpty()) return

    item {
        val color = colorProvider()
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(start = 4.dp, top = 8.dp, bottom = 4.dp)
        ) {
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Black, color = color, letterSpacing = 1.sp)
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .size(width = 24.dp, height = 18.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text("${items.size}", color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    items(items, key = { it.id }) { session ->
        val color = colorProvider()
        StudentSessionCard(session = session, accentColor = color, onClick = { onSessionClick(session.id) })
    }
}

@Composable
private fun StudentSessionCard(session: LearningSession, accentColor: Color, onClick: () -> Unit) {
    val title = session.notes ?: "Pelajaran"
    val isActive = session.status == "active"
    val isCompleted = session.status == "completed"

    val (emoji, iconBg) = when {
        title.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        title.contains("IPA", ignoreCase = true) || title.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        title.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        title.contains("Penjaskes", ignoreCase = true) || title.contains("Olahraga", ignoreCase = true) -> Pair("⚽", Color(0xFFF97316))
        else -> Pair("📖", TextTertiary)
    }

    val room = "Ruang 7A"
    val teacherName = "Bpk. Andi Pratama"

    Box(
        modifier = Modifier
            .shadow(4.dp, RoundedCornerShape(22.dp), spotColor = GlassOverlay)
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(CosmicNavy)
            .border(1.dp, if (isActive) accentColor.copy(alpha = 0.5f) else GlassBorder, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
    ) {
        Column {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // PREMIUM ICON BLOCK
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(iconBg.copy(alpha = 0.12f))
                        .border(1.dp, iconBg.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(emoji, fontSize = 24.sp)
                }

                Spacer(Modifier.width(16.dp))

                // CONTENT BLOCK
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        title.substringBefore(" (Ruang").trim(),
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        color = if (isCompleted) TextSecondary else TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Oleh: $teacherName", 
                        fontSize = 11.sp, 
                        color = TextTertiary, 
                        fontWeight = FontWeight.Bold
                    )
                }

                StatusChip(label = session.status)
            }

            // METADATA STRIP
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (isActive) accentColor.copy(alpha = 0.04f) else Color.Transparent)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Schedule, null, tint = if (isActive) accentColor else TextTertiary, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "07.30 — 09.00 WIB", 
                        fontSize = 11.sp, 
                        color = if (isActive) TextPrimary else TextSecondary, 
                        fontWeight = FontWeight.Black
                    )
                    
                    Spacer(Modifier.width(16.dp))
                    
                    Icon(Icons.Default.LocationOn, null, tint = TextTertiary, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(room, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                }

                if (isActive) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(accentColor.copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("BERJALAN 35'", fontSize = 9.sp, color = accentColor, fontWeight = FontWeight.Black)
                    }
                }
            }

            if (isActive) {
                // INTEGRATED PROGRESS
                Box(modifier = Modifier.fillMaxWidth().height(4.dp).background(accentColor.copy(alpha = 0.1f))) {
                    Box(modifier = Modifier.fillMaxWidth(0.65f).height(4.dp).background(accentColor))
                }
            }
        }
    }
}
