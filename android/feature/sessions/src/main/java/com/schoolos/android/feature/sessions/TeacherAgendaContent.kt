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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.StatusChip
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.LearningSession

fun LazyListScope.teacherAgendaContent(
    activeItems: List<LearningSession>,
    upcomingItems: List<LearningSession>,
    completedItems: List<LearningSession>,
    onSessionClick: (String) -> Unit
) {
    if (activeItems.isEmpty() && upcomingItems.isEmpty() && completedItems.isEmpty()) {
        item {
            Box(modifier = Modifier.fillMaxWidth().height(300.dp), contentAlignment = Alignment.Center) {
                Text("Tidak ada agenda mengajar hari ini", color = TextTertiary, fontSize = 14.sp)
            }
        }
    } else {
        renderTeacherAgendaSection("🔴 Mengajar Sekarang", activeItems, NeonSuccess, onSessionClick)
        renderTeacherAgendaSection("⏱ Sesi Berikutnya", upcomingItems, com.schoolos.android.core.designsystem.TeacherNeon, onSessionClick)
        renderTeacherAgendaSection("✅ Sesi Selesai", completedItems, TextTertiary, onSessionClick)
    }
}

private fun LazyListScope.renderTeacherAgendaSection(
    title: String,
    items: List<LearningSession>,
    color: Color,
    onSessionClick: (String) -> Unit,
) {
    if (items.isEmpty()) return

    item {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
        ) {
            Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(color))
            Spacer(Modifier.width(8.dp))
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
            Spacer(Modifier.width(6.dp))
            Text("${items.size}", color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }

    items(items, key = { it.id }) { session ->
        TeacherSessionCard(session = session, accentColor = color, onClick = { onSessionClick(session.id) })
    }
}

@Composable
private fun TeacherSessionCard(session: LearningSession, accentColor: Color, onClick: () -> Unit) {
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

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color.White)
            .border(1.dp, if (isActive) accentColor.copy(alpha = 0.3f) else GlassBorder, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
    ) {
        Column {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(iconBg.copy(alpha = 0.08f))
                        .border(1.dp, iconBg.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(emoji, fontSize = 20.sp)
                }

                Spacer(Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        title.substringBefore(" (Ruang").trim(),
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(2.dp))
                    Text("Kelas 7A • Gedung B", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
                }

                StatusChip(label = session.status)
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 14.dp, end = 14.dp, bottom = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Schedule, null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("07:30 WIB", fontSize = 11.sp, color = if (isCompleted) TextTertiary else TextSecondary, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(12.dp))
                    Icon(Icons.Default.LocationOn, null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Ruang 7A", fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                }

                if (isActive) {
                    Text("24/28 Siswa Hadir", fontSize = 10.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
                }
            }

            if (isActive) {
                Box(modifier = Modifier.fillMaxWidth().height(4.dp).background(accentColor.copy(alpha = 0.08f))) {
                    Box(modifier = Modifier.fillMaxWidth(0.85f).height(4.dp).background(accentColor))
                }
            }
        }
    }
}
