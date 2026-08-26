package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission

@OptIn(ExperimentalLayoutApi::class)
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
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Metadata Card (Fixed Shadow Order)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = Color(0x0E000000))
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(18.dp)
        ) {
            Column {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    assignment.dueAt?.let { dueIso ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(NeonBlueBg)
                                .border(1.dp, NeonBlue.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Schedule, null, tint = NeonBlue, modifier = Modifier.size(13.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(formatDateShort(dueIso), fontSize = 11.sp, fontWeight = FontWeight.Black, color = NeonBlue)
                            }
                        }
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
                            Text("${assignment.maxScore} Poin", fontSize = 11.sp, fontWeight = FontWeight.Black, color = NeonSuccess)
                        }
                    }
                }

                if (assignment.description?.isNotBlank() == true) {
                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = GlassBorder, thickness = 1.dp)
                    Spacer(Modifier.height(14.dp))
                    Text(
                        "DESKRIPSI TUGAS PR",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(assignment.description!!, fontSize = 13.sp, color = TextPrimary, lineHeight = 20.sp)
                }
            }
        }

        // Instructions Card (Fixed Shadow Order)
        if (assignment.instructions?.isNotBlank() == true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = Color(0x0E000000))
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📌", fontSize = 14.sp)
                        Spacer(Modifier.width(6.dp))
                        Text("Petunjuk Pengerjaan PR", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(assignment.instructions!!, fontSize = 13.sp, color = TextSecondary, lineHeight = 19.sp)
                }
            }
        }

        // Related Materials Card (Fixed Shadow Order)
        Text("Materi Terkait", fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextPrimary, modifier = Modifier.padding(start = 4.dp, top = 2.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = Color(0x0E000000))
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonBlueBg)
                    .clickable { onOpenMaterial("1") }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(NeonBlue),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Book, null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Modul Operasi Pecahan", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("PDF • 2.4 MB", fontSize = 11.sp, color = TextTertiary)
                }
                Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(18.dp))
            }
        }

        // Submission Section Card (Fixed Shadow Order)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = Color(0x0E000000))
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(18.dp)
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(if (isParent) Icons.Default.Grade else Icons.Default.Send, null, tint = StudentNeon, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (isParent) "Status Pengumpulan Ahmad" else "Pengumpulan Tugas PR", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
                Spacer(Modifier.height(14.dp))

                if (submission != null) {
                    SubmissionStatusCard(submission)
                } else if (isParent) {
                    Text("Ahmad belum mengumpulkan tugas ini.", fontSize = 12.sp, color = TextTertiary)
                } else {
                    OutlinedTextField(
                        value = content,
                        onValueChange = onContentChange,
                        placeholder = { Text("Tulis jawaban atau catatan tugas PR di sini...", fontSize = 12.sp, color = TextTertiary) },
                        modifier = Modifier.fillMaxWidth().height(110.dp),
                        maxLines = 4,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = StudentNeon,
                            unfocusedBorderColor = GlassBorder,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        )
                    )
                    
                    Spacer(Modifier.height(12.dp))
                    
                    // Attachment Button Card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                            .clickable { /* File Picker */ }
                            .padding(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Add, null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Tambah Lampiran (Gambar / File PDF)", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = onSubmitClick,
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(14.dp),
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
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(CosmicBlack)
            .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
            .padding(14.dp)
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
