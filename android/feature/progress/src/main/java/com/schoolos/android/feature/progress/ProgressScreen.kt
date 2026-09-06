package com.schoolos.android.feature.progress

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.AssignmentLate
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.EmptyState
import com.schoolos.android.core.designsystem.ErrorState
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.GlassCard
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.PullRefreshContainer
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.Progress

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgressScreen(
    onBack: (() -> Unit)? = null,
    onNavigateToAssignments: (() -> Unit)? = null,
    viewModel: ProgressViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(containerColor = CosmicBlack) { padding ->
        PullRefreshContainer(
            isRefreshing = state.isRefreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    ErrorState(message = state.error!!, onRetry = viewModel::refresh)
                }
                else -> {
                    val isParent = state.isParent
                    ProgressContent(
                        progress = state.progress!!,
                        onBack = onBack,
                        onNavigateToAssignments = onNavigateToAssignments,
                        isParent = isParent,
                        childName = state.childName
                    )
                }
            }
        }
    }
}

@Composable
private fun ProgressContent(
    progress: Progress,
    onBack: (() -> Unit)?,
    onNavigateToAssignments: (() -> Unit)? = null,
    isParent: Boolean = false,
    childName: String = "",
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 46.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // ── REFACTORED NON-OVERLAPPING LIST HEADER ─────────────
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 0.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (onBack != null) {
                        CustomBackButton(onClick = onBack)
                    }
                }
            }
        }

        if (isParent) {
            // ── PARENT VIEW: GROWTH REPORT ──
            item { ParentPerformanceBanner(progress, childName) }

            item {
                Text(
                    "PERLU PERHATIAN",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = NeonError,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 8.dp)
                )
            }

            item { CriticalMonitoringCard(progress, onNavigateToAssignments) }

            item {
                Text(
                    "STATISTIK BELAJAR",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = TextTertiary,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 8.dp)
                )
            }

            val lessonInsight = if (progress.lessonCompleted == 0) {
                "Belum ada modul yang diselesaikan minggu ini."
            } else {
                "${progress.lessonCompleted} dari ${progress.lessonTotal} modul tuntas dipelajari."
            }

            val assignmentMissing = (progress.assignmentTotal - progress.assignmentCompleted).coerceAtLeast(0)
            val assignmentInsight = if (assignmentMissing > 0) {
                "$assignmentMissing tugas memerlukan penyelesaian segera."
            } else {
                "Semua penugasan dikumpulkan tepat waktu."
            }

            val sessionPct = if (progress.sessionTotal > 0) {
                (progress.sessionAttended * 100 / progress.sessionTotal)
            } else 100
            val sessionInsight = if (sessionPct >= 90) {
                "Kehadiran sangat konsisten ($sessionPct%) di kelas."
            } else {
                "Tingkat kehadiran tercatat $sessionPct% semester ini."
            }

            item {
                ParentMonitoringCard(
                    "Penyelesaian Materi",
                    progress.lessonCompleted,
                    progress.lessonTotal,
                    lessonInsight,
                    StudentNeon
                )
            }
            item {
                ParentMonitoringCard(
                    "Ketepatan Kumpul Tugas",
                    progress.assignmentCompleted,
                    progress.assignmentTotal,
                    assignmentInsight,
                    NeonBlue
                )
            }
            item {
                ParentMonitoringCard(
                    "Partisipasi Kelas",
                    progress.sessionAttended,
                    progress.sessionTotal,
                    sessionInsight,
                    NeonSuccess
                )
            }

            item { TeacherRemarksCard(progress) }

        } else {
            // ── STUDENT VIEW: PERSONAL PROGRESS ──
            item { CompactOverallProgressCard(progress) }

            item {
                CompactBreakdownCard(
                    "Materi & Pelajaran",
                    progress.lessonCompleted,
                    progress.lessonTotal,
                    Icons.Default.Book,
                    StudentNeon,
                )
            }
            item {
                CompactBreakdownCard(
                    "Tugas Terkumpul",
                    progress.assignmentCompleted,
                    progress.assignmentTotal,
                    Icons.AutoMirrored.Filled.Assignment,
                    NeonBlue,
                )
            }
            item {
                CompactBreakdownCard(
                    "Kuis Diselesaikan",
                    progress.quizCompleted,
                    progress.quizTotal,
                    Icons.Default.Quiz,
                    NeonSuccess,
                )
            }
            item {
                CompactBreakdownCard(
                    "Kehadiran Sesi",
                    progress.sessionAttended,
                    progress.sessionTotal,
                    Icons.Default.CalendarMonth,
                    NeonWarning,
                )
            }
        }

        item {
            Text(
                "Update: ${progress.calculatedAt}",
                fontSize = 10.sp,
                color = TextTertiary,
                modifier = Modifier.padding(bottom = 20.dp, start = 4.dp),
            )
        }
    }
}

