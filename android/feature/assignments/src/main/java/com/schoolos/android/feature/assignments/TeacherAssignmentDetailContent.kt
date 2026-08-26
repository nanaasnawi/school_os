package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TeacherAssignmentDetailContent(
    assignment: Assignment,
    allSubmissions: List<AssignmentSubmission>
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

        // Grading Roster
        Text("Rekap Pengumpulan Siswa", fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextPrimary, modifier = Modifier.padding(start = 4.dp, top = 8.dp))
        
        if (allSubmissions.isEmpty()) {
            GlassCard(cornerRadius = 16.dp) {
                Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text("Belum ada siswa yang mengumpulkan.", fontSize = 13.sp, color = TextTertiary)
                }
            }
        } else {
            allSubmissions.forEach { submission ->
                TeacherSubmissionRow(submission)
            }
        }
    }
}

@Composable
private fun TeacherSubmissionRow(submission: AssignmentSubmission) {
    GlassCard(cornerRadius = 14.dp) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape).background(NeonBlue.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, null, tint = NeonBlue, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Siswa ID: ${submission.studentId.take(8)}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                Text("Kumpul: ${submission.submittedAt.take(10)}", fontSize = 11.sp, color = TextTertiary)
            }
            Column(horizontalAlignment = Alignment.End) {
                if (submission.status == "graded") {
                    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(NeonSuccess.copy(alpha = 0.1f)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                        Text("${submission.score} Poin", color = NeonSuccess, fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                } else {
                    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(NeonError.copy(alpha = 0.1f)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                        Text("BELUM NILAI", color = NeonError, fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
            Spacer(Modifier.width(12.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}
