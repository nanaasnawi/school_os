package com.schoolos.android.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Progress Score Bar — Neon dark version ───────────────────────────────────
@Composable
fun ProgressScoreBar(
    score: Double,
    maxScore: Double = 100.0,
    modifier: Modifier = Modifier,
) {
    val progress = if (maxScore > 0) (score / maxScore).toFloat().coerceIn(0f, 1f) else 0f
    val color = when {
        progress >= 0.9f -> NeonSuccess
        progress >= 0.7f -> NeonBlue
        progress >= 0.5f -> NeonWarning
        else -> NeonError
    }
    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.12f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(progress)
                    .height(8.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(color.copy(alpha = 0.7f), color)))
                    .shadow(elevation = 2.dp, shape = CircleShape, spotColor = color)
            )
        }
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "${"%.1f".format(score)} / ${"%.0f".format(maxScore)}",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
            )
            Text(
                "${(progress * 100).toInt()}%",
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                color = color
            )
        }
    }
}

// ─── Letter Grade Badge — Dark neon ───────────────────────────────────────────
@Composable
fun LetterGradeBadge(
    letter: String,
    modifier: Modifier = Modifier,
) {
    val color = when (letter) {
        "A" -> NeonSuccess
        "B" -> NeonBlue
        "C" -> NeonWarning
        "D" -> Color(0xFFFF9800)
        else -> NeonError
    }
    Box(
        modifier = modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(color.copy(alpha = 0.1f))
            .border(1.5.dp, color.copy(alpha = 0.35f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            letter, 
            fontWeight = FontWeight.Black, 
            fontSize = 20.sp, 
            color = color,
            letterSpacing = (-0.5).sp
        )
    }
}

// ─── Grade Breakdown Card — Dark glass ────────────────────────────────────────
@Composable
fun GradeBreakdownCard(
    componentName: String,
    weight: Double,
    rawScore: Double?,
    maxRawScore: Double?,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .shadow(4.dp, RoundedCornerShape(22.dp), spotColor = GlassOverlay)
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(22.dp))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)
        ) {
            // DYNAMIC CATEGORY ACCENT
            Box(
                modifier = Modifier
                    .width(6.dp)
                    .fillMaxHeight()
                    .background(NeonBlue.copy(alpha = 0.5f))
            )
            
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            componentName, 
                            fontWeight = FontWeight.Black, 
                            fontSize = 15.sp, 
                            color = TextPrimary,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 20.sp
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Bobot Nilai: ${"%.0f".format(weight)}%", 
                            fontSize = 11.sp, 
                            color = TextTertiary, 
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    Spacer(Modifier.width(12.dp))

                    if (rawScore != null && maxRawScore != null) {
                        val pct = (rawScore / maxRawScore * 100).toInt()
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(NeonBlue.copy(alpha = 0.08f))
                                .border(1.dp, NeonBlue.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("$pct%", fontSize = 12.sp, color = NeonBlue, fontWeight = FontWeight.Black)
                        }
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                
                if (rawScore != null && maxRawScore != null) {
                    ProgressScoreBar(score = rawScore, maxScore = maxRawScore)
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(CosmicDark)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("MENUNGGU PENILAIAN", fontSize = 10.sp, color = TextTertiary, fontWeight = FontWeight.Black, letterSpacing = 1.2.sp)
                    }
                }
            }
        }
    }
}
