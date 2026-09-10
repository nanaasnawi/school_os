package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.TaskAlt
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.Icon
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private data class DayTab(
    val dayName: String,
    val dateNum: String,
    val fullDate: String,
    val isToday: Boolean,
    val localDate: LocalDate
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(
    onBack: (() -> Unit)? = null,
    onSessionClick: (String) -> Unit = {},
    viewModel: TodayViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    val days = remember {
        val today = LocalDate.now()
        val startOfWeek = today.with(java.time.DayOfWeek.MONDAY)
        val idLocale = Locale("id", "ID")
        (0..5).map { i ->
            val date = startOfWeek.plusDays(i.toLong())
            DayTab(
                dayName = date.format(DateTimeFormatter.ofPattern("EEE", idLocale)).uppercase(),
                dateNum = date.dayOfMonth.toString(),
                fullDate = date.format(DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", idLocale)),
                isToday = date == today,
                localDate = date
            )
        }
    }

    var selectedDayIndex by remember {
        mutableIntStateOf(days.indexOfFirst { it.isToday }.coerceAtLeast(0))
    }

    PullRefreshContainer(
        isRefreshing = state.isRefreshing,
        onRefresh = viewModel::refresh,
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (state.isLoading) {
                LoadingState()
            } else if (state.error != null) {
                ErrorState(message = state.error!!, onRetry = viewModel::refresh)
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        // Edge-to-edge safe: never draw under the status bar
                        .statusBarsPadding(),
                    contentPadding = PaddingValues(
                        start = 16.dp,
                        end = 16.dp,
                        top = 12.dp,
                        bottom = 24.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"
                    val accentColor = if (isTeacher) TeacherNeon else StudentNeon

                    // ── HERO HEADER ──────────────────────────────────────────
                    item {
                        HeroHeader(
                            title = if (isTeacher) "Agenda Mengajar" else "Jadwal Pelajaran",
                            totalSessions = state.active.size + state.upcoming.size + state.completed.size,
                            activeCount = state.active.size,
                            completedCount = state.completed.size,
                            onBack = onBack,
                            accentColor = accentColor,
                            className = state.className,
                            isTeacher = isTeacher,
                        )
                    }

                    // ── DATE NAVIGATION STRIP ────────────────────────────────
                    item {
                        DateNavigationStrip(
                            days = days,
                            selectedIndex = selectedDayIndex,
                            onDayClick = { index ->
                                selectedDayIndex = index
                                viewModel.onDateSelected(days[index].localDate)
                            },
                            onJumpToToday = {
                                val todayIdx = days.indexOfFirst { it.isToday }
                                if (todayIdx >= 0) {
                                    selectedDayIndex = todayIdx
                                    viewModel.onDateSelected(days[todayIdx].localDate)
                                }
                            },
                            accentColor = accentColor,
                        )
                    }

                    // ── QUICK STATS ──────────────────────────────────────────
                    if (state.active.isNotEmpty() || state.upcoming.isNotEmpty() || state.completed.isNotEmpty()) {
                        item {
                            QuickStatsRow(
                                activeCount = state.active.size,
                                upcomingCount = state.upcoming.size,
                                completedCount = state.completed.size,
                                accentColor = accentColor,
                            )
                        }
                    }

                    // ── SESSIONS CONTENT ────────────────────────────────────
                    if (isTeacher) {
                        teacherAgendaContent(
                            activeItems = state.active,
                            upcomingItems = state.upcoming,
                            completedItems = state.completed,
                            onSessionClick = onSessionClick,
                            accentColor = accentColor,
                        )
                    } else {
                        studentAgendaContent(
                            activeItems = state.active,
                            upcomingItems = state.upcoming,
                            completedItems = state.completed,
                            onSessionClick = onSessionClick,
                            accentColor = accentColor,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroHeader(
    title: String,
    totalSessions: Int,
    activeCount: Int,
    completedCount: Int,
    onBack: (() -> Unit)?,
    accentColor: Color,
    className: String = "",
    isTeacher: Boolean,
) {
    val todayStr = try {
        java.time.LocalDate.now().format(
            java.time.format.DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", java.util.Locale("id", "ID"))
        )
    } catch (e: Exception) {
        "Kamis, 3 September 2026"
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(NeonBlue, accentColor)))
    ) {
        // Decorative translucent circles
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 10.dp, end = 6.dp)
                .size(110.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.10f))
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(bottom = 6.dp, start = 18.dp)
                .size(64.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.08f))
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Top Navigation Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                if (onBack != null) {
                    CustomBackButton(
                        onClick = onBack,
                        backgroundColor = Color.White.copy(alpha = 0.2f),
                        contentColor = Color.White
                    )
                }
                if (activeCount > 0) {
                    LiveBadge()
                }
            }

            Spacer(Modifier.height(14.dp))

            // Date
            Text(
                todayStr.uppercase(),
                color = Color.White.copy(alpha = 0.75f),
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
            Spacer(Modifier.height(4.dp))

        // Title with count
        Text(
            "$totalSessions $title",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = (-0.5).sp
        )
        Spacer(Modifier.height(2.dp))

        // Subtitle
        Text(
            text = when {
                isTeacher && className.isNotBlank() -> "Wali Kelas $className"
                isTeacher -> "Guru Pengampu"
                className.isNotBlank() -> "Kelas $className"
                else -> "Kelas Reguler"
            },
            color = Color.White.copy(alpha = 0.85f),
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )

        Spacer(Modifier.height(20.dp))

        // Stats Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HeroStatPill(label = "TOTAL", value = "$totalSessions", modifier = Modifier.weight(1f))
            HeroStatPill(label = "AKTIF", value = "$activeCount", modifier = Modifier.weight(1f), isLive = activeCount > 0, accentColor = accentColor)
            HeroStatPill(label = "SELESAI", value = "$completedCount", modifier = Modifier.weight(1f))
        }
        }
    }
}

@Composable
private fun LiveBadge() {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.22f))
            .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Box(
            Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(Color.White)
        )
        Spacer(Modifier.width(6.dp))
        Text(
            "LIVE",
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
        )
    }
}

