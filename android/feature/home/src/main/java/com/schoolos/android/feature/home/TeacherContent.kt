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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

fun LazyListScope.teacherContent(
    onNavigateToSessions: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToQuizzes: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToAssignmentCreator: () -> Unit,
    onNavigateToQuizBuilder: () -> Unit,
    onNavigateToBroadcastCenter: () -> Unit,
    isHomeroom: Boolean = false,
) {
    // ── 1. GLASSMORPHIC LIVE HUB (Top Priority) ──
    item {
        TeacherLiveHubGlass(
            subject = "-",
            kelas = "-",
            timeLeft = "-",
            attendance = "-",
            onClick = onNavigateToSessions
        )
    }

    // ── 2. MANAGEMENT TOOLBOX (Minimalist Circular) ──
    item {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            val tools = listOf(
                QuickAction("Absen", Icons.Default.Group, NeonBlue, onNavigateToSessions),
                QuickAction("Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, onNavigateToAssignmentCreator),
                QuickAction("Nilai", Icons.Default.Grade, com.schoolos.android.core.designsystem.TeacherNeon, onNavigateToGrades),
                QuickAction("Kuis", Icons.Default.Quiz, NeonWarning, onNavigateToQuizBuilder),
                QuickAction("Pesan", Icons.Default.Campaign, NeonError, onNavigateToBroadcastCenter),
            )
            tools.forEach { tool -> ToolboxButton(tool) }
        }
    }

    // ── 3. CLASS MANAGEMENT GRID (2-Column Compact) ──
    item {
        Text("Kelola Kelas Managed", fontWeight = FontWeight.Black, fontSize = 15.sp, color = TextPrimary, modifier = Modifier.padding(start = 4.dp, top = 8.dp))
    }
    
    item {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val managedClasses = emptyList<Triple<String, String, String>>()
            
            managedClasses.chunked(2).forEach { rowItems ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    rowItems.forEach { (kelas, mapel, siswa) ->
                        ManagementTile(kelas, mapel, siswa, "Avg: 88.2", Modifier.weight(1f), onClick = onNavigateToGrades)
                    }
                    if (rowItems.size == 1) Box(Modifier.weight(1f))
                }
            }
        }
    }

    // ── 4. VERTICAL MANAGEMENT TIMELINE (Latest Activity) ──
    item {
        Text("Log Aktivitas Siswa", fontWeight = FontWeight.Black, fontSize = 15.sp, color = TextPrimary, modifier = Modifier.padding(start = 4.dp, top = 12.dp))
    }
    
    items(emptyList<Triple<String, String, String>>()) { (name, act, time) ->
        TimelineActivityItem(name, act, time)
    }
    
    item { Spacer(Modifier.height(20.dp)) }
}

@Composable
private fun TeacherLiveHubGlass(
    subject: String,
    kelas: String,
    timeLeft: String,
    attendance: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.horizontalGradient(listOf(TeacherNeon, Color(0xFF0D9488))))
            .clickable(onClick = onClick)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(Color.White))
                    Spacer(Modifier.width(8.dp))
                    Text("SEDANG BERLANGSUNG", color = Color.White.copy(alpha = 0.9f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                }
                Spacer(Modifier.height(8.dp))
                Text("$subject — $kelas", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text("Selesai dalam $timeLeft", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .border(1.dp, Color.White.copy(alpha = 0.4f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(attendance, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                }
                Text("HADIR", color = Color.White.copy(alpha = 0.8f), fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun ManagementTile(
    kelas: String, 
    mapel: String, 
    siswa: String, 
    avg: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val accent = if (kelas == "7A") StudentNeon else if (kelas == "8B") NeonBlue else NeonWarning
    
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(accent.copy(alpha = 0.08f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (mapel == "Matematika") "🧮" else "📖", fontSize = 18.sp)
                }
                Text(kelas, fontWeight = FontWeight.Black, fontSize = 18.sp, color = accent)
            }
            Spacer(Modifier.height(12.dp))
            Text(siswa, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(avg, fontSize = 11.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun ToolboxButton(action: QuickAction) {
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
private fun TimelineActivityItem(name: String, act: String, time: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(NeonBlue))
            Box(Modifier.width(2.dp).height(36.dp).background(GlassBorder))
        }
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.padding(bottom = 12.dp)) {
            Text(
                text = name,
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Text(
                text = act,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 16.sp
            )
            Text(time, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        }
    }
}