@Composable
private fun ParentPerformanceBanner(progress: Progress, childName: String = "") {
    val statusText = progress.academicStatus ?: if (progress.overallProgress >= 80.0) "Sangat Baik ⭐" else if (progress.overallProgress >= 60.0) "Baik 👍" else "Perlu Perhatian ⚠️"
    val displayName = if (childName.isNotBlank()) childName else if (progress.subjectName.isNotBlank() && progress.subjectName != "Pelajaran") progress.subjectName else "Anak Anda"
    val className = progress.className.orEmpty()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.linearGradient(colors = listOf(Color(0xFFE11D48), Color(0xFF9F1239))))
            .border(1.dp, GlassBorder2, RoundedCornerShape(22.dp))
            .padding(20.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "PERFORMA AKADEMIK",
                        color = Color.White.copy(alpha = 0.75f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        displayName,
                        fontWeight = FontWeight.Black,
                        fontSize = 19.sp,
                        color = Color.White,
                        lineHeight = 24.sp
                    )
                    Text(
                        if (className.isNotBlank()) "Kelas $className" else "Siswa Aktif",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        fontWeight = FontWeight.Medium
                    )
                }
                Spacer(Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White.copy(alpha = 0.2f))
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(statusText, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
            
            Spacer(Modifier.height(18.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        String.format(java.util.Locale.US, "%.1f", progress.overallProgress),
                        fontSize = 38.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-1).sp
                    )
                    Text(
                        "/ 100",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.75f),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp, start = 4.dp)
                    )
                }
                
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White.copy(alpha = 0.18f))
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Download, null, tint = Color.White, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("PDF RAPOR", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
private fun CriticalMonitoringCard(
    progress: Progress,
    onNavigateToAssignments: (() -> Unit)? = null
) {
    val missingCount = (progress.assignmentTotal - progress.assignmentCompleted).coerceAtLeast(0)
    val absenceCount = (progress.sessionTotal - progress.sessionAttended).coerceAtLeast(0)
    val isAlert = missingCount > 0 || absenceCount > 0
    val cardBorder = if (isAlert) NeonError.copy(alpha = 0.3f) else NeonSuccess.copy(alpha = 0.3f)
    val iconBg = if (isAlert) NeonError.copy(alpha = 0.12f) else NeonSuccess.copy(alpha = 0.12f)
    val iconColor = if (isAlert) NeonError else NeonSuccess

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, cardBorder, RoundedCornerShape(18.dp))
            .clickable { onNavigateToAssignments?.invoke() }
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.AssignmentLate, null, tint = iconColor, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (missingCount > 0) "$missingCount Tugas Belum Terkumpul" else "Semua Tugas Tuntas Dikumpulkan",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = if (missingCount > 0) NeonError else TextPrimary
                )
                Spacer(Modifier.height(2.dp))
                val sessionPct = if (progress.sessionTotal > 0) (progress.sessionAttended * 100 / progress.sessionTotal) else 100
                Text(
                    if (missingCount > 0) "Kehadiran $sessionPct% • Ketuk untuk lihat rincian tugas →" else "Kehadiran $sessionPct% aktif mengikuti kegiatan kelas",
                    fontSize = 12.sp,
                    color = if (missingCount > 0) NeonWarning else TextTertiary,
                    fontWeight = if (missingCount > 0) FontWeight.Medium else FontWeight.Normal
                )
            }
        }
    }
}