@Composable
private fun HeroStatPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    isLive: Boolean = false,
    accentColor: Color = NeonBlue,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White.copy(alpha = 0.15f))
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    label,
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp
                )
                if (isLive) {
                    Spacer(Modifier.width(4.dp))
                    Box(Modifier.size(5.dp).clip(CircleShape).background(NeonSuccess))
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(value, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun DateNavigationStrip(
    days: List<DayTab>,
    selectedIndex: Int,
    onDayClick: (Int) -> Unit,
    onJumpToToday: () -> Unit = {},
    accentColor: Color,
) {
    val selectedDay = days.getOrNull(selectedIndex) ?: days.firstOrNull()
    val isViewingToday = selectedDay?.isToday == true
    val monthYearText = remember(selectedDay) {
        val date = selectedDay?.localDate ?: LocalDate.now()
        date.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale("id", "ID")))
            .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("id", "ID")) else it.toString() }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // ── TOP HEADER: Month & Year + Jump-To-Today Action ────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = monthYearText,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )
            }

            if (!isViewingToday) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(accentColor.copy(alpha = 0.12f))
                        .border(1.dp, accentColor.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
                        .clickable(onClick = onJumpToToday)
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Today,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = "Hari Ini",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = accentColor
                        )
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(NeonSuccess.copy(alpha = 0.12f))
                        .border(1.dp, NeonSuccess.copy(alpha = 0.30f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(NeonSuccess)
                        )
                        Spacer(Modifier.width(5.dp))
                        Text(
                            text = "Hari Ini Aktif",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonSuccess
                        )
                    }
                }
            }
        }

        // ── DATE CAPSULES ROW ─────────────────────────────────────────────
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            itemsIndexed(days) { idx, day ->
                val isSelected = idx == selectedIndex
                val isToday = day.isToday
                val dayAccent = if (isToday) NeonBlue else accentColor

                Column(
                    modifier = Modifier
                        .width(58.dp)
                        .then(
                            if (isSelected) Modifier.shadow(4.dp, RoundedCornerShape(18.dp), spotColor = dayAccent.copy(alpha = 0.5f))
                            else Modifier
                        )
                        .clip(RoundedCornerShape(18.dp))
                        .background(
                            when {
                                isSelected -> Brush.verticalGradient(
                                    listOf(dayAccent, dayAccent.copy(alpha = 0.82f))
                                )
                                isToday -> Brush.verticalGradient(
                                    listOf(dayAccent.copy(alpha = 0.14f), dayAccent.copy(alpha = 0.06f))
                                )
                                else -> Brush.verticalGradient(
                                    listOf(CosmicNavy, CosmicNavy)
                                )
                            }
                        )
                        .border(
                            width = 1.dp,
                            brush = when {
                                isSelected -> Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.45f), Color.Transparent))
                                isToday -> Brush.verticalGradient(listOf(dayAccent.copy(alpha = 0.5f), dayAccent.copy(alpha = 0.2f)))
                                else -> Brush.verticalGradient(listOf(GlassBorder, GlassBorder))
                            },
                            shape = RoundedCornerShape(18.dp)
                        )
                        .clickable { onDayClick(idx) }
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Day Abbreviation (e.g. SEN, SEL)
                    Text(
                        text = day.dayName,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                        color = when {
                            isSelected -> Color.White
                            isToday -> dayAccent
                            else -> TextTertiary
                        },
                        letterSpacing = 0.5.sp
                    )

                    Spacer(Modifier.height(6.dp))

                    // Day Number (e.g. 10)
                    Text(
                        text = day.dateNum,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = when {
                            isSelected -> Color.White
                            isToday -> dayAccent
                            else -> TextPrimary
                        },
                    )

                    Spacer(Modifier.height(6.dp))

                    // Bottom indicator pill / dot
                    if (isSelected) {
                        Box(
                            modifier = Modifier
                                .width(12.dp)
                                .height(3.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                        )
                    } else if (isToday) {
                        Box(
                            modifier = Modifier
                                .size(5.dp)
                                .clip(CircleShape)
                                .background(dayAccent)
                        )
                    } else {
                        Spacer(Modifier.height(3.dp))
                    }
                }
            }
        }

        // ── SELECTED DAY AMBIENT INFO BANNER ──────────────────────────────
        selectedDay?.let { day ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 9.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Today,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = day.fullDate,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Text(
                        text = if (day.isToday) "Hari Ini" else "Agenda Terjadwal",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (day.isToday) NeonSuccess else TextTertiary
                    )
                }
            }
        }
    }
}

