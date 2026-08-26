package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.LearningSession
import java.time.Duration
import java.time.Instant

@Composable
fun DetailMetricItem(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = TextTertiary, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(6.dp))
        Column {
            Text(label, fontSize = 9.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
            Text(value, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
        }
    }
}

@Composable
fun ResourceItem(
    label: String, 
    icon: ImageVector, 
    color: Color, 
    modifier: Modifier = Modifier, 
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.08f))
            .border(1.dp, color.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(22.dp)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
        }
    }
}

fun LearningSession.durationText(): String? {
    val start = startedAt?.let { tryParse(it) } ?: return null
    val end = endedAt?.let { tryParse(it) } ?: return null
    val minutes = Duration.between(start, end).toMinutes()
    return when {
        minutes < 60 -> "${minutes}m"
        minutes % 60 == 0L -> "${minutes / 60}h"
        else -> "${minutes / 60}h ${minutes % 60}m"
    }
}

private fun tryParse(iso: String): Instant? = try { Instant.parse(iso) } catch (_: Exception) { null }
