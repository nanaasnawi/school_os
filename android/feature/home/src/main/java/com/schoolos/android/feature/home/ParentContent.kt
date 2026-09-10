package com.schoolos.android.feature.home

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.EventNote
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.DonutChart
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

data class ActivityItem(
    val title: String,
    val description: String,
    val timestamp: String,
    val type: ActivityType = ActivityType.INFO
)

enum class ActivityType {
    ATTENDANCE, ASSIGNMENT, GRADE, ACHIEVEMENT, INFO
}

fun LazyListScope.parentContent(
    childName: String = "",
    childClass: String = "",
    attendanceRate: String = "-",
    presentDays: String = "-",
    permitDays: String = "-",
    absentDays: String = "-",
    assignmentsCount: String = "0",
    activities: List<ActivityItem> = emptyList(),
    currentActivity: String = "",
    studentStatus: String = "Siswa Aktif",
    onNavigateToProgress: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToAchievements: () -> Unit,
) {
    val displayChildName = if (childName.isNotBlank() && childName != "-") childName else "Anak Anda"
    val displayClass = if (childClass.isNotBlank() && childClass != "-") childClass else "Kelas Aktif"
    val displayActivity = if (currentActivity.isNotBlank()) currentActivity else "Terdaftar Aktif di $displayClass"

    // ── 1. INTEGRATED CHILD HUB (Glassmorphic) ──
    item {
        ParentIntegratedChildHub(
            name = displayChildName,
            kelas = displayClass,
            currentActivity = displayActivity,
            status = studentStatus,
            onClick = onNavigateToProgress
        )
    }

    // ── 2. GUARDIAN TOOLBOX (Minimalist Circular) ──
    item {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            val tools = listOf(
                QuickAction("Pesan", Icons.AutoMirrored.Filled.Message, NeonBlue, onNavigateToNotifications),
                QuickAction("Izin", Icons.Default.EventNote, NeonWarning),
                QuickAction("Rapor", Icons.Default.Assessment, ParentNeon, onNavigateToProgress),
                QuickAction("Tugas", Icons.Default.Assignment, NeonBlue, onNavigateToAssignments),
                QuickAction("Lencana", Icons.Default.EmojiEvents, NeonSuccess, onNavigateToAchievements),
            )
            tools.forEach { tool -> GuardianToolboxButton(tool) }
        }
    }

    // ── 3. ATTENDANCE & ACADEMIC HUB ──
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Ringkasan Kehadiran", "Semester Ganjil 2026/2027")
                Spacer(Modifier.height(16.dp))
                val parsedRate = attendanceRate.removeSuffix("%").toFloatOrNull()?.let { it / 100f } ?: 0f
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    DonutChart(
                        percentage = parsedRate,
                        activeColor = NeonSuccess,
                        backgroundColor = NeonSuccess.copy(alpha = 0.08f),
                        labelText = attendanceRate,
                        modifier = Modifier.size(100.dp),
                        strokeWidth = 18f,
                    )
                    Spacer(Modifier.width(20.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        ParentAttendanceLegendRow("Hadir", presentDays, NeonSuccess)
                        ParentAttendanceLegendRow("Izin",  permitDays,  NeonBlue)
                        ParentAttendanceLegendRow("Alfa",  absentDays,  NeonError)
                    }
                }
            }
        }
    }

    // ── 4. VERTICAL ACTIVITY TIMELINE (Child's Day) ──
    item {
        Text(
            "Aktivitas Sekolah $displayChildName",
            fontWeight = FontWeight.Black,
            fontSize = 15.sp,
            color = TextPrimary,
            modifier = Modifier.padding(start = 4.dp, top = 8.dp)
        )
    }

    // Use dynamic activities if provided, otherwise show empty state
    if (activities.isEmpty()) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Belum ada aktivitas terbaru",
                    fontSize = 13.sp,
                    color = TextTertiary,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    } else {
        items(activities) { activity ->
            ParentTimelineItem(
                title = activity.title,
                desc = activity.description,
                time = activity.timestamp,
                type = activity.type
            )
        }
    }

    item { Spacer(Modifier.height(20.dp)) }
}

@Composable
private fun ParentIntegratedChildHub(
    name: String,
    kelas: String,
    currentActivity: String,
    status: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.horizontalGradient(listOf(ParentNeon, Color(0xFFBE185D))))
            .clickable(onClick = onClick)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
                    .border(2.dp, Color.White.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, null, tint = Color.White, modifier = Modifier.size(32.dp))
            }
            
            Spacer(Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(name, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Kelas $kelas", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(4.dp).clip(CircleShape).background(NeonSuccess))
                    Spacer(Modifier.width(4.dp))
                    Text(status, color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(Color.White))
                    Spacer(Modifier.width(8.dp))
                    Text(currentActivity, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                }
            }
            
            Icon(Icons.Default.ChevronRight, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
private fun GuardianToolboxButton(action: QuickAction) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = action.onClick)) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(CircleShape)
                .background(action.accentColor.copy(alpha = 0.08f))
                .border(1.dp, action.accentColor.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(action.icon, null, tint = action.accentColor, modifier = Modifier.size(24.dp))
        }
        Spacer(Modifier.height(6.dp))
        Text(action.label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
    }
}

@Composable
private fun ParentAttendanceLegendRow(label: String, value: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(10.dp))
        Text(label, fontSize = 12.sp, color = TextSecondary, modifier = Modifier.width(44.dp))
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}

@Composable
private fun ParentTimelineItem(
    title: String,
    desc: String,
    time: String,
    type: ActivityType = ActivityType.INFO
) {
    val indicatorColor = when (type) {
        ActivityType.ATTENDANCE -> NeonSuccess
        ActivityType.ASSIGNMENT -> NeonBlue
        ActivityType.GRADE -> ParentNeon
        ActivityType.ACHIEVEMENT -> NeonWarning
        ActivityType.INFO -> ParentNeon
    }

    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(indicatorColor))
            Box(Modifier.width(2.dp).height(40.dp).background(GlassBorder))
        }
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.padding(bottom = 14.dp)) {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Text(
                text = desc,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 16.sp
            )
            Text(time, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        }
    }
}