@Composable
private fun QuickStatsRow(
    activeCount: Int,
    upcomingCount: Int,
    completedCount: Int,
    accentColor: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        QuickStatCard(
            label = "Sedang Berjalan",
            count = activeCount,
            icon = Icons.Default.Schedule,
            color = NeonSuccess,
            isActive = activeCount > 0,
            modifier = Modifier.weight(1f),
        )
        QuickStatCard(
            label = "Akan Datang",
            count = upcomingCount,
            icon = Icons.Default.EventAvailable,
            color = accentColor,
            modifier = Modifier.weight(1f),
        )
        QuickStatCard(
            label = "Selesai",
            count = completedCount,
            icon = Icons.Default.TaskAlt,
            color = TextTertiary,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun QuickStatCard(
    label: String,
    count: Int,
    icon: ImageVector,
    color: Color,
    isActive: Boolean = false,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(
                1.dp,
                if (isActive) color.copy(alpha = 0.35f) else GlassBorder,
                RoundedCornerShape(16.dp)
            )
            .padding(horizontal = 12.dp, vertical = 12.dp),
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                androidx.compose.material3.Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(16.dp),
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "$count",
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = if (isActive) color else TextPrimary,
                lineHeight = 22.sp,
            )
            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                color = TextTertiary,
            )
        }
    }
}