package com.schoolos.android.core.designsystem

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Mosque
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.SportsBasketball
import androidx.compose.material.icons.filled.Subject
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

// ─── Brand Logo — Dynamic School Logo & Vector Crest Support ───────────────
@Composable
fun SchoolOsBrandLogo(
    modifier: Modifier = Modifier,
    size: Int = 40,
    logoUrl: String? = null,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "logoGlow")
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(1800, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "glow",
    )

    Box(
        modifier = modifier.size(size.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size((size * 1.25).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            NeonBlue.copy(alpha = 0.2f * glowPulse),
                            StudentNeon.copy(alpha = 0.1f * glowPulse),
                            Color.Transparent,
                        )
                    )
                )
        )
        Box(
            modifier = Modifier
                .size(size.dp)
                .clip(RoundedCornerShape((size * 0.28).dp))
                .background(
                    Brush.linearGradient(
                        colors = listOf(NeonBlue, StudentNeon)
                    )
                )
                .shadow(4.dp, RoundedCornerShape((size * 0.28).dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.School,
                contentDescription = "School OS Logo",
                tint = Color.White,
                modifier = Modifier.size((size * 0.58).dp),
            )
        }
    }
}

// ─── Glass Card (Adaptive Surface Card) ───────────────────────────────────
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    containerColor: Color = CosmicNavy,
    borderColor: Color = GlassBorder,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .shadow(2.dp, RoundedCornerShape(cornerRadius), spotColor = GlassOverlay)
            .clip(RoundedCornerShape(cornerRadius))
            .background(containerColor)
            .border(1.dp, borderColor, RoundedCornerShape(cornerRadius))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        content()
    }
}

// ─── Neon Card (Soft Light Gradient Fill + Vibrant Border) ──────────────────
@Composable
fun NeonCard(
    gradientColors: List<Color>,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        gradientColors.first().copy(alpha = 0.08f),
                        gradientColors.last().copy(alpha = 0.03f),
                    )
                )
            )
            .border(
                1.dp,
                Brush.linearGradient(gradientColors.map { it.copy(alpha = 0.5f) }),
                RoundedCornerShape(cornerRadius),
            )
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        content()
    }
}

// ─── Gradient Card ────────────────────────────────────────────────────────────
@Composable
fun GradientCard(
    gradientColors: List<Color>,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(Brush.linearGradient(gradientColors))
            .shadow(4.dp, RoundedCornerShape(cornerRadius), spotColor = gradientColors.first().copy(alpha = 0.3f))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        content()
    }
}

// ─── Donut Chart — Bright Light Version ──────────────────────────────────────
@Composable
fun DonutChart(
    percentage: Float = 0.90f,
    modifier: Modifier = Modifier,
    strokeWidth: Float = 24f,
    activeColor: Color = NeonSuccess,
    backgroundColor: Color = NeonSuccess.copy(alpha = 0.12f),
    labelText: String = "Hadir",
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasSize = size.minDimension
            val radius = (canvasSize - strokeWidth) / 2
            val cx = size.width / 2
            val cy = size.height / 2
            drawArc(
                color = backgroundColor,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(cx - radius, cy - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
            )
            drawArc(
                color = activeColor,
                startAngle = -90f,
                sweepAngle = 360f * percentage.coerceIn(0f, 1f),
                useCenter = false,
                topLeft = Offset(cx - radius, cy - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${(percentage * 100).toInt()}%",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 18.sp,
                color = activeColor,
            )
            Text(
                text = labelText,
                fontSize = 10.sp,
                color = TextSecondary,
            )
        }
    }
}

// ─── Multi-Segment Donut Chart ────────────────────────────────────────────────
data class DonutSegment(val value: Float, val color: Color, val label: String)

