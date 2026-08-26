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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.AccentNeonCoral
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.MetricRing
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
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
) {
    item {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LightTeacherRingCard("4",   "Kelas\nHari Ini",     TeacherNeon,   0.80f, Modifier.weight(1f))
            LightTeacherRingCard("85%", "Kehadiran\nRata-rata", NeonBlue,      0.85f, Modifier.weight(1f))
            LightTeacherRingCard("2",   "Dikumpul-\nkan",       NeonWarning,   0.4f,  Modifier.weight(1f))
            LightTeacherRingCard("10",  "Belum\nDinilai",       AccentNeonCoral,0.3f, Modifier.weight(1f))
        }
    }

    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Kelas yang Diampu", "", onSeeAll = onNavigateToSessions)
                Spacer(Modifier.height(12.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(listOf(
                        Triple("7A", "Matematika", "28 Siswa"),
                        Triple("8B", "Matematika", "30 Siswa"),
                        Triple("9C", "Matematika", "29 Siswa"),
                    )) { (kelas, mapel, siswa) ->
                        LightClassCard(kelas, mapel, siswa, onClick = onNavigateToSessions)
                    }
                }
            }
        }
    }

    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("Aksi Cepat Guru", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                Spacer(Modifier.height(14.dp))
                val actions = listOf(
                    QuickAction("Absensi",    Icons.Default.Group,                         NeonBlue,    onNavigateToSessions),
                    QuickAction("Buat PR",    Icons.AutoMirrored.Filled.Assignment,        StudentNeon, onNavigateToAssignments),
                    QuickAction("Nilai",      Icons.Default.Grade,                         TeacherNeon, onNavigateToGrades),
                    QuickAction("Input Soal", Icons.Default.Quiz,                          NeonWarning, onNavigateToQuizzes),
                    QuickAction("Pengumuman", Icons.Default.Campaign,                      NeonError,   onNavigateToNotifications),
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    actions.forEach { action -> LightQuickActionBtn(action) }
                }
            }
        }
    }
}

@Composable
fun LightClassCard(kelas: String, mapel: String, siswa: String, onClick: () -> Unit) {
    val color = when (kelas) {
        "7A" -> StudentNeon
        "8B" -> NeonBlue
        "9C" -> NeonWarning
        else -> TextTertiary
    }
    Box(
        modifier = Modifier
            .width(110.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(color.copy(alpha = 0.08f))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text(kelas, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = color)
            Spacer(Modifier.height(2.dp))
            Text(mapel, fontSize = 10.sp, color = TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
            Spacer(Modifier.height(4.dp))
            Box(
                modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(alpha = 0.15f)).padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(siswa, fontSize = 9.sp, color = color, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun LightTeacherRingCard(value: String, label: String, color: Color, progress: Float, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .padding(10.dp),
        contentAlignment = Alignment.Center,
    ) {
        MetricRing(progress = progress, label = label, value = value, color = color, size = 74.dp, strokeWidth = 7f)
    }
}
