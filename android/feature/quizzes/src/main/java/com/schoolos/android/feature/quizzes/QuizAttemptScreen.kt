package com.schoolos.android.feature.quizzes

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CircularTimer
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface2
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.core.designsystem.subjectGradient
import com.schoolos.android.core.designsystem.subjectIcon

private val ChoiceLabels = listOf("A", "B", "C", "D", "E")
private val ChoiceColors = listOf(
    StudentNeon,
    NeonBlue,
    NeonSuccess,
    NeonWarning,
    NeonError,
)

@Composable
fun QuizAttemptScreen(
    onBack: () -> Unit = {},
    onSubmitted: (String) -> Unit = {},
    viewModel: QuizAttemptViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var showConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(state.submitSuccess) {
        if (state.submitSuccess && state.resultAttempt != null) {
            onSubmitted(state.resultAttempt!!.id)
        }
    }

    when {
        state.isLoading -> LoadingState()
        state.questions.isEmpty() && !state.isLoading -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📋", fontSize = 52.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("Tidak ada soal tersedia", style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
        else -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
            ) {
                Column(modifier = Modifier.fillMaxSize()) {

                    // ── TOP BAR ──────────────────────────────────────────────
                    QuizTopBar(
                        currentIndex = state.currentIndex,
                        totalQuestions = state.questions.size,
                        progress = state.progress,
                        answeredCount = state.answeredCount,
                        onClose = onBack,
                    )

                    // ── QUESTION NAVIGATOR PILLS ──────────────────────────────
                    LazyRow(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        itemsIndexed(state.questions) { index, question ->
                            val isAnswered = state.answers[question.id] != null
                            val isCurrent = index == state.currentIndex
                            val pillColor = when {
                                isCurrent  -> StudentNeon
                                isAnswered -> NeonSuccess
                                else       -> CosmicNavy
                            }
                            val textColor = when {
                                isCurrent || isAnswered -> CosmicBlack
                                else -> TextTertiary
                            }
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(pillColor.copy(alpha = if (isCurrent || isAnswered) 1f else 0.3f))
                                    .border(1.dp, pillColor.copy(alpha = 0.5f), CircleShape)
                                    .clickable { viewModel.goToQuestion(index) },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "${index + 1}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCurrent || isAnswered) CosmicBlack else TextTertiary,
                                )
                            }
                        }
                    }

                    // ── QUESTION CONTENT (animated slide) ────────────────────
                    val question = state.currentQuestion
                    if (question != null) {
                        AnimatedContent(
                            targetState = state.currentIndex,
                            transitionSpec = {
                                if (targetState > initialState) {
                                    (slideInHorizontally { it } + fadeIn()).togetherWith(slideOutHorizontally { -it } + fadeOut())
                                } else {
                                    (slideInHorizontally { -it } + fadeIn()).togetherWith(slideOutHorizontally { it } + fadeOut())
                                }
                            },
                            label = "questionSlide",
                            modifier = Modifier.weight(1f),
                        ) { _ ->
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .verticalScroll(rememberScrollState())
                                    .padding(horizontal = 16.dp),
                            ) {
                                val gradients = subjectGradient(question.questionText)
                                val icon = subjectIcon(question.questionText)

                                // Question Header (Image or Gradient Illustration)
                                if (question.imageUrl != null) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(200.dp)
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(CosmicNavy)
                                    ) {
                                        coil.compose.SubcomposeAsyncImage(
                                            model = question.imageUrl,
                                            contentDescription = "Gambar Soal",
                                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize(),
                                            loading = {
                                                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                                    CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                                                }
                                            }
                                        )
                                        // Count Overlay
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.BottomEnd)
                                                .padding(12.dp)
                                                .clip(CircleShape)
                                                .background(Color.Black.copy(alpha = 0.5f))
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                "${state.currentIndex + 1}/${state.questions.size}",
                                                color = Color.White,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(120.dp)
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(Brush.linearGradient(gradients)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(42.dp))
                                            Spacer(Modifier.height(4.dp))
                                            Text(
                                                "Soal ${state.currentIndex + 1} dari ${state.questions.size}",
                                                color = Color.White.copy(alpha = 0.85f),
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.SemiBold,
                                            )
                                        }
                                    }
                                }

                                Spacer(Modifier.height(20.dp))

                                // Question text
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Top,
                                ) {
                                    Text(
                                        question.questionText,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.weight(1f),
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = Color(0xFFF3E8FF),
                                    ) {
                                        Text(
                                            "+${question.points} pts",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Color(0xFF7C3AED),
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        )
                                    }
                                }

                                Spacer(Modifier.height(20.dp))

                                // Answer options
                                when (question.questionType) {
                                    "multiple_choice", "true_false" -> {
                                        question.choices.forEachIndexed { idx, choice ->
                                            val choiceKey = "choice_${choice.id}"
                                            val isSelected = state.answers[question.id] == choiceKey
                                            val accentColor = ChoiceColors.getOrElse(idx) { Color(0xFF7C3AED) }
                                            val label = ChoiceLabels.getOrElse(idx) { "${idx + 1}" }

                                            AnswerBubble(
                                                label = label,
                                                text = choice.choiceText,
                                                isSelected = isSelected,
                                                accentColor = accentColor,
                                                onClick = { viewModel.selectAnswer(question.id, choiceKey) },
                                            )
                                            Spacer(Modifier.height(10.dp))
                                        }
                                    }
                                    "essay" -> {
                                        val text = state.answers[question.id] ?: ""
                                        OutlinedTextField(
                                            value = text,
                                            onValueChange = { viewModel.setEssayAnswer(question.id, it) },
                                            label = { Text("Tulis jawaban kamu di sini...") },
                                            modifier = Modifier.fillMaxWidth().height(200.dp),
                                            maxLines = 10,
                                            shape = RoundedCornerShape(16.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = Color(0xFF7C3AED),
                                            ),
                                        )
                                    }
                                }

                                Spacer(Modifier.height(24.dp))
                            }
                        }
                    }

                    // ── BOTTOM NAV BUTTONS ────────────────────────────────────
                    QuizBottomBar(
                        currentIndex = state.currentIndex,
                        isLastQuestion = state.isLastQuestion,
                        isSubmitting = state.isSubmitting,
                        submitError = state.submitError,
                        onPrevious = viewModel::previousQuestion,
                        onNext = viewModel::nextQuestion,
                        onShowConfirm = { showConfirm = true },
                    )
                }
            }
        }
    }

    // ── SUBMIT CONFIRM DIALOG ────────────────────────────────────────────────
    if (showConfirm) {
        AlertDialog(
            onDismissRequest = { showConfirm = false },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("📤", fontSize = 36.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Kumpulkan Jawaban?", fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                }
            },
            text = {
                Text(
                    "Kamu sudah menjawab ${state.answeredCount} dari ${state.questions.size} soal.\n" +
                    "Soal yang belum dijawab akan dihitung salah.",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyMedium,
                )
            },
            confirmButton = {
                Button(
                    onClick = { showConfirm = false; viewModel.submit() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Text("Kumpulkan Sekarang", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirm = false }) {
                    Text("Periksa Lagi", color = Color(0xFF7C3AED))
                }
            },
            shape = RoundedCornerShape(24.dp),
        )
    }
}

