package com.schoolos.android.feature.learning.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*

/**
 * Article & Text Reader View with Typography
 */
@Composable
fun ArticleReaderView(
    title: String,
    content: String,
    textSizeMultiplier: Float = 1.0f,
    modifier: Modifier = Modifier,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CosmicNavy),
        shape = RoundedCornerShape(14.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("📖 Teks Bacaan Lengkap", color = NeonSuccess, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                val wordCount = content.split("\\s+".toRegex()).size
                val estMinutes = maxOf(1, wordCount / 120)
                Text("± $estMinutes mnt baca", color = TextTertiary, fontSize = 11.sp)
            }

            HorizontalDivider(color = GlassBorder)

            val paragraphs = if (content.isNotBlank()) content.split("\n\n") else listOf("Belum ada teks materi.")
            for (p in paragraphs) {
                if (p.isNotBlank()) {
                    Text(
                        text = p.trim(),
                        color = TextPrimary,
                        fontSize = (14 * textSizeMultiplier).sp,
                        lineHeight = (22 * textSizeMultiplier).sp,
                        textAlign = TextAlign.Justify
                    )
                }
            }
        }
    }
}
