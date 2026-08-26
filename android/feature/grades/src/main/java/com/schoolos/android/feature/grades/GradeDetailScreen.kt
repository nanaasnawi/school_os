package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.ErrorState
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.StatusChip
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.core.designsystem.subjectGradient
import com.schoolos.android.core.designsystem.subjectIcon

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
                        // ── SOLID HERO BANNER ─────────────────────────────────
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Brush.linearGradient(gradient),
                                    RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                                )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 18.dp),
                            ) {
                                // TOP NAVIGATION ROW
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CustomBackButton(
                                        onClick = onBack,
                                        backgroundColor = Color.White,
                                        contentColor = TextPrimary
                                    )
                                    
                                    if (isTeacher) {
                                        Box(
                                            modifier = Modifier
                                                .clip(CircleShape)
                                                .background(Color.White.copy(alpha = 0.2f))
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text("28 SISWA", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                        }
                                    } else {
                                        StatusChip(label = "AKTIF")
                                    }
                                }

                                Spacer(Modifier.height(20.dp))

                                // HEADER TITLES
                                Column {
                                    Text(
                                        if (isTeacher) "LAPORAN NILAI KELAS" else "DETAIL AKADEMIK",
                                        color = Color.White.copy(alpha = 0.75f),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 1.2.sp
                                    )
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        if (isTeacher) d.summary.subjectName else subject,
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White,
                                        lineHeight = 34.sp,
                                        letterSpacing = (-0.5).sp
                                    )
                                    Spacer(Modifier.height(6.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Person, 
                                            null, 
                                            tint = Color.White.copy(alpha = 0.85f), 
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(Modifier.width(6.dp))
                                        Text(
                                            if (isTeacher) "Bpk. Andi Pratama • Semester Genap" else "Ahmad Fauzi • Semester Genap",
                                            fontSize = 12.sp,
                                            color = Color.White.copy(alpha = 0.9f),
                                            fontWeight = FontWeight.Bold
                                        )
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
