package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.GlassOverlay
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentContainer
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.SubjectGradeDetail
import com.schoolos.android.domain.model.WeightComponent

@Composable
fun StudentGradeDetailContent(
    detail: SubjectGradeDetail
) {
    val score = detail.summary.finalScore
    val letter = detail.summary.letterGrade
    val kkm = 75.0
    val kkmDiff = score - kkm
    val isPassing = score >= kkm

    val evaluationTitle = when {
        score >= 85.0 -> "Predikat Istimewa (A)"
        score >= 75.0 -> "Kompeten & Tuntas (B)"
        score >= 65.0 -> "Cukup Memadai (C)"
        score > 0.0 -> "Perlu Remedial (D)"
        else -> "Belum Ada Catatan Nilai"
    }

    val evaluationDesc = when {
        score >= 85.0 -> "Prestasi luar biasa! Capaian akademik Anda berada pada kuadran kompetensi tertinggi."
        score >= 75.0 -> "Kerja bagus! Nilai Anda telah memenuhi dan melampaui standar kelulusan KKM yang ditetapkan."
        score >= 65.0 -> "Capaian mendekati target KKM. Perbanyak latihan mandiri untuk mengoptimalkan nilai akhir."
        score > 0.0 -> "Nilai saat ini di bawah standar KKM (75.0). Konsultasikan jadwal bimbingan remedial dengan guru pengampu."
        else -> "Komponen penilaian sedang dalam proses evaluasi oleh guru mata pelajaran."
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // ── 1. HERO ACADEMIC PERFORMANCE CARD ────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(6.dp, RoundedCornerShape(22.dp), spotColor = StudentNeon.copy(alpha = 0.25f))
                .clip(RoundedCornerShape(22.dp))
                .background(CosmicNavy)
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        listOf(
                            if (isPassing) NeonSuccess.copy(alpha = 0.4f) else NeonWarning.copy(alpha = 0.4f),
                            GlassBorder
                        )
                    ),
                    shape = RoundedCornerShape(22.dp)
                )
                .padding(20.dp)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Top Tag + KKM Surplus Badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(if (isPassing) NeonSuccess else NeonWarning)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "STATUS AKADEMIK",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = TextTertiary,
                            letterSpacing = 1.2.sp
                        )
                    }

                    // KKM Tag Chip
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                if (isPassing) NeonSuccess.copy(alpha = 0.12f)
                                else NeonWarning.copy(alpha = 0.12f)
                            )
                            .border(
                                1.dp,
                                if (isPassing) NeonSuccess.copy(alpha = 0.35f)
                                else NeonWarning.copy(alpha = 0.35f),
                                RoundedCornerShape(10.dp)
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isPassing) Icons.Default.CheckCircle else Icons.Default.Warning,
                                contentDescription = null,
                                tint = if (isPassing) NeonSuccess else NeonWarning,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            val kkmText = if (isPassing) {
                                "+${"%.1f".format(kkmDiff)} dari KKM"
                            } else {
                                "${"%.1f".format(kkmDiff)} dari KKM"
                            }
                            Text(
                                text = kkmText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isPassing) NeonSuccess else NeonWarning
                            )
                        }
                    }
                }

                Spacer(Modifier.height(18.dp))

                // Score + Grade Badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "%.1f".format(score),
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isPassing) StudentNeon else NeonWarning,
                        letterSpacing = (-2).sp
                    )

                    Spacer(Modifier.width(18.dp))

                    Column(horizontalAlignment = Alignment.Start) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(
                                            StudentNeon.copy(alpha = 0.20f),
                                            NeonBlue.copy(alpha = 0.12f)
                                        )
                                    )
                                )
                                .border(
                                    1.dp,
                                    Brush.horizontalGradient(
                                        listOf(StudentNeon, NeonBlue)
                                    ),
                                    RoundedCornerShape(14.dp)
                                )
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = StudentNeon,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(Modifier.width(5.dp))
                                Text(
                                    text = "Predikat $letter",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                        }

                        Spacer(Modifier.height(4.dp))

                        Text(
                            text = "Standar KKM: 75.0",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextTertiary
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Evaluation Headline & Description
                Text(
                    text = evaluationTitle,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )

                Spacer(Modifier.height(4.dp))

                Text(
                    text = evaluationDesc,
                    fontSize = 12.sp,
                    color = TextSecondary,
                    lineHeight = 17.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )

                Spacer(Modifier.height(20.dp))
                HorizontalDivider(color = GlassBorder, thickness = 1.dp)
                Spacer(Modifier.height(18.dp))

                // BENCHMARK PROGRESS BAR WITH KKM MARKER
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Skor Akhir Berbobot",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            "${"%.1f".format(score)} / 100",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = StudentNeon
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    // Dual-tone bar with KKM benchmark marker
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(CircleShape)
                            .background(CosmicBlack)
                            .border(0.5.dp, GlassBorder, CircleShape)
                    ) {
                        // Fill bar
                        val fillFrac = (score / 100.0).coerceIn(0.0, 1.0).toFloat()
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(fillFrac)
                                .height(10.dp)
                                .clip(CircleShape)
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(
                                            StudentNeon,
                                            if (isPassing) NeonSuccess else NeonWarning
                                        )
                                    )
                                )
                        )
                    }

                    Spacer(Modifier.height(6.dp))

                    // Indicator labels: 0, KKM (75), 100
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("0", fontSize = 10.sp, color = TextTertiary)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(4.dp)
                                    .clip(CircleShape)
                                    .background(NeonWarning)
                            )
                            Spacer(Modifier.width(3.dp))
                            Text("Target KKM: 75", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonWarning)
                        }
                        Text("100", fontSize = 10.sp, color = TextTertiary)
                    }
                }
            }
        }

        // ── 2. COMPONENT BREAKDOWN SECTION ───────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    "Rincian Komponen Nilai",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )
                Text(
                    "Bobot kurikulum & kontribusi poin akhir",
                    fontSize = 11.sp,
                    color = TextTertiary
                )
            }

            val totalWeight = detail.weightBreakdown.sumOf { it.weightPercentage }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(StudentContainer)
                    .border(1.dp, StudentNeon.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "Total Bobot: ${totalWeight.toInt()}%",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = StudentNeon
                )
            }
        }

        if (detail.weightBreakdown.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                    .padding(28.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = TextTertiary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Belum ada rincian komponen nilai yang dicatat untuk mata pelajaran ini.",
                        fontSize = 12.sp,
                        color = TextTertiary,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            detail.weightBreakdown.forEach { component ->
                GradeBreakdownCardItem(
                    component = component
                )
            }
        }

        // ── 3. ANALYTICAL DEEP-DIVE DASHBOARD ────────────────────────────────
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonBlue.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.BarChart,
                            contentDescription = null,
                            tint = NeonBlue,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            "ANALISIS PERFORMA BELAJAR",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            "Ringkasan evaluasi capaian semester aktif",
                            fontSize = 10.sp,
                            color = TextTertiary
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                val gradedCount = detail.summary.gradedComponentCount
                val totalCount = detail.summary.componentCount
                val compText = if (totalCount > 0) "$gradedCount dari $totalCount Dinilai" else "-"
                val pctText = "${detail.summary.completionPercentage.toInt()}% Lengkap"
                val kkmStatusText = if (isPassing) "Tuntas KKM ✓" else "Belum Tuntas !"
                val kkmStatusColor = if (isPassing) NeonSuccess else NeonWarning

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AnalyticsMiniTile(
                        label = "Komponen",
                        value = compText,
                        color = NeonBlue,
                        modifier = Modifier.weight(1f)
                    )
                    AnalyticsMiniTile(
                        label = "Progres",
                        value = pctText,
                        color = StudentNeon,
                        modifier = Modifier.weight(1f)
                    )
                    AnalyticsMiniTile(
                        label = "Kelulusan",
                        value = kkmStatusText,
                        color = kkmStatusColor,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(Modifier.height(16.dp))

                // Recommendation Advice Banner
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(CosmicBlack)
                        .border(1.dp, GlassBorder2, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = NeonBlue,
                            modifier = Modifier.size(16.dp).padding(top = 1.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(
                                "Rekomendasi Belajar",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(Modifier.height(2.dp))
                            val tipText = when {
                                score >= 85.0 -> "Pertahankan konsistensi performa pada tugas harian dan ujian tengah semester untuk mengamankan nilai akhir sempurna."
                                score >= 75.0 -> "Hasil penilaian Anda stabil. Maksimalkan pemahaman materi praktikum dan kuis untuk meningkatkan predikat menjadi A."
                                else -> "Tingkatkan nilai komponen yang masih belum optimal. Hubungi wali kelas atau guru mata pelajaran untuk konsultasi perbaikan nilai."
                            }
                            Text(
                                text = tipText,
                                fontSize = 11.sp,
                                color = TextSecondary,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }
        }

        // ── 4. GRADE SCALE REFERENCE LEGEND ──────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(CosmicNavy)
                .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "PEDOMAN SKALA PENILAIAN",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = TextTertiary,
                    letterSpacing = 0.8.sp
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    GradeScaleTierItem("A", "85 - 100", "Sangat Baik", StudentNeon)
                    GradeScaleTierItem("B", "75 - 84", "Baik (KKM)", NeonSuccess)
                    GradeScaleTierItem("C", "65 - 74", "Cukup", NeonWarning)
                    GradeScaleTierItem("D", "< 65", "Remedial", NeonError)
                }
            }
        }
    }
}

