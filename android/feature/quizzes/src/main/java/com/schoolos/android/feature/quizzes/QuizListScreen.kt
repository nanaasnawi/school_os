package com.schoolos.android.feature.quizzes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizListScreen(
    onBack: () -> Unit = {},
    onQuizClick: (String) -> Unit = {},
    viewModel: QuizListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val role = state.userRole.lowercase()
    val isTeacher = role == "teacher" || role == "guru"

    val activeQuizzes = state.quizzes.filter { it.status.lowercase() in listOf("active", "open", "published") }
    val doneQuizzes   = state.quizzes.filter { it.status.lowercase() in listOf("graded", "submitted", "completed") }

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
            } else if (state.quizzes.isEmpty()) {
                EmptyState("Belum ada kuis tersedia.", androidx.compose.material.icons.Icons.Default.List)
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    // ── REFACTORED NON-OVERLAPPING LIST HEADER ─────────────
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 0.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CustomBackButton(onClick = onBack)
                            }
                        }
                    }

                    // COMPACT BANNER
                    item {
                        if (isTeacher) {
                            CompactTeacherQuizBanner(activeCount = activeQuizzes.size)
                        } else {
                            CompactQuizBannerCard(pendingCount = activeQuizzes.size)
                        }
                    }

                    // DELEGATE TO MODULAR CONTENT
                    if (isTeacher) {
                        teacherQuizListContent(
                            activeQuizzes = activeQuizzes,
                            doneQuizzes = doneQuizzes,
                            onQuizClick = onQuizClick
                        )
                    } else {
                        studentQuizListContent(
                            activeQuizzes = activeQuizzes,
                            doneQuizzes = doneQuizzes,
                            onQuizClick = onQuizClick
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactQuizBannerCard(pendingCount: Int) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(StudentNeon, NeonBlue)))
            .padding(18.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (pendingCount > 0) "$pendingCount Kuis Menunggu" else "Semua Kuis Selesai! 🎉",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Ayo kerjakan kuis hari ini!",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.8f),
                    fontWeight = FontWeight.Medium
                )
            }
            Text("🎮", fontSize = 34.sp)
        }
    }
}

@Composable
private fun CompactTeacherQuizBanner(activeCount: Int) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(TeacherNeon, NeonBlue)))
            .padding(18.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Ringkasan Kuis Kelas",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "$activeCount Kuis Managed",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha = 0.2f)).padding(horizontal = 10.dp, vertical = 4.dp)) {
                        Text("✓ 24/28 Selesai", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Text("📊", fontSize = 36.sp)
        }
    }
}
