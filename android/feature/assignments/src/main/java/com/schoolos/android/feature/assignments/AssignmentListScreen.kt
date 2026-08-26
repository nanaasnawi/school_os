package com.schoolos.android.feature.assignments

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Assignment

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentListScreen(
    onBack: (() -> Unit)? = null,
    onAssignmentClick: (String) -> Unit = {},
    viewModel: AssignmentListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var selectedTab by remember { mutableStateOf("Semua") }
    
    val role = state.userRole.lowercase()
    val isTeacher = role == "teacher" || role == "guru"
    val isParent  = role == "parent" || role == "ortu" || role == "wali"

    Scaffold(containerColor = CosmicBlack) { padding ->
        PullRefreshContainer(
            isRefreshing = state.isRefreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            if (state.isLoading) {
                LoadingState()
            } else if (state.error != null) {
                ErrorState(message = state.error!!, onRetry = viewModel::refresh)
            } else if (state.active.isEmpty() && state.dueSoon.isEmpty() && state.completed.isEmpty()) {
                EmptyState("Belum ada tugas yang diberikan!", androidx.compose.material.icons.Icons.AutoMirrored.Filled.Assignment)
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    // ── IMMERSIVE HERO HEADER ────────────────────────────
                    item {
                        if (isTeacher) {
                            TeacherAssignmentHeroHeader(state.active.size, state.dueSoon.size)
                        } else {
                            StudentAssignmentHeroHeader(state.active.size, state.dueSoon.size, state.completed.size, isParent)
                        }
                    }

                    // ── PREMIUM TAB FILTER CHIPS ─────────────────────────
                    item {
                        val tabs = if (isTeacher) listOf("Semua", "Aktif", "Perlu Dinilai")
                                   else listOf("Semua", "Segera", "Aktif", "Selesai")
                        
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                        ) {
                            items(tabs) { tab ->
                                val isSelected = tab == selectedTab
                                val accent = when (tab) {
                                    "Segera", "Perlu Dinilai" -> NeonError
                                    "Aktif"                  -> StudentNeon
                                    "Selesai"                -> NeonSuccess
                                    else                     -> NeonBlue
                                }
                                
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (isSelected) accent.copy(alpha = 0.1f) else CosmicNavy)
                                        .border(
                                            1.dp,
                                            if (isSelected) accent.copy(alpha = 0.4f) else GlassBorder,
                                            RoundedCornerShape(14.dp),
                                        )
                                        .clickable { selectedTab = tab }
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                ) {
                                    Text(
                                        tab,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                                        color = if (isSelected) accent else TextTertiary,
                                    )
                                }
                            }
                        }
                    }

                    // DELEGATE TO MODULAR CONTENT
                    if (isTeacher) {
                        teacherAssignmentListContent(
                            activeItems = state.active,
                            dueSoonItems = state.dueSoon,
                            selectedTab = selectedTab,
                            onAssignmentClick = onAssignmentClick
                        )
                    } else {
                        studentAssignmentListContent(
                            activeItems = state.active,
                            dueSoonItems = state.dueSoon,
                            completedItems = state.completed,
                            selectedTab = selectedTab,
                            onAssignmentClick = onAssignmentClick
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentAssignmentHeroHeader(activeCount: Int, dueSoonCount: Int, completedCount: Int, isParent: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(StudentNeon, NeonBlue)))
            .padding(20.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "TUGAS & PROYEK",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    if (isParent) "Status Tugas Ahmad" else "Daftar Tugas Kamu",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    lineHeight = 28.sp
                )
            }
            Text("📝", fontSize = 42.sp)
        }
        
        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            HeroStatPill("BELUM", "${activeCount + dueSoonCount}", NeonError, Modifier.weight(1f))
            HeroStatPill("SELESAI", "$completedCount", NeonSuccess, Modifier.weight(1f))
        }
    }
}

@Composable
private fun TeacherAssignmentHeroHeader(activeCount: Int, pendingGradeCount: Int) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(TeacherNeon, NeonBlue)))
            .padding(20.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "MANAJEMEN TUGAS",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Evaluasi Pembelajaran",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    lineHeight = 28.sp
                )
            }
            Text("👨‍🏫", fontSize = 42.sp)
        }

        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            HeroStatPill("AKTIF", "$activeCount", StudentNeon, Modifier.weight(1f))
            HeroStatPill("PERLU NILAI", "$pendingGradeCount", NeonError, Modifier.weight(1f))
        }
    }
}

@Composable
private fun HeroStatPill(label: String, value: String, accent: Color, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White.copy(alpha = 0.15f))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Text(
            label,
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 9.sp,
            fontWeight = FontWeight.Black
        )
        Spacer(Modifier.width(8.dp))
        Text(value, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Black)
    }
}