@Composable
fun MultiDonutChart(
    segments: List<DonutSegment>,
    modifier: Modifier = Modifier,
    strokeWidth: Float = 20f,
    centerText: String = "",
    centerSubText: String = "",
) {
    val total = segments.sumOf { it.value.toDouble() }.toFloat().coerceAtLeast(1f)
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasSize = size.minDimension
            val radius = (canvasSize - strokeWidth) / 2
            val cx = size.width / 2; val cy = size.height / 2
            var startAngle = -90f
            segments.forEach { seg ->
                val sweep = (seg.value / total) * 360f
                drawArc(
                    color = seg.color,
                    startAngle = startAngle,
                    sweepAngle = sweep,
                    useCenter = false,
                    topLeft = Offset(cx - radius, cy - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                )
                startAngle += sweep
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (centerText.isNotEmpty()) {
                Text(
                    text = centerText,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = TextPrimary,
                    textAlign = TextAlign.Center,
                )
            }
            if (centerSubText.isNotEmpty()) {
                Text(
                    text = centerSubText,
                    fontSize = 10.sp,
                    color = TextSecondary,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

// ─── Line Trend Chart ─────────────────────────────────────────────────────────
@Composable
fun LineTrendChart(
    dataPoints: List<Float> = listOf(72f, 78f, 85f, 86f, 88.6f),
    lineColor: Color = NeonBlue,
    fillColor: Color = lineColor.copy(alpha = 0.12f),
    modifier: Modifier = Modifier,
    minValue: Float = 60f,
    maxValue: Float = 100f,
) {
    Canvas(modifier = modifier) {
        if (dataPoints.size < 2) return@Canvas
        val w = size.width; val h = size.height
        val range = (maxValue - minValue).coerceAtLeast(1f)
        val pts = dataPoints.mapIndexed { i, v ->
            Offset(
                x = i * (w / (dataPoints.size - 1)),
                y = h - ((v - minValue) / range * h),
            )
        }
        val fillPath = Path().apply {
            moveTo(pts.first().x, h)
            pts.forEach { lineTo(it.x, it.y) }
            lineTo(pts.last().x, h)
            close()
        }
        drawPath(fillPath, Brush.verticalGradient(listOf(fillColor, Color.Transparent)))
        val linePath = Path().apply {
            moveTo(pts.first().x, pts.first().y)
            pts.drop(1).forEach { lineTo(it.x, it.y) }
        }
        drawPath(linePath, lineColor, style = Stroke(4f, cap = StrokeCap.Round))
        pts.forEach { p ->
            drawCircle(lineColor.copy(alpha = 0.25f), 8f, p)
            drawCircle(lineColor, 5f, p)
            drawCircle(Color.White, 2.5f, p)
        }
    }
}

// ─── Metric Ring (Arc Progress Animation Retained) ───────────────────────────
@Composable
fun MetricRing(
    progress: Float, // 0f..1f
    label: String,
    value: String,
    color: Color = NeonBlue,
    size: Dp = 90.dp,
    strokeWidth: Float = 10f,
) {
    var animTarget by remember { mutableFloatStateOf(0f) }
    val animatedProgress by animateFloatAsState(
        targetValue = animTarget,
        animationSpec = tween(1400, easing = FastOutSlowInEasing),
        label = "metricRing",
    )
    LaunchedEffect(progress) { animTarget = progress }

    Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val r = (this.size.minDimension - strokeWidth) / 2
            val cx = this.size.width / 2
            val cy = this.size.height / 2
            drawArc(
                color = color.copy(alpha = 0.12f),
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(cx - r, cy - r),
                size = Size(r * 2, r * 2),
                style = Stroke(strokeWidth, cap = StrokeCap.Round),
            )
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = 360f * animatedProgress,
                useCenter = false,
                topLeft = Offset(cx - r, cy - r),
                size = Size(r * 2, r * 2),
                style = Stroke(strokeWidth, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = color)
            Text(label, fontSize = 8.sp, color = TextSecondary, textAlign = TextAlign.Center)
        }
    }
}

// ─── Pulse Animation ─────────────────────────────────────────────────────────
@Composable
fun PulseAnimation(
    pulseFraction: Float = 0.08f,
    content: @Composable () -> Unit,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1f + pulseFraction,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulseScale",
    )
    Box(modifier = Modifier.scale(scale)) { content() }
}

// ─── Animated Score Circle (Animation Retained) ──────────────────────────────
@Composable
fun AnimatedScoreCircle(
    score: Int,
    maxScore: Int,
    size: Dp = 120.dp,
    color: Color = NeonBlue,
) {
    var animTarget by remember { mutableFloatStateOf(0f) }
    val animatedProgress by animateFloatAsState(
        targetValue = animTarget,
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label = "scoreAnim",
    )
    LaunchedEffect(score) { animTarget = score.toFloat() / maxScore.coerceAtLeast(1) }

    Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 14f
            val radius = (size.toPx() - stroke) / 2
            val cx = this.size.width / 2; val cy = this.size.height / 2
            drawArc(
                color = color.copy(alpha = 0.12f), -90f, 360f, false,
                topLeft = Offset(cx - radius, cy - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(stroke, cap = StrokeCap.Round),
            )
            drawArc(
                color = color, -90f, 360f * animatedProgress, false,
                topLeft = Offset(cx - radius, cy - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(stroke, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "${(animatedProgress * maxScore).toInt()}",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 26.sp,
                color = color,
            )
            Text(
                "/ $maxScore",
                fontSize = 11.sp,
                color = TextSecondary,
            )
        }
    }
}

// ─── Circular Timer ──────────────────────────────────────────────────────────
@Composable
fun CircularTimer(
    progress: Float,
    timeLabel: String,
    modifier: Modifier = Modifier,
    activeColor: Color = NeonError,
    trackColor: Color = NeonError.copy(alpha = 0.12f),
    strokeWidth: Float = 10f,
) {
    val isUrgent = progress < 0.3f
    if (isUrgent) {
        PulseAnimation(0.05f) {
            CircularTimerInner(progress, timeLabel, modifier, activeColor, trackColor, strokeWidth)
        }
    } else {
        CircularTimerInner(progress, timeLabel, modifier, activeColor, trackColor, strokeWidth)
    }
}

@Composable
private fun CircularTimerInner(
    progress: Float, timeLabel: String, modifier: Modifier,
    activeColor: Color, trackColor: Color, strokeWidth: Float,
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val s = size.minDimension; val r = (s - strokeWidth) / 2
            val cx = this.size.width / 2; val cy = this.size.height / 2
            drawArc(trackColor, -90f, 360f, false,
                Offset(cx - r, cy - r), Size(r * 2, r * 2), style = Stroke(strokeWidth, cap = StrokeCap.Round))
            drawArc(activeColor, -90f, 360f * progress, false,
                Offset(cx - r, cy - r), Size(r * 2, r * 2), style = Stroke(strokeWidth, cap = StrokeCap.Round))
        }
        Text(timeLabel, fontWeight = FontWeight.Bold, fontSize = 12.sp,
            color = if (progress < 0.3f) activeColor else TextPrimary)
    }
}

// ─── REDESIGNED DATE WIDGETS (Bright Light Educational Style) ───────────────

/**
 * EducationalDateBadge — Redesigned date badge with calendar icon chip, clean date typography,
 * and soft background tint.
 */
@Composable
fun EducationalDateBadge(
    dateIso: String?,
    modifier: Modifier = Modifier,
    showTime: Boolean = true,
    accentColor: Color = NeonBlue,
) {
    val dateText = dateIso?.let { formatEducationalDate(it, showTime) } ?: "Tanpa Tenggat"

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(accentColor.copy(alpha = 0.08f))
            .border(1.dp, accentColor.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(13.dp),
                )
            }
            Spacer(Modifier.width(8.dp))
            Text(
                text = dateText,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
            )
        }
    }
}

