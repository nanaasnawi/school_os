package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherSessionDetailContent(
    session: LearningSession,
    attendance: List<SessionAttendance> = emptyList(),
    onOpenAssignments: (String) -> Unit,
    onOpenQuizzes: (String) -> Unit,
    onOpenMaterials: (String) -> Unit,
    accentColor: Color,
) {
    val presentCount = attendance.count { it.status?.lowercase() == "present" }
    val absentCount = attendance.count { it.status?.lowercase() == "absent" }
    val totalCount = attendance.size
    val attendanceRate = if (totalCount > 0) (presentCount * 100 / totalCount) else 0
    val sessionPeriod = formatSessionPeriod(session.scheduledAt)

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {

        // ── SESSION PERIOD & STATS HERO ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        colors = listOf(accentColor.copy(alpha = 0.15f), accentColor.copy(alpha = 0.05f)),
                    )
                )
                .border(1.dp, accentColor.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                // Period badge row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(accentColor.copy(alpha = 0.15f))
                            .border(1.dp, accentColor.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, null, tint = accentColor, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                sessionPeriod,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                color = accentColor,
                            )
                        }
                    }
                    Text(
                        session.scheduledAt?.let {
                            try {
                                val instant = java.time.Instant.parse(it)
                                val zdt = instant.atZone(java.time.ZoneId.of("Asia/Jakarta"))
                                String.format(java.util.Locale.US, "%02d.%02d — %s WIB",
                                    zdt.hour, zdt.minute,
                                    session.endedAt?.let { end ->
                                        val eZdt = java.time.Instant.parse(end).atZone(java.time.ZoneId.of("Asia/Jakarta"))
                                        String.format(java.util.Locale.US, "%02d.%02d", eZdt.hour, eZdt.minute)
                                    } ?: ""
                                )
                            } catch (_: Exception) { "08.00 WIB" }
                        } ?: "08.00 WIB",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        fontWeight = FontWeight.Bold,
                    )
                }

                // Attendance stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    AttendanceMiniCard("HADIR", presentCount.toString(), NeonSuccess, Modifier.weight(1f))
                    AttendanceMiniCard("TIDAK HADIR", absentCount.toString(), NeonError, Modifier.weight(1f))
                    AttendanceMiniCard("KEHADIRAN", "$attendanceRate%", accentColor, Modifier.weight(1f))
                }

                // Attendance progress bar
                if (totalCount > 0) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(CircleShape)
                                .background(accentColor.copy(alpha = 0.1f)),
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(presentCount.toFloat() / totalCount)
                                    .height(6.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.horizontalGradient(listOf(accentColor, NeonSuccess)),
                                    ),
                            )
                        }
                        Text(
                            "$presentCount dari $totalCount siswa hadir",
                            fontSize = 10.sp,
                            color = TextTertiary,
                        )
                    }
                }
            }
        }

        // ── RESOURCE HUB ──
        SectionTitle("KELOLA SUMBER DAYA KELAS")
        GlassCard(cornerRadius = 16.dp) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ResourceAction(
                    label = "Beri Tugas",
                    icon = Icons.AutoMirrored.Filled.Assignment,
                    color = StudentNeon,
                    modifier = Modifier.weight(1f),
                    onClick = { onOpenAssignments(session.subjectName?.trim().orEmpty()) },
                )
                ResourceAction(
                    label = "Buat Kuis",
                    icon = Icons.Default.Quiz,
                    color = NeonSuccess,
                    modifier = Modifier.weight(1f),
                    onClick = { onOpenQuizzes(session.subjectName?.trim().orEmpty()) },
                )
                ResourceAction(
                    label = "Unggah Materi",
                    icon = Icons.Default.Book,
                    color = NeonBlue,
                    modifier = Modifier.weight(1f),
                    onClick = { onOpenMaterials(session.subjectName?.trim().orEmpty()) },
                )
            }
        }

        // ── ATTENDANCE ROSTER ──
        Row(
            modifier = Modifier.padding(start = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                "Rekap Presensi Siswa",
                fontSize = 15.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary,
            )
            if (totalCount > 0) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text("$totalCount Siswa", color = accentColor, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                }
            }
        }

        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (attendance.isEmpty()) {
                    EmptyStateContent(
                        message = "Data presensi belum tersedia",
                        subtitle = "Presensi akan muncul setelah sesi dimulai",
                    )
                } else {
                    attendance.forEachIndexed { idx, student ->
                        if (idx > 0) {
                            HorizontalDivider(
                                color = GlassBorder,
                                thickness = 1.dp,
                                modifier = Modifier.padding(vertical = 4.dp),
                            )
                        }
                        val isPresent = student.status?.lowercase() == "present"
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            // Avatar with student number
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (isPresent) NeonSuccess.copy(alpha = 0.12f)
                                        else NeonError.copy(alpha = 0.12f),
                                    )
                                    .border(
                                        1.dp,
                                        if (isPresent) NeonSuccess.copy(alpha = 0.3f) else NeonError.copy(alpha = 0.3f),
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "${idx + 1}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isPresent) NeonSuccess else NeonError,
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "Siswa ${idx + 1}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                )
                                Text(
                                    "ID: ${student.studentId?.take(8) ?: "N/A"}",
                                    fontSize = 10.sp,
                                    color = TextTertiary,
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (isPresent) NeonSuccess.copy(alpha = 0.1f)
                                        else NeonError.copy(alpha = 0.1f),
                                    )
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                            ) {
                                Text(
                                    if (isPresent) "HADIR" else (student.status?.uppercase() ?: "TIDAK HADIR"),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isPresent) NeonSuccess else NeonError,
                                )
                            }
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
private fun AttendanceMiniCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.08f))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Black, color = color)
            Text(label, fontSize = 7.sp, fontWeight = FontWeight.Bold, color = TextTertiary)
        }
    }
}

@Composable
private fun ResourceAction(
    label: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(color.copy(alpha = 0.08f))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(22.dp))
        }
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}

@Composable
private fun EmptyStateContent(message: String, subtitle: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(NeonBlueBg)
                .border(1.dp, NeonBlue.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Assignment, contentDescription = null,
                modifier = Modifier.size(24.dp), tint = NeonBlue)
        }
        Text(message, fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        Text(subtitle, fontSize = 11.sp, color = TextTertiary)
    }
}