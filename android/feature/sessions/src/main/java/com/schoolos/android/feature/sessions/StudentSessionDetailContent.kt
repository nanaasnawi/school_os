package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentSessionDetailContent(
    session: LearningSession,
    attendance: List<SessionAttendance>,
    onOpenAssignments: (String) -> Unit,
    onOpenQuizzes: (String) -> Unit,
    onOpenMaterials: (String) -> Unit,
    accentColor: Color,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        // Info Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(
                    Brush.linearGradient(
                        colors = listOf(accentColor.copy(alpha = 0.08f), accentColor.copy(alpha = 0.03f)),
                    )
                )
                .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                .padding(16.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape).background(accentColor.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Person, null, tint = accentColor, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Guru Pengampu", fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                        val teacher = session.teacherName ?: "Guru Pengampu"
                        Text(teacher, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                    }
                }

                HorizontalDivider(color = accentColor.copy(alpha = 0.2f), thickness = 1.dp)

                val startTime = session.scheduledAt?.let {
                    try {
                        val parser = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).apply {
                            timeZone = java.util.TimeZone.getTimeZone("UTC")
                        }
                        val outFormatter = java.text.SimpleDateFormat("HH.mm", java.util.Locale.getDefault()).apply {
                            timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
                        }
                        parser.parse(it.substringBefore("."))?.let { d -> outFormatter.format(d) + " WIB" }
                    } catch (e: Exception) { null }
                } ?: "07.30 WIB"

                Row(modifier = Modifier.fillMaxWidth()) {
                    DetailMetricItem(
                        label = "Mulai",
                        value = startTime,
                        icon = Icons.Default.Schedule,
                        modifier = Modifier.weight(1f),
                    )
                    DetailMetricItem(
                        label = "Durasi",
                        value = session.durationText() ?: "90 Menit",
                        icon = Icons.Default.PlayArrow,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        // Resource Hub
        SectionTitle("SUMBER DAYA PELAJARAN")
        GlassCard(cornerRadius = 16.dp) {
            Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ResourceItem("Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, Modifier.weight(1f)) { onOpenAssignments(session.subjectName?.trim().orEmpty()) }
                ResourceItem("Kuis", Icons.Default.Quiz, NeonSuccess, Modifier.weight(1f)) { onOpenQuizzes(session.subjectName?.trim().orEmpty()) }
                ResourceItem("Materi", Icons.Default.Book, NeonBlue, Modifier.weight(1f)) { onOpenMaterials(session.subjectName?.trim().orEmpty()) }
            }
        }

        // Personal Attendance
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Presensi Saya", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                    if (session.status == "completed") StatusChip(label = "Selesai")
                }
                Spacer(Modifier.height(14.dp))

                if (attendance.isEmpty()) {
                    EmptyStateContent(
                        message = "Belum ada data presensi",
                        subtitle = "Presensi akan tercatat saat sesi berlangsung",
                        accentColor = accentColor,
                    )
                } else {
                    attendance.forEach { att ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (att.status == "present") NeonSuccess.copy(alpha = 0.12f)
                                        else NeonError.copy(alpha = 0.12f),
                                    ),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    if (att.status == "present") Icons.Default.CheckCircle else Icons.Default.Schedule,
                                    null,
                                    tint = if (att.status == "present") NeonSuccess else NeonError,
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Text(
                                if (att.status == "present") "Hadir Tepat Waktu" else "Alpa / Terlambat",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = TextSecondary,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        title,
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        color = TextTertiary,
        letterSpacing = 1.sp,
        modifier = Modifier.padding(start = 4.dp, bottom = 8.dp),
    )
}

@Composable
private fun EmptyStateContent(message: String, subtitle: String, accentColor: Color) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(accentColor.copy(alpha = 0.1f))
                .border(1.dp, accentColor.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.EventAvailable, contentDescription = null,
                modifier = Modifier.size(24.dp), tint = accentColor)
        }
        Text(message, fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        Text(subtitle, fontSize = 11.sp, color = TextTertiary)
    }
}

// Remove duplicate definitions - use SessionDetailComponents.kt versions
// DetailMetricItem and ResourceItem are defined in SessionDetailComponents.kt