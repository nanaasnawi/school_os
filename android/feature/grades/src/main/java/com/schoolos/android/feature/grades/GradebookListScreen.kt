package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
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
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.SubjectGradeSummary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradebookListScreen(
    onBack: (() -> Unit)? = null,
    onSubjectClick: (String, String) -> Unit = { _, _ -> },
    viewModel: GradebookListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var selectedFilter by remember { mutableStateOf("Semua Mapel") }

    Scaffold(containerColor = CosmicBlack) { padding ->
        PullRefreshContainer(
            isRefreshing = state.isRefreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            if (state.isLoading) {
                LoadingState()
            } else if (state.error != null) {
                ErrorState(message = state.error!!)
            } else if (state.subjects.isEmpty()) {
                EmptyState("Belum ada nilai tercatat.", Icons.Default.EmojiEvents)
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 46.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    val isTeacher = com.schoolos.android.core.auth.isTeacherRole(state.userRole)

                    // ── PERFORMANCE HERO HEADER ─────────────────────────
                    item { 
                        if (isTeacher) {
                            TeacherGradeHeroHeader(state.classes)
                        } else {
                            StudentGradeHeroHeader(state.subjects) 
                        }
                    }

                    // ── PREMIUM FILTER CHIPS ─────────────────────────────
                    item {
                        val filters = if (isTeacher) listOf("Semua Kelas") + state.classes.map { it.name }
                                      else listOf("Semua Mapel", "Wajib", "Muatan Lokal")
                        
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                        ) {
                            items(filters) { filter ->
                                val isSelected = filter == selectedFilter
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (isSelected) NeonBlue.copy(alpha = 0.1f) else CosmicNavy)
                                        .border(
                                            1.dp,
                                            if (isSelected) NeonBlue.copy(alpha = 0.4f) else GlassBorder,
                                            RoundedCornerShape(14.dp),
                                        )
                                        .clickable { selectedFilter = filter }
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                ) {
                                    Text(
                                        filter,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                                        color = if (isSelected) NeonBlue else TextTertiary,
                                    )
                                }
                            }
                        }
                    }

                    // DELEGATE TO MODULAR CONTENT
                    if (isTeacher) {
                        teacherGradebookContent(
                            classes = state.classes,
                            selectedFilter = selectedFilter,
                            onSubjectClick = onSubjectClick
                        )
                    } else {
                        studentGradebookContent(subjects = state.subjects, onSubjectClick = onSubjectClick)
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentGradeHeroHeader(subjects: List<SubjectGradeSummary>) {
    val gradedSubjects = subjects.filter { it.gradedComponentCount > 0 && it.finalScore > 0 }
    val avgScore = if (gradedSubjects.isEmpty()) 0.0 else gradedSubjects.map { it.finalScore }.average()
    val totalGraded = subjects.sumOf { it.gradedComponentCount }
    val totalComponents = subjects.sumOf { it.componentCount }

    val (predicate, predicateDesc) = when {
        avgScore >= 85.0 -> Pair("Predikat A", "Sangat Baik")
        avgScore >= 75.0 -> Pair("Predikat B", "Baik")
        avgScore >= 65.0 -> Pair("Predikat C", "Cukup")
        avgScore >= 55.0 -> Pair("Predikat D", "Kurang")
        avgScore > 0.0 -> Pair("Predikat E", "Perlu Bimbingan")
        else -> Pair("-", "Belum Ada Nilai")
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(NeonBlue, StudentNeon)))
            .padding(20.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "PERFORMA AKADEMIK",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Semester Aktif",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                )
            }
            Text("🏆", fontSize = 42.sp)
        }

        Spacer(Modifier.height(24.dp))
        
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                if (gradedSubjects.isNotEmpty()) "%.1f".format(avgScore) else "-",
                color = Color.White,
                fontSize = 48.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-2).sp,
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.padding(bottom = 6.dp)) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.White.copy(alpha = 0.2f))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                ) {
                    Text(predicate, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(4.dp))
                Text(predicateDesc, color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(24.dp))

        // Executive Summary Strip
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            GradeMetricPill("${subjects.size} Mapel", Modifier.weight(1f))
            GradeMetricPill("$totalGraded / $totalComponents Done", Modifier.weight(1.5f))
        }
    }
}

@Composable
private fun TeacherGradeHeroHeader(classes: List<AcademicClass>) {
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
                    "LAPORAN KELAS",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Buku Nilai Guru",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                )
            }
            Text("📊", fontSize = 42.sp)
        }

        Spacer(Modifier.height(24.dp))
        
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                "${classes.size}",
                color = Color.White,
                fontSize = 48.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-2).sp,
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.padding(bottom = 6.dp)) {
                Text("Total Kelas Terdaftar", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text("Buku Nilai Siap Kelola", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
            }
        }

        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            GradeMetricPill("${classes.size} Rombel", Modifier.weight(1f))
            GradeMetricPill("Sinkron Dapodik", Modifier.weight(1f))
        }
    }
}

@Composable
private fun GradeMetricPill(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.15f))
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
    }
}