/**
 * HeaderDateWidget — Header date badge widget for top page sections (e.g. "Rabu, 7 Agustus 2026")
 */
@Composable
fun HeaderDateWidget(
    dateText: String,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .shadow(1.dp, RoundedCornerShape(20.dp))
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(NeonBlueBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = NeonBlue,
                    modifier = Modifier.size(14.dp),
                )
            }
            Spacer(Modifier.width(8.dp))
            Text(
                text = dateText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
            )
        }
    }
}

/**
 * CustomBackButton — A minimalist circular back button
 */
@Composable
fun CustomBackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    backgroundColor: Color = CosmicNavy,
    contentColor: Color = TextPrimary,
) {
    Box(
        modifier = modifier
            .shadow(2.dp, CircleShape, spotColor = GlassOverlay)
            .size(38.dp)
            .clip(CircleShape)
            .background(backgroundColor)
            .border(1.dp, GlassBorder, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
            contentDescription = "Kembali",
            tint = contentColor,
            modifier = Modifier.size(18.dp)
        )
    }
}

private fun formatEducationalDate(iso: String, showTime: Boolean): String {
    return try {
        val instant = Instant.parse(iso)
        val pattern = if (showTime) "EEE, dd MMM yyyy • HH:mm" else "EEE, dd MMM yyyy"
        val formatter = DateTimeFormatter.ofPattern(pattern).withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        iso
    }
}

// ─── Empty State — Clean Light Version ──────────────────────────────────────
@Composable
fun EmptyState(
    message: String,
    icon: ImageVector = Icons.Default.Inbox,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(NeonBlueBg)
                .border(1.dp, NeonBlue.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = NeonBlue,
            )
        }
        Spacer(Modifier.height(16.dp))
        Text(
            text = message,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )
    }
}

// ─── Loading State — RETAINED ANIMATION & WIDGET ────────────────────────────
@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                color = NeonBlue,
                trackColor = NeonBlueBg,
                strokeWidth = 3.dp,
                modifier = Modifier.size(42.dp),
            )
            Spacer(Modifier.height(12.dp))
            Text("Memuat data...", fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        }
    }
}

// ─── Error State ─────────────────────────────────────────────────────────────
@Composable
fun ErrorState(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(ErrorBg)
                .border(1.dp, NeonError.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Warning, contentDescription = null,
                modifier = Modifier.size(36.dp), tint = NeonError)
        }
        Spacer(Modifier.height(16.dp))
        Text(message, fontSize = 14.sp, color = NeonError, textAlign = TextAlign.Center, fontWeight = FontWeight.Medium)
    }
}