@Composable
private fun ParentMonitoringCard(
    label: String,
    completed: Int,
    total: Int,
    insight: String,
    color: Color
) {
    val pct = (completed.toFloat() / total.coerceAtLeast(1)).coerceIn(0f, 1f)
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(label, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                Text("${(pct * 100).toInt()}%", fontWeight = FontWeight.Black, fontSize = 15.sp, color = color)
            }
            Spacer(Modifier.height(10.dp))
            Box(
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(color.copy(alpha = 0.08f))
            ) {
                Box(modifier = Modifier.fillMaxWidth(pct).height(6.dp).clip(CircleShape).background(color))
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.TrendingUp, null, tint = color, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(6.dp))
                Text(insight, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun TeacherRemarksCard(progress: Progress) {
    val teacherName = progress.teacherName.orEmpty()
    val className = progress.className.orEmpty()
    val noteText = progress.teacherNotes ?: "Belum ada catatan evaluasi khusus dari pengajar."

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, NeonBlue.copy(alpha = 0.35f), RoundedCornerShape(18.dp))
            .padding(18.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(NeonBlue.copy(alpha = 0.12f))
                            .border(1.dp, NeonBlue.copy(alpha = 0.4f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, null, tint = NeonBlue, modifier = Modifier.size(22.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(teacherName, fontWeight = FontWeight.Black, fontSize = 14.sp, color = TextPrimary)
                            Spacer(Modifier.width(6.dp))
                            Text("✓", color = NeonBlue, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        Text("Wali Kelas • $className", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
                    }
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonBlue.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Catatan Resmi", fontSize = 10.sp, color = NeonBlue, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(CosmicBlack.copy(alpha = 0.6f))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.Top) {
                    Icon(Icons.Default.ChatBubbleOutline, null, tint = NeonBlue.copy(alpha = 0.8f), modifier = Modifier.size(16.dp).padding(top = 2.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(
                        noteText,
                        fontSize = 13.sp,
                        color = TextPrimary,
                        lineHeight = 20.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            Text(
                "— Sistem Informasi Akademik • Data Tersinkronisasi Real-Time",
                fontSize = 10.sp,
                color = TextTertiary,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
            )
        }
    }
}

@Composable
private fun CompactOverallProgressCard(progress: Progress) {
    val pct = (progress.overallProgress / 100.0).toFloat().coerceIn(0f, 1f)

    var animTarget by remember { mutableFloatStateOf(0f) }
    val animatedPct by animateFloatAsState(
        targetValue = animTarget,
        animationSpec = tween(1600, easing = FastOutSlowInEasing),
        label = "overallRing",
    )
    LaunchedEffect(pct) { animTarget = pct }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(colors = listOf(NeonBlue, StudentNeon)))
            .padding(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "TOTAL PROGRES", 
                    color = Color.White.copy(alpha = 0.7f), 
                    fontSize = 10.sp, 
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    progress.subjectName.ifEmpty { "Kurikulum 2026" },
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = Color.White,
                    lineHeight = 22.sp
                )
            }
            
            // Compact Ring
            Box(modifier = Modifier.size(80.dp), contentAlignment = Alignment.Center) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 8.dp.toPx()
                    val r = (size.minDimension - stroke) / 2
                    val cx = size.width / 2; val cy = size.height / 2
                    drawArc(Color.White.copy(alpha = 0.15f), -90f, 360f, false, Offset(cx - r, cy - r), Size(r * 2, r * 2), style = Stroke(stroke, cap = StrokeCap.Round))
                    if (animatedPct > 0f) {
                        drawArc(Color.White, -90f, 360f * animatedPct, false, Offset(cx - r, cy - r), Size(r * 2, r * 2), style = Stroke(stroke, cap = StrokeCap.Round))
                    }
                }
                Text("${(animatedPct * 100).toInt()}%", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
            }
        }
    }
}

@Composable
private fun CompactBreakdownCard(
    label: String,
    completed: Int,
    total: Int,
    icon: ImageVector,
    color: Color,
) {
    val safeTotal = total.coerceAtLeast(1)
    val pct = (completed.toFloat() / safeTotal).coerceIn(0f, 1f)

    var animTarget by remember { mutableFloatStateOf(0f) }
    val animatedPct by animateFloatAsState(
        targetValue = animTarget,
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label = "breakdownBar",
    )
    LaunchedEffect(pct) { animTarget = pct }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder2, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                    Text("$completed / $total", fontWeight = FontWeight.Black, fontSize = 14.sp, color = color)
                }
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape)
                        .background(color.copy(alpha = 0.1f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(animatedPct)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(color)
                    )
                }
            }
        }
    }
}
