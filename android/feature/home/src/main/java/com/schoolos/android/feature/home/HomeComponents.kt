package com.schoolos.android.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

// ─── Data Models ─────────────────────────────────────────────────────────────
data class ScheduleItem(
    val time: String,
    val subject: String,
    val room: String,
    val icon: ImageVector,
    val accentColor: Color,
    val bgTint: Color,
)

data class QuickAction(
    val label: String,
    val icon: ImageVector,
    val accentColor: Color,
    val onClick: () -> Unit = {},
)

// ─── Shared Components ───────────────────────────────────────────────────────

@Composable
fun LightCard(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder, RoundedCornerShape(22.dp))
            .shadow(3.dp, RoundedCornerShape(22.dp), spotColor = Color(0x100F172A)),
    ) { content() }
}

@Composable
fun LightSectionHeader(title: String, sub: String, onSeeAll: () -> Unit = {}) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = TextPrimary)
            if (sub.isNotEmpty())
                Text(sub, fontSize = 11.sp, color = TextTertiary)
        }
        Text(
            "Lihat Semua",
            fontSize = 12.sp,
            color = StudentNeon,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.clickable(onClick = onSeeAll),
        )
    }
}

@Composable
fun LightScheduleRow(item: ScheduleItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Time with vibrant accent dot
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.width(56.dp)) {
            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(item.accentColor))
            Spacer(Modifier.width(6.dp))
            Text(item.time, fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.width(8.dp))

        // Vibrant Icon Container Chip
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(item.bgTint),
            contentAlignment = Alignment.Center,
        ) {
            Icon(item.icon, null, tint = item.accentColor, modifier = Modifier.size(18.dp))
        }

        Spacer(Modifier.width(12.dp))

        Text(
            item.subject,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            modifier = Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )

        Text(
            item.room,
            fontSize = 11.sp,
            color = TextSecondary,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
fun LightMiniStatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    sub: String,
    icon: ImageVector,
    accentColor: Color,
    badgeText: String = "",
    progress: Float? = null,
    onClick: () -> Unit = {},
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(22.dp))
            .background(Color.White)
            .background(
                Brush.verticalGradient(
                    listOf(accentColor.copy(alpha = 0.05f), Color.Transparent),
                    startY = 0f, endY = 200f
                )
            )
            .border(1.dp, GlassBorder, RoundedCornerShape(22.dp))
            .shadow(4.dp, RoundedCornerShape(22.dp), spotColor = Color(0x150F172A))
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = accentColor, modifier = Modifier.size(19.dp))
                }

                if (badgeText.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(accentColor.copy(alpha = 0.12f))
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                    ) {
                        Text(
                            badgeText,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = accentColor,
                        )
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            Text(
                title,
                fontSize = 12.sp,
                color = TextSecondary,
                fontWeight = FontWeight.Bold,
            )
            
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    value,
                    fontWeight = FontWeight.Black,
                    fontSize = 32.sp,
                    color = accentColor,
                    letterSpacing = (-1).sp,
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    sub,
                    fontSize = 10.sp,
                    color = TextTertiary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(bottom = 6.dp)
                )
            }

            if (progress != null) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.1f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress)
                            .height(5.dp)
                            .clip(CircleShape)
                            .background(accentColor)
                    )
                }
            }
        }
    }
}

@Composable
fun LightProgressRow(subject: String, progress: Float, color: Color) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(subject, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("${(progress * 100).toInt()}%", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = color)
        }
        Spacer(Modifier.height(6.dp))
        Box(
            modifier = Modifier.fillMaxWidth().height(7.dp).clip(CircleShape)
                .background(color.copy(alpha = 0.12f))
        ) {
            Box(
                modifier = Modifier.fillMaxWidth(progress).height(7.dp).clip(CircleShape)
                    .background(color)
            )
        }
    }
}

@Composable
fun LightQuickActionBtn(action: QuickAction) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = action.onClick),
    ) {
        Box(
            modifier = Modifier.size(52.dp).clip(RoundedCornerShape(16.dp))
                .background(action.accentColor.copy(alpha = 0.12f))
                .border(1.dp, action.accentColor.copy(alpha = 0.25f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(action.icon, action.label, tint = action.accentColor, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.height(5.dp))
        Text(action.label, fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
    }
}
