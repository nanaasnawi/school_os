package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TeacherAssignmentDetailContent(
    assignment: Assignment,
    allSubmissions: List<AssignmentSubmission>,
    isGrading: Boolean = false,
    gradeSuccess: Boolean = false,
    gradeError: String? = null,
    onGrade: (submissionId: String, score: Int, feedback: String?) -> Unit = { _, _, _ -> },
    onDismissGradeSuccess: () -> Unit = {},
    onDismissGradeError: () -> Unit = {},
) {
    // Track which submission is open in the grading dialog
    var gradingSubmission by remember { mutableStateOf<AssignmentSubmission?>(null) }

    // Grade success snackbar
    LaunchedEffect(gradeSuccess) {
        if (gradeSuccess) {
            kotlinx.coroutines.delay(2000)
            onDismissGradeSuccess()
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // ── STATS OVERVIEW ──
        val gradedCount = allSubmissions.count { it.status == "graded" }
        val totalCount = allSubmissions.size
        val pendingCount = totalCount - gradedCount
        val progress = if (totalCount > 0) gradedCount.toFloat() / totalCount else 0f

        if (totalCount > 0) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(CosmicNavy, NeonBlue.copy(alpha = 0.08f))
                        )
                    )
                    .border(1.dp, NeonBlue.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Rekap Penilaian Tugas",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            "$gradedCount / $totalCount Dinilai",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonBlue
                        )
                    }

                    // Progress bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape)
                            .background(NeonBlue.copy(alpha = 0.1f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(progress)
                                .height(8.dp)
                                .clip(CircleShape)
                                .background(
                                    Brush.horizontalGradient(listOf(NeonBlue, NeonSuccess))
                                )
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        StatBadge("✅ Sudah Dinilai", gradedCount.toString(), NeonSuccess, Modifier.weight(1f))
                        StatBadge("⏳ Belum Dinilai", pendingCount.toString(), NeonWarning, Modifier.weight(1f))
                        StatBadge("📊 Nilai Maks", "${assignment.maxScore}", NeonBlue, Modifier.weight(1f))
                    }
                }
            }
        }

        // ── METADATA CARD ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                .clip(RoundedCornerShape(20.dp))
                .background(CosmicNavy)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(18.dp)
        ) {
            Column {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    assignment.dueAt?.let { dueIso ->
                        EducationalDateBadge(dateIso = dueIso, showTime = true, accentColor = NeonBlue)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(SuccessBg)
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Grade, null, tint = NeonSuccess, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Maks: ${assignment.maxScore} Poin", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }
                    }
                }

                if (assignment.description?.isNotBlank() == true) {
                    Spacer(Modifier.height(14.dp))
                    HorizontalDivider(color = GlassBorder, thickness = 1.dp)
                    Spacer(Modifier.height(14.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Description, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Deskripsi Tugas", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(assignment.description!!, fontSize = 12.sp, color = TextSecondary, lineHeight = 18.sp)
                }
            }
        }

        // ── SUCCESS BANNER ──
        if (gradeSuccess) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonSuccess.copy(alpha = 0.12f))
                    .border(1.dp, NeonSuccess.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, null, tint = NeonSuccess, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("✅ Nilai berhasil disimpan!", fontSize = 13.sp, color = NeonSuccess, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── ERROR BANNER ──
        if (!gradeError.isNullOrBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonError.copy(alpha = 0.12f))
                    .border(1.dp, NeonError.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .clickable { onDismissGradeError() }
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Error, null, tint = NeonError, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(gradeError, fontSize = 12.sp, color = NeonError)
                }
            }
        }

        // ── SUBMISSION ROSTER ──
        Row(
            modifier = Modifier.padding(start = 4.dp, top = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Pengumpulan Siswa",
                fontSize = 15.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(NeonBlue.copy(alpha = 0.1f))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text("Ketuk untuk menilai", fontSize = 9.sp, color = NeonBlue, fontWeight = FontWeight.Bold)
            }
        }

        if (allSubmissions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("📭", fontSize = 32.sp)
                    Text("Belum ada siswa yang mengumpulkan.", fontSize = 13.sp, color = TextTertiary)
                }
            }
        } else {
            allSubmissions.forEach { submission ->
                TeacherSubmissionRow(
                    submission = submission,
                    maxScore = assignment.maxScore,
                    onClick = { gradingSubmission = submission }
                )
            }
        }
    }

    // ── GRADING DIALOG ──
    gradingSubmission?.let { sub ->
        GradingDialog(
            submission = sub,
            maxScore = assignment.maxScore,
            isGrading = isGrading,
            onDismiss = { gradingSubmission = null },
            onGrade = { score, feedback ->
                onGrade(sub.id, score, feedback)
                gradingSubmission = null
            }
        )
    }
}

@Composable
private fun StatBadge(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(color.copy(alpha = 0.08f))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = color)
            Text(label, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = TextTertiary, maxLines = 1)
        }
    }
}