@Composable
private fun GradeBreakdownCardItem(
    component: WeightComponent
) {
    val name = component.name
    val weight = component.weightPercentage
    val rawScore = component.score ?: 0.0
    val maxRawScore = component.maxScore ?: 100.0
    val pct = if (maxRawScore > 0) (rawScore / maxRawScore).coerceIn(0.0, 1.0).toFloat() else 0f
    val contribution = if (maxRawScore > 0) (rawScore / maxRawScore) * weight else 0.0

    // Determine intuitive component icon & color
    val lower = name.lowercase()
    val (icon: ImageVector, accentColor: Color) = when {
        lower.contains("kuis") || lower.contains("quiz") || lower.contains("ulangan") ->
            Pair(Icons.Default.Bolt, NeonWarning)
        lower.contains("uts") || lower.contains("tengah") || lower.contains("mid") ->
            Pair(Icons.Default.Assessment, TeacherNeon)
        lower.contains("uas") || lower.contains("akhir") || lower.contains("pas") || lower.contains("pat") ->
            Pair(Icons.Default.School, StudentNeon)
        lower.contains("praktik") || lower.contains("proyek") || lower.contains("lab") ->
            Pair(Icons.Default.Science, NeonSuccess)
        else ->
            Pair(Icons.AutoMirrored.Filled.Assignment, NeonBlue)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(18.dp), spotColor = GlassOverlay)
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header: Icon + Title + Weight Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(accentColor.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(Modifier.width(12.dp))

                    Column {
                        Text(
                            text = name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Nilai Mentah: ${rawScore.toInt()} / ${maxRawScore.toInt()}",
                            fontSize = 11.sp,
                            color = TextTertiary
                        )
                    }
                }

                // Weight Chip
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.10f))
                        .border(1.dp, accentColor.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Bobot: ${weight.toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = accentColor
                    )
                }
            }

            // Score Ratio & Final Grade Contribution Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${(pct * 100).toInt()}%",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "capaian",
                        fontSize = 11.sp,
                        color = TextTertiary
                    )
                }

                // Score Contribution Pill (Points added to total)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonSuccess.copy(alpha = 0.10f))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "+${"%.1f".format(contribution)} Poin Akhir",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = NeonSuccess
                    )
                }
            }

            // Progress Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(7.dp)
                    .clip(CircleShape)
                    .background(CosmicBlack)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(pct)
                        .height(7.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.horizontalGradient(
                                listOf(accentColor, accentColor.copy(alpha = 0.75f))
                            )
                        )
                )
            }
        }
    }
}

@Composable
private fun AnalyticsMiniTile(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(CosmicBlack)
            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
            .padding(10.dp)
    ) {
        Column {
            Text(label, fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(4.dp))
            Text(
                value,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = color,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun GradeScaleTierItem(
    letter: String,
    range: String,
    desc: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.14f))
                .border(1.dp, color.copy(alpha = 0.4f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(letter, fontSize = 13.sp, fontWeight = FontWeight.Black, color = color)
        }
        Spacer(Modifier.height(4.dp))
        Text(range, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Text(desc, fontSize = 8.sp, color = TextTertiary)
    }
}
