package com.schoolos.android.feature.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningSession

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
                    val rawSubject = s.subjectName ?: s.notes ?: "Pelajaran"
                    val subject = rawSubject.substringBefore(" • ").substringBefore(" (Ruang").trim()
                    val gradient = subjectGradient(subject)
                    val icon = subjectIcon(subject)
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"
                    val accentColor = if (isTeacher) TeacherNeon else StudentNeon

                    // Wrap callbacks to pass the subject name for filtering
                    val openAssignments: (String) -> Unit = { onOpenAssignments(subject) }
                    val openQuizzes: (String) -> Unit = { onOpenQuizzes(subject) }
                    val openMaterials: (String) -> Unit = { onOpenMaterials(subject) }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                    ) {
                        // ── HERO HEADER ──────────────────────────────────────
                        DetailHeroHeader(
                            session = s,
                            gradient = gradient,
                            icon = icon,
                            accentColor = accentColor,
                            isTeacher = isTeacher,
                            onBack = onBack,
                        )

                        // ── CONTENT ──────────────────────────────────────────
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 16.dp, end = 16.dp, top = 8.dp),
                        ) {
                            if (isTeacher) {
                                TeacherSessionDetailContent(
                                    session = s,
                                    attendance = state.attendance,
                                    onOpenAssignments = openAssignments,
                                    onOpenQuizzes = openQuizzes,
                                    onOpenMaterials = openMaterials,
                                    accentColor = accentColor,
                                )
                            } else {
                                StudentSessionDetailContent(
                                    session = s,
                                    attendance = state.attendance,
                                    onOpenAssignments = openAssignments,
                                    onOpenQuizzes = openQuizzes,
                                    onOpenMaterials = openMaterials,
                                    accentColor = accentColor,
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

@Composable
private fun DetailHeroHeader(
    session: LearningSession,
    gradient: List<Color>,
    icon: ImageVector,
    accentColor: Color,
    isTeacher: Boolean,
    onBack: () -> Unit,
) {
    val subjectTitle = session.subjectName ?: session.notes ?: "Pelajaran"
    val roomText = listOfNotNull(session.room ?: "Ruang Kelas", session.className).joinToString(" • ")

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(250.dp)
            .background(Brush.linearGradient(gradient)),
    ) {
        // Decorative translucent circles
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 34.dp, end = 4.dp)
                .size(140.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.10f))
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 24.dp)
                .size(72.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.08f))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                // Immersive hero: content stays clear of the status bar
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
        ) {
            // Top Navigation Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CustomBackButton(
                    onClick = onBack,
                    backgroundColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White,
                )
                StatusChip(label = session.status)
            }

            Spacer(Modifier.weight(1f))

            // Main Content
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color.White.copy(alpha = 0.18f))
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = Color.White, modifier = Modifier.size(34.dp))
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(
                        subjectTitle.substringBefore(" • ").substringBefore(" (Ruang").trim(),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        lineHeight = 32.sp,
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        roomText,
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}