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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.School
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
    onNavigateToLearning: () -> Unit = {},
    onNavigateToRombelStudents: (String) -> Unit = {},
    activeSubject: String = "-",
    activeClass: String = "-",
    isHomeroom: Boolean = false,
) {
    // ── 1. WALI KELAS & LIVE STATUS CARD ──
    item {
        val displayClass = if (activeClass.isNotBlank() && activeClass != "-") activeClass else "Kelas Mengajar"
        val displaySubject = if (activeSubject.isNotBlank() && activeSubject != "-") activeSubject else "Belum Ada Jadwal Sesi"

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(
                    Brush.linearGradient(
                        if (isHomeroom) listOf(Color(0xFF059669), Color(0xFF0D9488))
                        else listOf(Color(0xFF0284C7), Color(0xFF0D9488))
                    )
                )
                .clickable {
                    if (displayClass.isNotBlank() && displayClass != "Kelas Mengajar") {
                        onNavigateToRombelStudents(displayClass)
                    } else {
                        onNavigateToSessions()
                    }
                }
                .padding(18.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White.copy(alpha = 0.22f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = if (isHomeroom) "WALI KELAS RESMI" else "AGENDA MENGAJAR",
                                color = Color.White,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.5.sp
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "Dapodik Terverifikasi",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    Text(
                        text = if (isHomeroom) "Rombel $displayClass" else "$displaySubject — $displayClass",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )

                    Spacer(Modifier.height(2.dp))

                    Text(
                        text = if (isHomeroom) "Lihat Daftar Murid Rombel" else "Daftar Siswa & Profil Kelas",
                        color = Color.White.copy(alpha = 0.88f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .border(1.dp, Color.White.copy(alpha = 0.4f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Buka",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }

    // ── 2. SIMPLE 4-MENU GRID (PORTAL GURU) ──
    item {
        Text(
            text = "Menu Utama Guru",
            fontWeight = FontWeight.Black,
            fontSize = 15.sp,
            color = TextPrimary,
            modifier = Modifier.padding(start = 4.dp, top = 4.dp, bottom = 2.dp)
        )
    }

    item {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Row 1: Presensi & Tugas
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TeacherActionCard(
                    title = "Agenda & Presensi",
                    subtitle = "Absensi siswa rombel",
                    icon = Icons.Default.People,
                    accent = NeonBlue,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToSessions
                )
                TeacherActionCard(
                    title = "Tugas & Kuis",
                    subtitle = "Buat & periksa tugas",
                    icon = Icons.AutoMirrored.Filled.Assignment,
                    accent = StudentNeon,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToAssignments
                )
            }

            // Row 2: Penilaian & Materi
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TeacherActionCard(
                    title = "Buku Nilai",
                    subtitle = "Input nilai & rapor",
                    icon = Icons.Default.Assessment,
                    accent = TeacherNeon,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToGrades
                )
                TeacherActionCard(
                    title = "Materi Ajar",
                    subtitle = "Modul & bahan ajar",
                    icon = Icons.Default.Book,
                    accent = NeonWarning,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToLearning
                )
            }
        }
    }

    // ── 3. BROADCAST BANNER ──
    item {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(CosmicNavy)
                .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                .clickable(onClick = onNavigateToBroadcastCenter)
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(NeonError.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Campaign, null, tint = NeonError, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Kirim Pengumuman Rombel", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                        Text("Broadcast pesan & info penting ke siswa", fontSize = 10.sp, color = TextTertiary)
                    }
                }
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = TextTertiary,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }

    item { Spacer(Modifier.height(16.dp)) }
}

@Composable
private fun TeacherActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accent.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = accent, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.height(10.dp))
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = TextPrimary)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, fontSize = 10.sp, color = TextTertiary)
        }
    }
}
