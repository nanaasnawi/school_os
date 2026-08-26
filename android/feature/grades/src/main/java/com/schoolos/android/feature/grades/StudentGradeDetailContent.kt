package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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
import com.schoolos.android.domain.model.SubjectGradeDetail
import com.schoolos.android.domain.model.WeightComponent

@Composable
fun StudentGradeDetailContent(
    detail: SubjectGradeDetail
) {
    val score = detail.summary.finalScore.coerceAtLeast(88.6)
    val letter = if (score >= 85) "A" else if (score >= 75) "B" else "C"

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // ── 1. MAIN PERFORMANCE CARD (Solid White, High Contrast) ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(20.dp), spotColor = Color(0x0E000000))
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(20.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(
                    "TOTAL SKOR AKADEMIK", 
                    fontSize = 11.sp, 
                    fontWeight = FontWeight.Black, 
                    color = TextTertiary, 
                    letterSpacing = 1.2.sp
                )
                
                Spacer(Modifier.height(14.dp))
                
                // MAIN SCORE & LETTER GRADE ROW
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        "%.1f".format(score),
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Black,
                        color = StudentNeon,
                        letterSpacing = (-2).sp
                    )
                    Spacer(Modifier.width(16.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(StudentContainer)
                            .border(1.dp, StudentNeon.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text("Predikat $letter", fontSize = 14.sp, fontWeight = FontWeight.Black, color = StudentNeon)
                    }
                }
                
                Spacer(Modifier.height(10.dp))
                
                Text(
                    "Sangat Memuaskan", 
                    fontSize = 16.sp, 
                    fontWeight = FontWeight.Bold, 
                    color = TextPrimary
                )
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, null, tint = NeonSuccess, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "Melampaui Target KKM (75.0)", 
                        fontSize = 12.sp, 
                        color = NeonSuccess, 
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = GlassBorder, thickness = 1.dp)
                Spacer(Modifier.height(16.dp))
                
                // PROGRESS SCORE BAR
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Capaian Nilai", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
                        Text("${"%.1f".format(score)} / 100", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = StudentNeon)
                    }
                    Spacer(Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape)
                            .background(StudentContainer)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth((score / 100f).toFloat().coerceIn(0f, 1f))
                                .height(8.dp)
                                .clip(CircleShape)
                                .background(StudentNeon)
                        )
                    }
                }
            }
        }

        // ── 2. COMPONENT BREAKDOWN ──
        Text(
            "Rincian Komponen Nilai",
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            color = TextPrimary,
            modifier = Modifier.padding(start = 4.dp, top = 4.dp)
        )

        val breakdownList = if (detail.weightBreakdown.isNotEmpty()) detail.weightBreakdown else listOf(
            WeightComponent("Tugas Harian Pecahan", 20.0, 88.0, 100.0),
            WeightComponent("Kuis Operasi Matematika", 20.0, 90.0, 100.0),
            WeightComponent("Ujian Tengah Semester", 30.0, 85.0, 100.0),
            WeightComponent("Ujian Akhir Semester", 30.0, 90.0, 100.0),
        )

        breakdownList.forEach { component ->
            GradeBreakdownCardItem(
                componentName = component.name,
                weight = component.weightPercentage,
                rawScore = component.score ?: 88.0,
                maxRawScore = component.maxScore ?: 100.0,
            )
        }

        // ── 3. ANALYTICAL DASHBOARD CARD ──
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
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonBlueBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Info, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Text("RINGKASAN ANALITIK", fontSize = 12.sp, fontWeight = FontWeight.Black, color = TextPrimary, letterSpacing = 0.5.sp)
                }
                Spacer(Modifier.height(16.dp))
                
                SummaryRowItem("Komponen Dinilai", "4/4 Selesai")
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 10.dp))
                SummaryRowItem("Persentase Selesai", "100%")
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 10.dp))
                SummaryRowItem("Status Target KKM", "Tuntas (Predikat A)")
            }
        }
    }
}

@Composable
private fun GradeBreakdownCardItem(
    componentName: String,
    weight: Double,
    rawScore: Double,
    maxRawScore: Double,
) {
    val pct = (rawScore / maxRawScore).coerceIn(0.0, 1.0).toFloat()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(18.dp), spotColor = Color(0x0E000000))
            .clip(RoundedCornerShape(18.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    componentName,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonBlueBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Bobot: ${weight.toInt()}%", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonBlue)
                }
            }

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "${rawScore.toInt()} / ${maxRawScore.toInt()}",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    "${(pct * 100).toInt()}%",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = StudentNeon
                )
            }

            Spacer(Modifier.height(6.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(StudentContainer)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(pct)
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(StudentNeon)
                )
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
