package com.schoolos.android.feature.home

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.SportsHandball
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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

val studentSchedule = listOf(
    ScheduleItem("07.30", "Matematika",       "Ruang 7A",    Icons.Default.School,        StudentNeon, Color(0xFFF3E8FF)),
    ScheduleItem("09.30", "Bahasa Indonesia", "Ruang 7A",    Icons.Default.Book,          NeonSuccess, Color(0xFFD1FAE5)),
    ScheduleItem("11.00", "IPA",              "Ruang Lab 2", Icons.Default.Science,       NeonBlue,    Color(0xFFDBEAFE)),
    ScheduleItem("12.30", "Penjaskes",        "Lapangan",    Icons.Default.SportsHandball, NeonWarning, Color(0xFFFEF3C7)),
)

fun LazyListScope.studentContent(
    onNavigateToSessions: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToQuizzes: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToProgress: () -> Unit,
) {
    // Today's Schedule Card (Seamless White Card with Soft Drop Shadow)
    item {
        LightCard {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(StudentNeon)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Jadwal Hari Ini",
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary,
                            fontSize = 16.sp,
                        )
                    }
                    Text(
                        "Lihat Semua",
                        color = StudentNeon,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { onNavigateToSessions() },
                    )
                }

                HorizontalDivider(color = GlassBorder, thickness = 1.dp)

                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    studentSchedule.forEachIndexed { idx, item ->
                        LightScheduleRow(item)
                        if (idx < studentSchedule.size - 1) {
                            HorizontalDivider(color = GlassBorder.copy(alpha = 0.5f), thickness = 0.5.dp, modifier = Modifier.padding(horizontal = 18.dp))
                        }
                    }
                }
            }
        }
    }

    // Stat mini cards
    item {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            LightMiniStatCard(
                title = "Tugas & PR",
                value = "2",
                sub = "perlu dikerjakan",
                icon = Icons.AutoMirrored.Filled.Assignment,
                accentColor = StudentNeon,
                badgeText = "Segera",
                progress = 0.65f,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToAssignments,
            )
            LightMiniStatCard(
                title = "Kuis Aktif",
                value = "1",
                sub = "belum selesai",
                icon = Icons.Default.Quiz,
                accentColor = NeonWarning,
                badgeText = "Hari Ini",
                progress = 0.2f,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToQuizzes,
            )
        }
    }

    // Grade Overview
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Nilai Rata-rata", "Semester Genap 2024/2025", onSeeAll = onNavigateToGrades)
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.Bottom) {
                    Column {
                        Text(
                            "88.6",
                            fontWeight = FontWeight.Black,
                            fontSize = 42.sp,
                            color = StudentNeon,
                            letterSpacing = (-1).sp,
                        )
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(StudentNeon.copy(alpha = 0.12f))
                                    .border(1.dp, StudentNeon.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp),
                            ) {
                                Text("Predikat A", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = StudentNeon)
                            }
                            Spacer(Modifier.width(6.dp))
                            Text("Sangat Baik", fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    LineTrendChart(
                        dataPoints = listOf(72f, 78f, 85f, 86f, 88.6f),
                        lineColor = StudentNeon,
                        fillColor = StudentNeon.copy(alpha = 0.12f),
                        modifier = Modifier.size(width = 140.dp, height = 75.dp),
                    )
                }
                Spacer(Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    listOf("Jan", "Feb", "Mar", "Apr", "Mei").forEach { m ->
                        Text(m, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Subject Progress
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Progres Belajar", "", onSeeAll = onNavigateToProgress)
                Spacer(Modifier.height(16.dp))
                listOf(
                    Triple("Matematika",       0.90f, StudentNeon),
                    Triple("Bahasa Indonesia", 0.85f, NeonSuccess),
                    Triple("IPA",              0.88f, NeonBlue),
                ).forEach { (subj, pct, color) ->
                    LightProgressRow(subj, pct, color)
                    Spacer(Modifier.height(14.dp))
                }
            }
        }
    }
}