@Composable
private fun QuizTopBar(
    currentIndex: Int,
    totalQuestions: Int,
    progress: Float,
    answeredCount: Int,
    onClose: () -> Unit,
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(400, easing = FastOutSlowInEasing),
        label = "progressAnim",
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onClose) {
                Icon(Icons.Default.Close, "Keluar", tint = MaterialTheme.colorScheme.onSurface)
            }
            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Soal ${currentIndex + 1}/$totalQuestions",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "$answeredCount terjawab",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF7C3AED),
                )
            }
            // XP indicator
            Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFF3E8FF)) {
                Text(
                    "⭐ XP",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFF7C3AED),
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }

        Spacer(Modifier.height(6.dp))

        // Progress bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(CircleShape)
                .background(Color(0xFFE2E8F0))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animatedProgress)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(Color(0xFF7C3AED), Color(0xFF9333EA))))
            )
        }
    }
}

@Composable
private fun AnswerBubble(
    label: String,
    text: String,
    isSelected: Boolean,
    accentColor: Color,
    onClick: () -> Unit,
) {
    val bgColor by animateColorAsState(
        targetValue = if (isSelected) accentColor else Color.White,
        animationSpec = tween(200),
        label = "bubbleBg",
    )
    val borderColor by animateColorAsState(
        targetValue = if (isSelected) accentColor else Color(0xFFE2E8F0),
        animationSpec = tween(200),
        label = "bubbleBorder",
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else Color(0xFF1E293B),
        animationSpec = tween(200),
        label = "bubbleText",
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(if (isSelected) 4.dp else 1.dp, RoundedCornerShape(16.dp), ambientColor = accentColor)
            .clip(RoundedCornerShape(16.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Letter label circle
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(if (isSelected) Color.White.copy(alpha = 0.25f) else accentColor.copy(alpha = 0.10f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = if (isSelected) Color.White else accentColor,
                )
            }
            Spacer(Modifier.width(12.dp))
            Text(
                text,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                color = textColor,
                modifier = Modifier.weight(1f),
            )
            if (isSelected) {
                Spacer(Modifier.width(8.dp))
                Text("✓", fontSize = 16.sp, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun QuizBottomBar(
    currentIndex: Int,
    isLastQuestion: Boolean,
    isSubmitting: Boolean,
    submitError: String?,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onShowConfirm: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        submitError?.let {
            Text(it, color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 6.dp))
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Previous
            Box(
                modifier = Modifier
                    .height(52.dp)
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (currentIndex > 0) Color(0xFFF1F5F9) else Color(0xFFE2E8F0))
                    .clickable(enabled = currentIndex > 0, onClick = onPrevious),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Sebelumnya", tint = if (currentIndex > 0) Color(0xFF475569) else Color(0xFF94A3B8), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Sebelumnya", fontWeight = FontWeight.SemiBold, color = if (currentIndex > 0) Color(0xFF475569) else Color(0xFF94A3B8), fontSize = 14.sp)
                }
            }

            // Next / Submit
            Box(
                modifier = Modifier
                    .height(52.dp)
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(
                        Brush.horizontalGradient(
                            if (isLastQuestion) listOf(Color(0xFF059669), Color(0xFF0D9488))
                            else listOf(Color(0xFF7C3AED), Color(0xFF9333EA))
                        )
                    )
                    .clickable(enabled = !isSubmitting) { if (isLastQuestion) onShowConfirm() else onNext() },
                contentAlignment = Alignment.Center,
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(22.dp))
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            if (isLastQuestion) "Kumpulkan" else "Berikutnya",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 14.sp,
                        )
                        Spacer(Modifier.width(4.dp))
                        if (!isLastQuestion) Icon(Icons.AutoMirrored.Filled.ArrowForward, "Berikutnya", tint = Color.White, modifier = Modifier.size(18.dp))
                        else Text("🚀", fontSize = 14.sp)
                    }
                }
            }
        }
    }
}