@Composable
private fun TeacherSubmissionRow(
    submission: AssignmentSubmission,
    maxScore: Int,
    onClick: () -> Unit,
) {
    val isGraded = submission.status == "graded"
    val accentColor = if (isGraded) NeonSuccess else NeonWarning

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(3.dp, RoundedCornerShape(16.dp), spotColor = accentColor.copy(alpha = 0.1f))
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, accentColor.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.1f))
                    .border(1.dp, accentColor.copy(alpha = 0.3f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (isGraded) {
                    Icon(Icons.Default.CheckCircle, null, tint = accentColor, modifier = Modifier.size(22.dp))
                } else {
                    Icon(Icons.Default.Person, null, tint = accentColor, modifier = Modifier.size(22.dp))
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Siswa: ${submission.studentId.take(8)}...",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = TextPrimary
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "Kumpul: ${submission.submittedAt.take(10)}",
                    fontSize = 10.sp,
                    color = TextTertiary
                )
                val subContent = submission.content
                if (!subContent.isNullOrBlank()) {
                    Spacer(Modifier.height(3.dp))
                    Text(
                        subContent.take(50) + if (subContent.length > 50) "..." else "",
                        fontSize = 10.sp,
                        color = TextSecondary,
                        maxLines = 1
                    )
                }
            }

            Spacer(Modifier.width(8.dp))

            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (isGraded) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(SuccessBg)
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "${submission.score}/${maxScore}",
                            color = NeonSuccess,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonWarning.copy(alpha = 0.1f))
                            .border(1.dp, NeonWarning.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("NILAI", color = NeonWarning, fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                }
                Icon(
                    if (isGraded) Icons.Default.Edit else Icons.Default.Grade,
                    null,
                    tint = accentColor.copy(alpha = 0.7f),
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GradingDialog(
    submission: AssignmentSubmission,
    maxScore: Int,
    isGrading: Boolean,
    onDismiss: () -> Unit,
    onGrade: (score: Int, feedback: String?) -> Unit,
) {
    var scoreInput by remember { mutableStateOf((submission.score ?: 0).toFloat()) }
    var feedbackInput by remember { mutableStateOf(submission.feedback ?: "") }

    Dialog(
        onDismissRequest = { if (!isGrading) onDismiss() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(CosmicNavy)
                .border(1.dp, NeonBlue.copy(alpha = 0.3f), RoundedCornerShape(24.dp))
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(NeonBlue.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Grade, null, tint = NeonBlue, modifier = Modifier.size(20.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Beri Nilai", fontSize = 16.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                            Text("ID: ${submission.studentId.take(8)}", fontSize = 10.sp, color = TextTertiary)
                        }
                    }
                    IconButton(onClick = { if (!isGrading) onDismiss() }) {
                        Icon(Icons.Default.Close, null, tint = TextTertiary)
                    }
                }

                HorizontalDivider(color = GlassBorder)

                // Student Answer Preview
                val dialogContent = submission.content
                if (!dialogContent.isNullOrBlank()) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            "JAWABAN SISWA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = NeonBlue,
                            letterSpacing = 1.sp
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(CosmicBlack)
                                .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Text(dialogContent, fontSize = 12.sp, color = TextSecondary, lineHeight = 18.sp)
                        }
                    }
                }

                if (!submission.fileUrl.isNullOrBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Attachment, null, tint = NeonBlue, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Ada lampiran file", fontSize = 11.sp, color = NeonBlue)
                    }
                }

                // Score Slider
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "NILAI",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = TextTertiary,
                            letterSpacing = 1.sp
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(NeonBlue.copy(alpha = 0.15f))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "${scoreInput.toInt()} / $maxScore",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = NeonBlue
                            )
                        }
                    }
                    Slider(
                        value = scoreInput,
                        onValueChange = { scoreInput = it },
                        valueRange = 0f..maxScore.toFloat(),
                        steps = maxScore - 1,
                        colors = SliderDefaults.colors(
                            thumbColor = NeonBlue,
                            activeTrackColor = NeonBlue,
                            inactiveTrackColor = GlassBorder,
                        )
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("0", fontSize = 10.sp, color = TextTertiary)
                        Text("$maxScore", fontSize = 10.sp, color = TextTertiary)
                    }
                }

                // Feedback
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "CATATAN / KOMENTAR GURU (opsional)",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )
                    OutlinedTextField(
                        value = feedbackInput,
                        onValueChange = { feedbackInput = it },
                        placeholder = { Text("Tuliskan feedback untuk siswa...", fontSize = 11.sp, color = TextTertiary) },
                        modifier = Modifier.fillMaxWidth().height(90.dp),
                        maxLines = 4,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedContainerColor = CosmicBlack,
                            unfocusedContainerColor = CosmicBlack,
                        )
                    )
                }

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        enabled = !isGrading,
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                        border = ButtonDefaults.outlinedButtonBorder().copy(
                            brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))
                        )
                    ) {
                        Text("Batal", fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            onGrade(
                                scoreInput.toInt(),
                                feedbackInput.trim().ifBlank { null }
                            )
                        },
                        enabled = !isGrading,
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
                    ) {
                        if (isGrading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp)
                            )
                        } else {
                            Icon(
                                Icons.Default.Send,
                                null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Simpan Nilai", fontWeight = FontWeight.Black, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}
