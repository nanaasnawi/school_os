package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
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
fun SessionDetailScreen(
    onBack: () -> Unit = {},
    onOpenAssignments: (String) -> Unit = {},
    onOpenQuizzes: (String) -> Unit = {},
    onOpenMaterials: (String) -> Unit = {},
    viewModel: SessionDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(containerColor = CosmicBlack) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    ErrorState(message = state.error!!, onRetry = viewModel::load)
                }
                state.session != null -> {
                    val s = state.session!!
                    val subject = s.notes ?: "Pelajaran"
                    val gradient = subjectGradient(subject)
                    val icon = subjectIcon(subject)
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                    ) {
                        // ── REFACTORED NON-OVERLAPPING HERO HEADER ─────────────
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .background(Brush.linearGradient(gradient))
                                .padding(horizontal = 20.dp, vertical = 16.dp),
                        ) {
                            Column(modifier = Modifier.fillMaxSize()) {
                                // TOP NAVIGATION ROW
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CustomBackButton(
                                        onClick = onBack,
                                        backgroundColor = Color.White.copy(alpha = 0.2f),
                                        contentColor = Color.White
                                    )
                                    StatusChip(label = s.status)
                                }

                                Spacer(Modifier.weight(1f))

                                // CONTENT ROW
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(Color.White.copy(alpha = 0.2f))
                                            .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(14.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, null, tint = Color.White, modifier = Modifier.size(28.dp))
                                    }
                                    Spacer(Modifier.width(16.dp))
                                    Column {
                                        Text(
                                            subject.substringBefore(" (Ruang").trim(),
                                            fontSize = 22.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            lineHeight = 28.sp
                                        )
                                        Spacer(Modifier.height(4.dp))
                                        Text(
                                            "Ruang 7A • Gedung B",
                                            fontSize = 12.sp,
                                            color = Color.White.copy(alpha = 0.8f),
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                                Spacer(Modifier.height(12.dp))
                            }
                        }

                        // ── DELEGATE TO MODULAR CONTENT ────────────────────────
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .offset(y = (-16).dp),
                        ) {
                            if (isTeacher) {
                                TeacherSessionDetailContent(
                                    session = s,
                                    onOpenAssignments = onOpenAssignments,
                                    onOpenQuizzes = onOpenQuizzes,
                                    onOpenMaterials = onOpenMaterials
                                )
                            } else {
                                StudentSessionDetailContent(
                                    session = s,
                                    attendance = state.attendance,
                                    onOpenAssignments = onOpenAssignments,
                                    onOpenQuizzes = onOpenQuizzes,
                                    onOpenMaterials = onOpenMaterials
                                )
                            }
                            
                            Spacer(Modifier.height(60.dp))
                        }
                    }
                }
            }
        }
    }
}
