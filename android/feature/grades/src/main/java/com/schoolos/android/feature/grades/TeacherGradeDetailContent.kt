package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Info
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
import com.schoolos.android.domain.model.SubjectGradeDetail

@Composable
fun TeacherGradeDetailContent(
    detail: SubjectGradeDetail
) {
    val components = detail.components
    val graded = components.mapNotNull { it.rawScore ?: it.weightedScore }
    val avg = if (graded.isNotEmpty()) graded.average() else 0.0
    val passingCount = graded.count { it >= 75.0 }
    val totalCount = components.size

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            "Rincian Penilaian",
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            color = TextPrimary,
            modifier = Modifier.padding(start = 4.dp, top = 4.dp)
        )

        if (components.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Belum ada data nilai tercatat untuk mata pelajaran ini.", fontSize = 12.sp, color = TextTertiary)
            }
        } else {
            components.forEach { entry ->
                val score = entry.rawScore ?: entry.weightedScore ?: 0.0
                val grade = when {
                    score >= 85.0 -> "A"
                    score >= 75.0 -> "B"
                    score >= 65.0 -> "C"
                    score > 0.0 -> "D"
                    else -> "-"
                }
                TeacherStudentGradeRow(entry.componentName, score, grade)
            }
        }

        // ── Statistik Kelas Card ─────────────────────
        if (components.isNotEmpty()) {
            GlassCard(cornerRadius = 16.dp) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Statistik Penilaian", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    Spacer(Modifier.height(14.dp))
                    
                    SummaryRowCompact("Rata-rata Nilai", if (graded.isNotEmpty()) "%.1f".format(avg) else "-")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 8.dp))
                    SummaryRowCompact("Tuntas KKM", "$passingCount / $totalCount Selesai")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 8.dp))
                    SummaryRowCompact("Tingkat Kelulusan", if (totalCount > 0) "${((passingCount.toDouble() / totalCount) * 100).toInt()}%" else "-")
                }
            }
        }
    }
}

@Composable
private fun TeacherStudentGradeRow(name: String, score: Double, grade: String) {
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
            Text(name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, modifier = Modifier.weight(1f))
            Column(horizontalAlignment = Alignment.End) {
                Text("%.1f".format(score), fontWeight = FontWeight.Black, fontSize = 15.sp, color = TextPrimary)
                Text("Predikat $grade", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (grade == "A") NeonSuccess else NeonBlue)
            }
            Spacer(Modifier.width(14.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun SummaryRowCompact(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
    }
}
