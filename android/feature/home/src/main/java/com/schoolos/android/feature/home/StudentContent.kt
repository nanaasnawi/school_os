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
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.SportsHandball
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.HorizontalDivider
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
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.LineTrendChart
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

fun LazyListScope.studentContent(
    onNavigateToSessions: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToQuizzes: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToProgress: () -> Unit,
    onNavigateToAchievements: () -> Unit,
    onNavigateToLearning: () -> Unit,
) {
    // ── 1. INTEGRATED LEARNING HUB (Next Class) ──
    item {
        StudentLearningHubGlass(
            subject = "-",
            room = "-",
            timeLeft = "-",
            isLive = false, // Upcoming
            onClick = onNavigateToSessions
        )
    }

    // ── 2. STUDENT TOOLBOX (Minimalist Circular) ──
    item {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            val tools = listOf(
                QuickAction("Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, onNavigateToAssignments),
                QuickAction("Kuis", Icons.Default.Quiz, NeonWarning, onNavigateToQuizzes),
                QuickAction("Materi", Icons.Default.Book, NeonBlue, onNavigateToLearning),
                QuickAction("Nilai", Icons.Default.Grade, NeonSuccess, onNavigateToGrades),
                QuickAction("Badge", Icons.Default.Star, StudentNeon, onNavigateToAchievements),
            )
            tools.forEach { tool -> StudentToolboxButton(tool) }
        }
    }

    // ── 3. COMPACT DAILY AGENDA STRIP ──
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Agenda Belajar Hari Ini", "", onSeeAll = onNavigateToSessions)
                Spacer(Modifier.height(14.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(emptyList<Triple<String, String, Color>>()) { (time, code, color) ->
                        CompactAgendaItem(time, code, color)
                    }
                }
            }
        }
    }

    // ── 4. REFINED GRADE OVERVIEW ──
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Performa Akademik", "Semester Genap", onSeeAll = onNavigateToGrades)
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.Bottom) {
                    Column {
                        Text("-", fontWeight = FontWeight.Black, fontSize = 36.sp, color = StudentNeon, letterSpacing = (-1).sp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Belum ada data nilai", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    LineTrendChart(
                        dataPoints = emptyList(),
                        lineColor = StudentNeon,
                        fillColor = StudentNeon.copy(alpha = 0.08f),
                        modifier = Modifier.size(width = 120.dp, height = 60.dp),
                    )
                }
            }
        }
    }

    // ── 5. REFINED SUBJECT PROGRESS ──
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Progres Belajar", "", onSeeAll = onNavigateToProgress)
                Spacer(Modifier.height(14.dp))
                emptyList<Triple<String, Float, Color>>().forEach { (subj, pct, color) ->
                    LightProgressRow(subj, pct, color)
                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
    
    item { Spacer(Modifier.height(20.dp)) }
}

@Composable
private fun StudentLearningHubGlass(
    subject: String,
    room: String,
    timeLeft: String,
    isLive: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.horizontalGradient(listOf(StudentNeon, NeonBlue)))
            .clickable(onClick = onClick)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(if (isLive) NeonSuccess else Color.White))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        if (isLive) "SEDANG BERLANGSUNG" else "KELAS BERIKUTNYA",
                        color = Color.White.copy(alpha = 0.9f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text(subject, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("$room • $timeLeft", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.2f))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(if (isLive) "Masuk" else "Jadwal", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun StudentToolboxButton(action: QuickAction) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = action.onClick)) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(action.accentColor.copy(alpha = 0.16f))
                .border(1.dp, action.accentColor.copy(alpha = 0.3f), RoundedCornerShape(18.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(action.icon, null, tint = action.accentColor, modifier = Modifier.size(24.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(action.label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
    }
}

@Composable
private fun CompactAgendaItem(time: String, code: String, color: Color) {
    Box(
        modifier = Modifier
            .width(80.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(color.copy(alpha = 0.06f))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(code, fontWeight = FontWeight.Black, fontSize = 14.sp, color = color)
            Text(time, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        }
    }
}
