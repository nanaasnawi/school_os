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
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import com.schoolos.android.domain.model.LearningSession

@Composable
fun TeacherSessionDetailContent(
    session: LearningSession,
    onOpenAssignments: (String) -> Unit,
    onOpenQuizzes: (String) -> Unit,
    onOpenMaterials: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Management Metrics
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            GlassCard(modifier = Modifier.weight(1f), cornerRadius = 14.dp) {
                Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("HADIR", fontSize = 9.sp, fontWeight = FontWeight.Black, color = TextTertiary)
                    Text("- / -", fontSize = 16.sp, fontWeight = FontWeight.Black, color = NeonSuccess)
                }
            }
            GlassCard(modifier = Modifier.weight(1f), cornerRadius = 14.dp) {
                Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("DURASI", fontSize = 9.sp, fontWeight = FontWeight.Black, color = TextTertiary)
                    Text("- Menit", fontSize = 16.sp, fontWeight = FontWeight.Black, color = NeonBlue)
                }
            }
        }

        // Integrated Resource Hub
        Text("KELOLA SUMBER DAYA", fontSize = 11.sp, fontWeight = FontWeight.Black, color = TextTertiary, letterSpacing = 1.sp, modifier = Modifier.padding(start = 4.dp))
        GlassCard(cornerRadius = 16.dp) {
            Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ResourceItem("Beri Tugas", Icons.AutoMirrored.Filled.Assignment, StudentNeon, Modifier.weight(1f)) { onOpenAssignments(session.lessonId) }
                ResourceItem("Buat Kuis", Icons.Default.Quiz, NeonSuccess, Modifier.weight(1f)) { onOpenQuizzes(session.lessonId) }
                ResourceItem("Materi", Icons.Default.Book, NeonBlue, Modifier.weight(1f)) { onOpenMaterials(session.lessonId) }
            }
        }

        // Attendance Roster
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Rekap Presensi Siswa", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                    Box(modifier = Modifier.clip(CircleShape).background(NeonBlue.copy(alpha = 0.1f)).border(1.dp, NeonBlue.copy(alpha = 0.3f), CircleShape).padding(horizontal = 10.dp, vertical = 4.dp)) {
                        Text("Cek Semua", color = NeonBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(Modifier.height(14.dp))
                
                val students = emptyList<Pair<String, String>>()
                
                students.forEach { (name, status) ->
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = status == "present",
                            onCheckedChange = {},
                            colors = CheckboxDefaults.colors(checkedColor = NeonSuccess)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(name, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = TextPrimary, modifier = Modifier.weight(1f))
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
                ) {
                    Text("SIMPAN PRESENSI", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
                }
            }
        }
    }
}
