package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

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
        (0..5).map { i ->
            val date = startOfWeek.plusDays(i.toLong())
            DayTab(
                dayName = date.format(DateTimeFormatter.ofPattern("EEE")),
                dateNum = date.dayOfMonth.toString(),
                fullDate = date.format(DateTimeFormatter.ofPattern("EEEE, d MMM")),
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
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"

                    // ── REFACTORED IMMERSIVE HERO HEADER ───────────────────
                    item {
                        CompactScheduleHeader(
                            title = if (isTeacher) "Agenda Mengajar" else "Jadwal Pelajaran",
                            totalSessions = state.active.size + state.upcoming.size + state.completed.size,
                            activeCount = state.active.size,
                            completedCount = state.completed.size,
                            onBack = onBack,
                            isTeacher = isTeacher
                        )
                    }

                    // ── MINIMALIST GLASS DATE STRIP ────────────────────────
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            LazyRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                itemsIndexed(days) { idx, day ->
                                    val isSelected = idx == selectedDayIndex
                                    val accent = if (day.isToday) NeonBlue else if (isTeacher) TeacherNeon else StudentNeon
                                    
                                    Column(
                                        modifier = Modifier
                                            .width(52.dp)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(if (isSelected) accent.copy(alpha = 0.08f) else Color.Transparent)
                                            .clickable { 
                                                selectedDayIndex = idx
                                                viewModel.onDateSelected(day.localDate)
                                            }
                                            .padding(vertical = 8.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = day.dayName,
                                            fontSize = 11.sp,
                                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                                            color = if (isSelected) accent else TextTertiary,
                                            letterSpacing = 0.5.sp
                                        )
                                        Spacer(Modifier.height(6.dp))
                                        
                                        Text(
                                            text = day.dateNum,
                                            fontSize = 17.sp,
                                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                                            color = if (isSelected) TextPrimary else TextSecondary,
                                        )
                                        
                                        if (isSelected || day.isToday) {
                                            Spacer(Modifier.height(6.dp))
                                            Box(
                                                modifier = Modifier
                                                    .size(4.dp)
                                                    .clip(CircleShape)
                                                    .background(if (isSelected) accent else TextTertiary.copy(alpha = 0.5f))
                                            )
                                        } else {
                                            Spacer(Modifier.height(10.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // DELEGATE TO MODULAR CONTENT
                    if (isTeacher) {
                        teacherAgendaContent(
                            activeItems = state.active,
                            upcomingItems = state.upcoming,
                            completedItems = state.completed,
                            onSessionClick = onSessionClick
                        )
                    } else {
                        studentAgendaContent(
                            activeItems = state.active,
                            upcomingItems = state.upcoming,
                            completedItems = state.completed,
                            onSessionClick = onSessionClick
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactScheduleHeader(
    title: String,
    totalSessions: Int,
    activeCount: Int,
    completedCount: Int,
    onBack: (() -> Unit)?,
    isTeacher: Boolean
) {
    val accent = if (isTeacher) TeacherNeon else StudentNeon
    val todayStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy"))

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(NeonBlue, accent)))
            .padding(20.dp),
    ) {
        // TOP NAV (Zero Manual Padding - Just Actions)
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onBack != null) {
                CustomBackButton(
                    onClick = onBack,
                    backgroundColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        
        Text(
            todayStr.uppercase(),
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 10.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "$totalSessions $title",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = (-0.5).sp
        )
        Text(
            if (isTeacher) "Wali Kelas 7A • Semester Genap" else "Kelas 7A • Semester Genap",
            color = Color.White.copy(alpha = 0.8f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )

        Spacer(Modifier.height(24.dp))

        // Integrated Executive Summary Strip
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            CompactHeaderMetricPill("TOTAL", "$totalSessions", Modifier.weight(1f))
            CompactHeaderMetricPill("LIVE", "$activeCount", Modifier.weight(1f), isLive = activeCount > 0)
            CompactHeaderMetricPill("DONE", "$completedCount", Modifier.weight(1f))
        }
    }
}

@Composable
private fun CompactHeaderMetricPill(label: String, value: String, modifier: Modifier = Modifier, isLive: Boolean = false) {
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.15f))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Text(
            label,
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 8.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.5.sp
        )
        Spacer(Modifier.width(6.dp))
        Text(value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
        if (isLive) {
            Spacer(Modifier.width(6.dp))
            Box(Modifier.size(4.dp).clip(CircleShape).background(NeonSuccess))
        }
    }
}
