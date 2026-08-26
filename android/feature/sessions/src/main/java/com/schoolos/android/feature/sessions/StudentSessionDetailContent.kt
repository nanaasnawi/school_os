package com.schoolos.android.feature.sessions

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance

@Composable
fun StudentSessionDetailContent(
    session: LearningSession,
    attendance: List<SessionAttendance>,
    onOpenAssignments: (String) -> Unit,
    onOpenQuizzes: (String) -> Unit,
    onOpenMaterials: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Info Card
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(36.dp).clip(androidx.compose.foundation.shape.CircleShape).background(NeonBlueBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Guru Pengampu", fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                        Text("Bpk. Andi Pratama", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                Spacer(Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    DetailMetricItem(
                        label = "Mulai",
                        value = "07:30",
                        icon = Icons.Default.Schedule,
                        modifier = Modifier.weight(1f)
                    )
                    DetailMetricItem(
                        label = "Durasi",
                        value = session.durationText() ?: "90 Menit",
                        icon = Icons.Default.PlayArrow,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Resource Hub
        Text("SUMBER DAYA PELAJARAN", fontSize = 11.sp, fontWeight = FontWeight.Black, color = TextTertiary, letterSpacing = 1.sp, modifier = Modifier.padding(start = 4.dp))
        GlassCard(cornerRadius = 16.dp) {
            Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ResourceItem("Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, Modifier.weight(1f)) { onOpenAssignments(session.lessonId) }
                ResourceItem("Kuis", Icons.Default.Quiz, NeonSuccess, Modifier.weight(1f)) { onOpenQuizzes(session.lessonId) }
                ResourceItem("Materi", Icons.Default.Book, NeonBlue, Modifier.weight(1f)) { onOpenMaterials(session.lessonId) }
            }
        }

        // Personal Attendance
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Presensi Saya", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                    if (session.status == "completed") StatusChip(label = "Selesai")
                }
                Spacer(Modifier.height(14.dp))
                
                if (attendance.isEmpty()) {
                    Text("Belum ada data presensi.", fontSize = 12.sp, color = TextTertiary)
                } else {
                    attendance.forEach { att ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(if (att.status == "present") Icons.Default.CheckCircle else Icons.Default.Schedule, null, tint = if (att.status == "present") NeonSuccess else NeonError, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(10.dp))
                            Text(if (att.status == "present") "Hadir Tepat Waktu" else "Alpa / Terlambat", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = TextSecondary)
                        }
                    }
                }
            }
        }
    }
}
