package com.schoolos.android.feature.quizzes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.AccentNeonAmber
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.GlassCard
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.core.designsystem.subjectGradient

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun QuizDetailScreen(
    onBack: (() -> Unit) = {},
    onAttemptStarted: (String) -> Unit = {},
    viewModel: QuizDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.attempt) {
        state.attempt?.let { onAttemptStarted(it.id) }
    }

    Scaffold(containerColor = CosmicBlack) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    com.schoolos.android.core.designsystem.ErrorState(message = state.error!!)
                }
                state.quiz != null -> {
                    val q = state.quiz!!
                    val accentColor = subjectGradient(q.title).first()
                    val isAvailable = q.status.lowercase() in listOf("active", "open", "published")

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                    ) {
                        // ── REFACTORED NON-OVERLAPPING HERO HEADER ─────────────
                        QuizHeroHeaderRefactored(quiz = q, onBack = onBack)

                        Column(
                            modifier = Modifier
                                .padding(horizontal = 16.dp)
                                .offset(y = (-14).dp)
                        ) {
                            // COMPACT METRICS ROW
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CompactQuizMetricPill("Soal", "${q.questionsCount}", Icons.AutoMirrored.Filled.List, NeonBlue, Modifier.weight(1f))
                                CompactQuizMetricPill("Waktu", if (q.timeLimitMinutes != null) "${q.timeLimitMinutes}'" else "—", Icons.Default.Timer, NeonWarning, Modifier.weight(1f))
                                CompactQuizMetricPill("Poin", "${q.maxScore}", Icons.Default.EmojiEvents, NeonSuccess, Modifier.weight(1f))
                            }

                            Spacer(Modifier.height(20.dp))

                            Text("Deskripsi Kuis", fontWeight = FontWeight.Black, fontSize = 15.sp, color = TextPrimary)
                            Spacer(Modifier.height(8.dp))
                            GlassCard(cornerRadius = 16.dp) {
                                Text(
                                    text = q.description ?: "Tunjukkan kemampuan terbaikmu!",
                                    fontSize = 13.sp, color = TextSecondary, lineHeight = 20.sp,
                                    modifier = Modifier.padding(14.dp)
                                )
                            }

                            Spacer(Modifier.height(20.dp))
                            QuizTipsSectionCompact()

                            Spacer(Modifier.height(32.dp))

                            // COMPACT PRIMARY ACTION
                            Button(
                                onClick = viewModel::startAttempt,
                                enabled = !state.isStarting && isAvailable,
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, disabledContainerColor = Color.Transparent),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            if (isAvailable) listOf(accentColor, accentColor.copy(alpha = 0.8f))
                                            else listOf(TextTertiary, TextTertiary.copy(alpha = 0.8f))
                                        )
                                    ),
                            ) {
                                if (state.isStarting) {
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                                } else {
                                    Text(
                                        if (isAvailable) "MULAI KERJAKAN" else "BELUM TERSEDIA",
                                        fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = 0.5.sp
                                    )
                                }
                            }

                            state.startError?.let {
                                Spacer(Modifier.height(10.dp))
                                Text(it, color = NeonError, fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.fillMaxWidth())
                            }
                            
                            Spacer(Modifier.height(40.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuizHeroHeaderRefactored(
    quiz: com.schoolos.android.domain.model.Quiz,
    onBack: () -> Unit
) {
    val gradient = subjectGradient(quiz.title)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .background(Brush.verticalGradient(listOf(gradient.first(), gradient.last().copy(alpha = 0.6f))))
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // TOP NAVIGATION ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CustomBackButton(
                    onClick = onBack,
                    backgroundColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                )
            }

            Spacer(Modifier.weight(1f))

            // CONTENT SECTION
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text("⭐ Potensi 500 XP", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
            }
            Spacer(Modifier.height(10.dp))
            Text(quiz.title, fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White, lineHeight = 28.sp)
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun CompactQuizMetricPill(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, modifier: Modifier = Modifier) {
    GlassCard(modifier = modifier, cornerRadius = 14.dp) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(color.copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
            }
            Spacer(Modifier.height(6.dp))
            Text(value, fontWeight = FontWeight.Black, fontSize = 16.sp, color = TextPrimary)
            Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextTertiary)
        }
    }
}

@Composable
private fun QuizTipsSectionCompact() {
    com.schoolos.android.core.designsystem.NeonCard(
        gradientColors = listOf(NeonWarning, AccentNeonAmber),
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 14.dp
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("💡", fontSize = 20.sp)
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Tips Pengerjaan", fontWeight = FontWeight.Black, fontSize = 12.sp, color = TextPrimary)
                Text("Cari tempat tenang agar fokus maksimal!", fontSize = 11.sp, color = TextSecondary)
            }
        }
    }
}
