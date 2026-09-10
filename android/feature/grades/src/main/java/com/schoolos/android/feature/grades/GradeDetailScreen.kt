package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
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
fun GradeDetailScreen(
    onBack: () -> Unit = {},
    viewModel: GradeDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(containerColor = CosmicBlack) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    ErrorState(message = state.error!!, onRetry = viewModel::load)
                }
                state.detail != null -> {
                    val d = state.detail!!
                    val role = state.userRole.lowercase()
                    val isTeacher = role == "teacher" || role == "guru"

                    val subject = d.summary.subjectName
                    val gradient = subjectGradient(subject)
                    val icon = subjectIcon(subject)

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
                                        onClick = onBack,
                                        backgroundColor = Color.White.copy(alpha = 0.15f),
                                        contentColor = Color.White,
                                    )

                                    if (isTeacher) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(20.dp))
                                                .background(Color.White.copy(alpha = 0.18f))
                                                .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text("28 SISWA", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                        }
                                    } else {
                                        StatusChip(label = "AKTIF")
                                    }
                                }

                                Spacer(Modifier.height(22.dp))

// TITLE ROW: icon badge + identity
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(64.dp)
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(Color.White.copy(alpha = 0.18f))
                                            .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                                            .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = Color.White.copy(alpha = 0.25f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, null, tint = Color.White, modifier = Modifier.size(32.dp))
                                    }
                                    Spacer(Modifier.width(16.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            if (isTeacher) "LAPORAN NILAI KELAS" else "DETAIL AKADEMIK",
                                            color = Color.White.copy(alpha = 0.8f),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Black,
                                            letterSpacing = 1.2.sp
                                        )
                                        Spacer(Modifier.height(4.dp))
                                        Text(
                                            if (isTeacher) d.summary.subjectName else subject,
                                            fontSize = 24.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            lineHeight = 30.sp,
                                            letterSpacing = (-0.5).sp,
                                            maxLines = 1,
                                        )
                                        Spacer(Modifier.height(2.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.Person,
                                                null,
                                                tint = Color.White.copy(alpha = 0.85f),
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                "Semester Genap • Tahun Ajaran 2026/2027",
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

                        // ── CONTENT AREA ─────────────────────────────────────
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                        ) {
                            if (isTeacher) {
                                TeacherGradeDetailContent(detail = d)
                            } else {
                                StudentGradeDetailContent(detail = d)
                            }

                            Spacer(Modifier.height(60.dp))
                        }
                    }
                }
            }
        }
    }
}