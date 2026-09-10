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
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.SportsHandball
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

data class AgendaItemData(
    val time: String,
    val code: String,
    val color: Color,
    val sessionId: String,
    val status: String,
)

fun LazyListScope.studentContent(
    onNavigateToSessions: () -> Unit,
    onNavigateToSessionDetail: (String) -> Unit = {},
    onNavigateToAssignments: () -> Unit,
    onNavigateToQuizzes: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToProgress: () -> Unit,
    onNavigateToAchievements: () -> Unit,
    onNavigateToLearning: () -> Unit,
    onNavigateToAssignmentWithSubject: (String) -> Unit = {},
    onNavigateToQuizWithSubject: (String) -> Unit = {},
    onNavigateToMaterialWithSubject: (String) -> Unit = {},
    nextSessionSubject: String = "-",
    nextSessionRoom: String = "-",
    nextSessionTime: String = "-",
    nextSessionIsLive: Boolean = false,
    todaySessions: List<com.schoolos.android.domain.model.LearningSession> = emptyList(),
    gradeAverage: String = "-",
    gradeStatus: String = "Belum ada data nilai",
    gradeTrendPoints: List<Float> = emptyList(),
    topGradeSubjects: List<com.schoolos.android.domain.model.SubjectGradeSummary> = emptyList(),
    studentProgress: com.schoolos.android.domain.model.Progress? = null,
    progressPercentage: Float = 0f,
) {
    // ── 1. INTEGRATED LEARNING HUB (Next Class) ──
    item {
        StudentLearningHubGlass(
            subject = nextSessionSubject,
            room = nextSessionRoom,
            timeLeft = nextSessionTime,
            isLive = nextSessionIsLive,
            onClick = onNavigateToSessions
        )
    }

    // ── 2. STUDENT TOOLBOX (Minimalist Circular) ──
    // Determine current/active subject from today's sessions for context-aware navigation
    val currentSubject = todaySessions.firstOrNull { it.status == "active" }?.subjectName
        ?: todaySessions.firstOrNull()?.subjectName
        ?: todaySessions.firstOrNull()?.notes?.substringBefore(" • ")?.trim()
        ?: ""
    val currentSubjectClean = currentSubject.substringBefore(" • ").substringBefore(" (Ruang").trim()

    item {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            val tools = listOf(
                QuickAction("Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, { onNavigateToAssignmentWithSubject(currentSubjectClean) }),
                QuickAction("Kuis", Icons.Default.Quiz, NeonWarning, { onNavigateToQuizWithSubject(currentSubjectClean) }),
                QuickAction("Materi", Icons.Default.Book, NeonBlue, { onNavigateToMaterialWithSubject(currentSubjectClean) }),
                QuickAction("Nilai", Icons.Default.Assessment, NeonSuccess, onNavigateToGrades),
                QuickAction("Badge", Icons.Default.EmojiEvents, StudentNeon, onNavigateToAchievements),
            )
            tools.forEach { tool -> StudentToolboxButton(tool) }
        }
    }

    // ── 3. COMPACT DAILY AGENDA STRIP (Clickable) ──
    item {
        val agendaItems = todaySessions.map { s ->
            val title = s.subjectName ?: s.notes?.substringBefore(" • ") ?: "Mapel"
            val code = when {
                title.contains("Matematika", ignoreCase = true) -> "MTK"
                title.contains("IPA", ignoreCase = true) || title.contains("Sains", ignoreCase = true) -> "IPA"
                title.contains("IPS", ignoreCase = true) -> "IPS"
                title.contains("Bahasa Indonesia", ignoreCase = true) -> "BIND"
                title.contains("Bahasa Inggris", ignoreCase = true) -> "BING"
                title.contains("Agama", ignoreCase = true) -> "PAI"
                title.contains("Penjaskes", ignoreCase = true) || title.contains("Olahraga", ignoreCase = true) -> "PJOK"
                else -> title.take(4).uppercase()
            }
            val color = when {
                title.contains("Matematika", ignoreCase = true) -> StudentNeon
                title.contains("IPA", ignoreCase = true) || title.contains("Sains", ignoreCase = true) -> NeonBlue
                title.contains("Bahasa", ignoreCase = true) -> NeonSuccess
                title.contains("Agama", ignoreCase = true) -> NeonSuccess
                else -> NeonWarning
            }
            val rawTime = s.scheduledAt ?: s.startedAt
            val time = rawTime?.let {
                try {
                    val parser = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).apply {
                        timeZone = java.util.TimeZone.getTimeZone("UTC")
                    }
                    val out = java.text.SimpleDateFormat("HH.mm", java.util.Locale.getDefault()).apply {
                        timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
                    }
                    out.format(parser.parse(it.substringBefore(".")) ?: java.util.Date())
                } catch (e: Exception) {
                    try {
                        java.time.ZonedDateTime.parse(rawTime)
                            .withZoneSameInstant(java.time.ZoneId.of("Asia/Jakarta"))
                            .format(java.time.format.DateTimeFormatter.ofPattern("HH.mm"))
                    } catch (_: Exception) {
                        "-"
                    }
                }
            } ?: "-"
            AgendaItemData(time, code, color, s.id, s.status ?: "")
        }

        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Agenda Belajar Hari Ini", if (agendaItems.isNotEmpty()) "${agendaItems.size} Sesi" else "", onSeeAll = onNavigateToSessions)
                Spacer(Modifier.height(14.dp))
                if (agendaItems.isNotEmpty()) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(agendaItems, key = { it.sessionId }) { item ->
                            CompactAgendaItem(
                                time = item.time,
                                code = item.code,
                                color = item.color,
                                isActive = item.status == "active",
                                onClick = { onNavigateToSessionDetail(item.sessionId) }
                            )
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.04f))
                            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                            .clickable(onClick = onNavigateToSessions)
                            .padding(14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Buka Jadwal Pelajaran Mingguan ➔", fontSize = 12.sp, color = TextTertiary, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }

    // ── 4. REFINED DYNAMIC GRADE OVERVIEW ──
    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Performa Akademik", "Semester Aktif", onSeeAll = onNavigateToGrades)
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.Bottom) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (gradeAverage.isNotBlank()) gradeAverage else "-",
                            fontWeight = FontWeight.Black,
                            fontSize = 36.sp,
                            color = StudentNeon,
                            letterSpacing = (-1).sp
                        )
                        Spacer(Modifier.height(2.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(gradeStatus, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    if (gradeTrendPoints.isNotEmpty()) {
                        LineTrendChart(
                            dataPoints = gradeTrendPoints,
                            lineColor = StudentNeon,
                            fillColor = StudentNeon.copy(alpha = 0.08f),
                            modifier = Modifier.size(width = 120.dp, height = 54.dp),
                        )
                    }
                }

                if (topGradeSubjects.isNotEmpty()) {
                    Spacer(Modifier.height(14.dp))
                    HorizontalDivider(color = GlassBorder.copy(alpha = 0.5f), thickness = 0.8.dp)
                    Spacer(Modifier.height(12.dp))
                    topGradeSubjects.take(3).forEach { subj ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable(onClick = onNavigateToGrades),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                subj.subjectName,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(Modifier.width(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "%.1f".format(subj.finalScore),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextSecondary
                                )
                                Spacer(Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(
                                            when (subj.letterGrade) {
                                                "A" -> NeonSuccess.copy(alpha = 0.15f)
                                                "B" -> NeonBlue.copy(alpha = 0.15f)
                                                else -> NeonWarning.copy(alpha = 0.15f)
                                            }
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        subj.letterGrade,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = when (subj.letterGrade) {
                                            "A" -> NeonSuccess
                                            "B" -> NeonBlue
                                            else -> NeonWarning
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ── 5. REFINED DYNAMIC SUBJECT PROGRESS ──
    item {
        val p = studentProgress
        val progressItems = if (p != null) {
            val list = mutableListOf<Triple<String, Float, Color>>()
            val lessonPct = if (p.lessonTotal > 0) (p.lessonCompleted.toFloat() / p.lessonTotal.toFloat()).coerceIn(0f, 1f) else 0f
            val lessonLabel = if (p.lessonTotal > 0) "Materi & Modul (${p.lessonCompleted}/${p.lessonTotal})" else "Materi & Modul"
            list.add(Triple(lessonLabel, lessonPct, NeonBlue))

            val assignPct = if (p.assignmentTotal > 0) (p.assignmentCompleted.toFloat() / p.assignmentTotal.toFloat()).coerceIn(0f, 1f) else 0f
            val assignLabel = if (p.assignmentTotal > 0) "Tugas Mandiri (${p.assignmentCompleted}/${p.assignmentTotal})" else "Tugas Mandiri"
            list.add(Triple(assignLabel, assignPct, NeonSuccess))

            val quizPct = if (p.quizTotal > 0) (p.quizCompleted.toFloat() / p.quizTotal.toFloat()).coerceIn(0f, 1f) else 0f
            val quizLabel = if (p.quizTotal > 0) "Kuis & Evaluasi (${p.quizCompleted}/${p.quizTotal})" else "Kuis & Evaluasi"
            list.add(Triple(quizLabel, quizPct, NeonWarning))

            val sessionPct = if (p.sessionTotal > 0) (p.sessionAttended.toFloat() / p.sessionTotal.toFloat()).coerceIn(0f, 1f) else 0f
            val sessionLabel = if (p.sessionTotal > 0) "Kehadiran Sesi (${p.sessionAttended}/${p.sessionTotal})" else "Kehadiran Sesi"
            list.add(Triple(sessionLabel, sessionPct, StudentNeon))

            list
        } else {
            listOf(
                Triple("Materi & Modul", 0f, NeonBlue),
                Triple("Tugas Mandiri", 0f, NeonSuccess),
                Triple("Kuis & Evaluasi", 0f, NeonWarning),
                Triple("Kehadiran Sesi", 0f, StudentNeon),
            )
        }

        val overallDisplayPct = p?.overallProgress?.toInt()?.coerceIn(0, 100) ?: 0

        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                LightSectionHeader("Progres Belajar", if (p != null) "$overallDisplayPct% Selesai" else "", onSeeAll = onNavigateToProgress)
                Spacer(Modifier.height(14.dp))
                progressItems.forEach { (subj, pct, color) ->
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
private fun CompactAgendaItem(
    time: String,
    code: String,
    color: Color,
    isActive: Boolean = false,
    onClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .width(80.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(if (isActive) color.copy(alpha = 0.12f) else color.copy(alpha = 0.06f))
            .border(
                width = if (isActive) 1.5.dp else 1.dp,
                color = if (isActive) color.copy(alpha = 0.5f) else color.copy(alpha = 0.2f),
                shape = RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (isActive) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(color)
                )
                Spacer(Modifier.height(4.dp))
            }
            Text(code, fontWeight = FontWeight.Black, fontSize = 14.sp, color = color)
            Text(time, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        }
    }
}
