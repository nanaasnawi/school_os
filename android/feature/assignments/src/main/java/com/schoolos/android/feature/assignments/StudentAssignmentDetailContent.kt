package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission

@Composable
fun StudentAssignmentDetailContent(
    assignment: Assignment,
    submission: AssignmentSubmission?,
    isParent: Boolean,
    isSubmitting: Boolean,
    content: String,
    onContentChange: (String) -> Unit,
    onOpenMaterial: (String) -> Unit,
    onSubmitClick: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Metadata Card
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    assignment.dueAt?.let { dueIso ->
                        EducationalDateBadge(dateIso = dueIso, showTime = true, accentColor = NeonBlue)
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(NeonSuccess.copy(alpha = 0.08f)).border(1.dp, NeonSuccess.copy(alpha = 0.2f), RoundedCornerShape(10.dp)).padding(horizontal = 10.dp, vertical = 6.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Grade, null, tint = NeonSuccess, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Maks: ${assignment.maxScore} Poin", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }
                    }
                }

                if (assignment.description?.isNotBlank() == true) {
                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    Spacer(Modifier.height(16.dp))
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

        // Instructions
        if (assignment.instructions?.isNotBlank() == true) {
            GlassCard(cornerRadius = 16.dp) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("📌 Petunjuk Pengerjaan", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Spacer(Modifier.height(6.dp))
                    Text(assignment.instructions!!, fontSize = 12.sp, color = TextSecondary, lineHeight = 18.sp)
                }
            }
        }

        // Related Materials
        Text("Materi Terkait", fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextPrimary, modifier = Modifier.padding(start = 4.dp, top = 4.dp))
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(NeonBlue.copy(alpha = 0.05f))
                        .clickable { onOpenMaterial("1") }.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)).background(NeonBlue.copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Book, null, tint = NeonBlue, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Modul Operasi Pecahan", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("PDF • 2.4 MB", fontSize = 11.sp, color = TextTertiary)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
                }
            }
        }

        // Submission
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(if (isParent) Icons.Default.Grade else Icons.Default.Send, null, tint = StudentNeon, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (isParent) "Status Pengumpulan Ahmad" else "Pengumpulan Tugas", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
                Spacer(Modifier.height(12.dp))

                if (submission != null) {
                    SubmissionStatusCard(submission)
                } else if (isParent) {
                    Text("Ahmad belum mengumpulkan tugas ini.", fontSize = 12.sp, color = TextTertiary)
                } else {
                    OutlinedTextField(
                        value = content,
                        onValueChange = onContentChange,
                        placeholder = { Text("Tulis jawaban atau catatan tugas di sini...", fontSize = 12.sp) },
                        modifier = Modifier.fillMaxWidth().height(110.dp),
                        maxLines = 4,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = StudentNeon, unfocusedBorderColor = GlassBorder)
                    )
                    Spacer(Modifier.height(14.dp))
                    Button(
                        onClick = onSubmitClick,
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = StudentNeon)
                    ) {
                        if (isSubmitting) CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        else Text("Kumpulkan PR Sekarang", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SubmissionStatusCard(submission: AssignmentSubmission) {
    Box(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(CosmicDark).border(1.dp, GlassBorder, RoundedCornerShape(12.dp)).padding(14.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Status PR: ", fontSize = 12.sp, color = TextSecondary)
                Text(submission.status.replaceFirstChar { it.uppercase() }, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (submission.status == "graded") NeonSuccess else NeonBlue)
            }
            submission.score?.let {
                Spacer(Modifier.height(4.dp))
                Text("Nilai: $it Poin", fontSize = 13.sp, fontWeight = FontWeight.Black, color = StudentNeon)
            }
        }
    }
}