// ─── Pull Refresh ─────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PullRefreshContainer(
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    PullToRefreshBox(isRefreshing = isRefreshing, onRefresh = onRefresh, modifier = modifier) {
        content()
    }
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
@Composable
fun StatusChip(label: String, modifier: Modifier = Modifier) {
    val (bg, fg) = when (label.lowercase()) {
        "active", "berjalan", "open", "published" -> Pair(SuccessBg, NeonSuccess)
        "submitted", "completed", "selesai"       -> Pair(InfoBg, NeonBlue)
        "graded", "dinilai"                       -> Pair(StudentContainer, StudentNeon)
        "due_soon", "segera"                       -> Pair(WarningBg, NeonWarning)
        "draft", "closed", "nonaktif", "inactive" -> Pair(GlassBorder, TextTertiary)
        else -> Pair(GlassBorder, TextSecondary)
    }
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .border(1.dp, fg.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(
            label.replace("_", " ").replaceFirstChar { it.uppercase() },
            fontSize = 10.sp,
            color = fg,
            fontWeight = FontWeight.Bold,
        )
    }
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
@Composable
fun ScoreBadge(score: Int?, maxScore: Int, modifier: Modifier = Modifier) {
    if (score != null) {
        val color = when {
            score >= maxScore * 0.8 -> NeonSuccess
            score >= maxScore * 0.6 -> NeonBlue
            else -> NeonError
        }
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(8.dp))
                .background(color.copy(alpha = 0.1f))
                .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 4.dp),
        ) {
            Text("$score / $maxScore", color = color, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    } else {
        Text("— / $maxScore", color = TextTertiary, fontSize = 12.sp, modifier = modifier)
    }
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
@Composable
fun RoleBadge(role: String, modifier: Modifier = Modifier) {
    val (bg, fg) = when (role.lowercase()) {
        "student", "siswa"                          -> Pair(StudentContainer, StudentNeon)
        "teacher", "guru"                           -> Pair(TeacherContainer, TeacherNeon)
        "parent", "guardian", "ortu", "wali"       -> Pair(ParentContainer, ParentNeon)
        "admin"                                     -> Pair(InfoBg, NeonBlue)
        else                                        -> Pair(GlassBorder, TextTertiary)
    }
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .border(1.dp, fg.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp),
    ) {
        Text(
            role.replaceFirstChar { it.uppercase() },
            color = fg,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

// ─── Info Card ────────────────────────────────────────────────────────────────
@Composable
fun InfoCard(title: String, value: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
            .shadow(1.dp, RoundedCornerShape(16.dp))
            .padding(16.dp),
    ) {
        Column {
            Text(title, fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(4.dp))
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }
    }
}

// ─── Subject Icon / Gradient ─────────────────────────────────────────────────
@Composable
fun subjectIcon(subject: String): ImageVector = when {
    subject.contains("Matematika", ignoreCase = true)       -> Icons.Default.Calculate
    subject.contains("IPA", ignoreCase = true) ||
    subject.contains("Sains", ignoreCase = true)            -> Icons.Default.Science
    subject.contains("IPS", ignoreCase = true)              -> Icons.Default.Public
    subject.contains("Bahasa Indonesia", ignoreCase = true) -> Icons.Default.MenuBook
    subject.contains("Bahasa Inggris", ignoreCase = true)   -> Icons.Default.Translate
    subject.contains("PKn", ignoreCase = true)              -> Icons.Default.AccountBalance
    subject.contains("Agama", ignoreCase = true)            -> Icons.Default.Mosque
    subject.contains("Seni", ignoreCase = true)             -> Icons.Default.Palette
    subject.contains("Penjaskes", ignoreCase = true)        -> Icons.Default.SportsBasketball
    subject.contains("Komputer", ignoreCase = true)         -> Icons.Default.Computer
    else                                                    -> Icons.Default.Subject
}

@Composable
fun subjectGradient(subject: String): List<Color> = when {
    subject.contains("Matematika", ignoreCase = true)       -> listOf(StudentNeon, NeonBlue)
    subject.contains("IPA", ignoreCase = true)              -> listOf(NeonBlue, TeacherNeon)
    subject.contains("IPS", ignoreCase = true)              -> listOf(NeonWarning, AccentNeonAmber)
    subject.contains("Bahasa Indonesia", ignoreCase = true) -> listOf(TeacherNeon, NeonBlue)
    subject.contains("Bahasa Inggris", ignoreCase = true)   -> listOf(NeonWarning, ParentNeon)
    else                                                    -> listOf(NeonBlue, StudentNeon)
}
