package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.SubjectGradeDetail

@Composable
fun StudentGradeDetailContent(
    detail: SubjectGradeDetail
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // ── 1. OVERALL SCORE FOCUS ──
        GlassCard(cornerRadius = 20.dp) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("PROGRES NILAI", fontSize = 10.sp, fontWeight = FontWeight.Black, color = TextTertiary, letterSpacing = 1.sp)
                        Text("Semester Genap", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonSuccess.copy(alpha = 0.1f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text("Predikat ${detail.summary.letterGrade}", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                }
                
                Spacer(Modifier.height(20.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "%.1f".format(detail.summary.finalScore),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Black,
                        color = StudentNeon,
                        letterSpacing = (-2).sp
                    )
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Sangat Baik", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("Batas KKM: 75.0", fontSize = 11.sp, color = TextTertiary)
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                ProgressScoreBar(score = detail.summary.finalScore, maxScore = 100.0)
            }
        }

        // ── 2. COMPONENT BREAKDOWN ──
        Text(
            "Rincian Komponen Nilai",
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            color = TextPrimary,
            modifier = Modifier.padding(start = 4.dp)
        )

        detail.weightBreakdown.forEach { component ->
            GradeBreakdownCard(
                componentName = component.name,
                weight = component.weightPercentage,
                rawScore = component.score,
                maxRawScore = component.maxScore,
            )
        }

        // ── 3. SUMMARY REPORT ──
        GlassCard(cornerRadius = 16.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Ringkasan Rapor", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
                Spacer(Modifier.height(14.dp))
                
                SummaryRowItem("Komponen Dinilai", "${detail.summary.gradedComponentCount}/${detail.summary.componentCount}")
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 8.dp))
                SummaryRowItem("Persentase Selesai", "${"%.0f".format(detail.summary.completionPercentage)}%")
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 8.dp))
                SummaryRowItem("Update Terakhir", detail.summary.lastCalculated.take(10))
            }
        }
    }
}

@Composable
private fun SummaryRowItem(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
    }
}
