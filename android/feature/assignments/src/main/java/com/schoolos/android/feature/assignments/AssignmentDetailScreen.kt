package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"
                    val isParent  = role == "parent" || role == "ortu" || role == "wali"

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                    ) {
                        // ── SOLID HERO BANNER (No Glass/Transparency) ───────────
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Brush.linearGradient(gradient),
                                    RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                                )
                                .padding(horizontal = 20.dp, vertical = 18.dp),
                        ) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                // TOP NAVIGATION ROW
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CustomBackButton(
                                        onClick = { onBack?.invoke() },
                                        backgroundColor = Color.White,
                                        contentColor = TextPrimary
                                    )
                                    StatusChip(label = a.status)
                                }

                                Spacer(Modifier.height(20.dp))

                                // CONTENT ROW
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(54.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(Color.White)
                                            .shadow(4.dp, RoundedCornerShape(16.dp), spotColor = Color(0x20000000)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, null, tint = gradient.first(), modifier = Modifier.size(28.dp))
                                    }
                                    Spacer(Modifier.width(16.dp))
                                    Text(
                                        a.title,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White,
                                        lineHeight = 26.sp
                                    )
                                }
                                Spacer(Modifier.height(8.dp))
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
                                    allSubmissions = state.allSubmissions
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
                                    onSubmitClick = { showConfirm = true }
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
            title = { Text("Kumpulkan PR?") },
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
