package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentDetailScreen(
    onBack: (() -> Unit)? = null,
    onOpenMaterial: (String) -> Unit = {},
    onAskTeacher: ((assignmentTitle: String, assignmentId: String, subjectName: String, teacherName: String) -> Unit)? = null,
    viewModel: AssignmentDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var content by remember { mutableStateOf("") }
    var showConfirm by remember { mutableStateOf(false) }

    Scaffold(containerColor = CosmicBlack) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    ErrorState(message = state.error!!, onRetry = viewModel::load)
                }
                state.assignment != null -> {
                    val a = state.assignment!!
                    val subject = a.title
                    val gradient = subjectGradient(subject)
                    val icon = subjectIcon(subject)
                    val isTeacher = com.schoolos.android.core.auth.isTeacherRole(state.userRole)
                    val isParent  = com.schoolos.android.core.auth.isParentRole(state.userRole)

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                    ) {
// ── PREMIUM HERO BANNER (status-bar safe) ─────────────
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Brush.linearGradient(gradient))
                        ) {
                            // Decorative translucent circles
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 52.dp, end = 8.dp)
                                    .size(116.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.08f))
                            )
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .padding(start = 20.dp)
                                    .size(64.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.06f))
                            )

                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    // Edge-to-edge safe: keep controls clear of the device status bar
                                    .statusBarsPadding()
                                    .padding(horizontal = 20.dp, vertical = 16.dp),
                            ) {
                                // TOP NAVIGATION ROW
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CustomBackButton(
                                        onClick = { onBack?.invoke() },
                                        backgroundColor = Color.White.copy(alpha = 0.15f),
                                        contentColor = Color.White,
                                    )
                                    StatusChip(label = a.status)
                                }

                                Spacer(Modifier.height(22.dp))

// TITLE ROW: icon badge + identity
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(18.dp))
                                            .background(Color.White.copy(alpha = 0.18f))
                                            .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(18.dp))
                                            .shadow(3.dp, RoundedCornerShape(18.dp), spotColor = Color.White.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, null, tint = Color.White, modifier = Modifier.size(30.dp))
                                    }
                                    Spacer(Modifier.width(16.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            if (isTeacher) "TUGAS & PENILAIAN" else "DETAIL TUGAS",
                                            color = Color.White.copy(alpha = 0.8f),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Black,
                                            letterSpacing = 1.2.sp
                                        )
                                        Spacer(Modifier.height(4.dp))
                                        Text(
                                            a.title,
                                            fontSize = 21.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            lineHeight = 27.sp,
                                            maxLines = 2,
                                        )
                                        Spacer(Modifier.height(2.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.Schedule,
                                                null,
                                                tint = Color.White.copy(alpha = 0.85f),
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                formatDateShort(a.dueAt ?: ""),
                                                fontSize = 12.sp,
                                                color = Color.White.copy(alpha = 0.85f),
                                                fontWeight = FontWeight.Medium,
                                                maxLines = 1,
                                            )
                                        }
                                    }
                                }
                            }
                        }

Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                        ) {
                            if (isTeacher) {
                                TeacherAssignmentDetailContent(
                                    assignment = a,
                                    allSubmissions = state.allSubmissions,
                                    isGrading = state.isGrading,
                                    gradeSuccess = state.gradeSuccess,
                                    gradeError = state.gradeError,
                                    onGrade = { submissionId, score, feedback ->
                                        viewModel.gradeSubmission(submissionId, score, feedback)
                                    },
                                    onDismissGradeSuccess = viewModel::dismissGradeSuccess,
                                    onDismissGradeError = viewModel::dismissGradeError,
                                )
                            } else {
                                StudentAssignmentDetailContent(
                                    assignment = a,
                                    submission = state.submission,
                                    isParent = isParent,
                                    isSubmitting = state.isSubmitting,
                                    content = content,
                                    onContentChange = { content = it },
                                    onOpenMaterial = onOpenMaterial,
                                    onSubmitClick = { showConfirm = true },
                                    childName = state.childName,
                                    onAskTeacher = { onAskTeacher?.invoke(a.title, a.id, a.subjectName ?: "Tugas", a.teacherName ?: "Guru Pengampu") }
                                )
                            }

                            Spacer(Modifier.height(60.dp))
                        }
                    }
                }
            }
        }
    }

    if (showConfirm) {
        AlertDialog(
            onDismissRequest = { showConfirm = false },
            title = { Text("Kumpulkan Tugas?") },
            text = { Text("Pastikan jawaban kamu sudah benar sebelum dikirimkan.") },
            confirmButton = {
                TextButton(onClick = {
                    showConfirm = false
                    viewModel.submit(content)
                }) { Text("Kumpulkan") }
            },
            dismissButton = {
                TextButton(onClick = { showConfirm = false }) { Text("Batal") }
            }
        )
    }
}