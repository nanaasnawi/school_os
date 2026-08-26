package com.schoolos.android.feature.quizzes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Quiz

fun LazyListScope.studentQuizListContent(
    activeQuizzes: List<Quiz>,
    doneQuizzes: List<Quiz>,
    onQuizClick: (String) -> Unit
) {
    if (activeQuizzes.isNotEmpty()) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(NeonBlue))
                Spacer(Modifier.width(10.dp))
                Text("Kuis Aktif", fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                Spacer(Modifier.width(8.dp))
                Text("${activeQuizzes.size}", color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
        items(activeQuizzes, key = { it.id }) { quiz ->
            StudentQuizCard(quiz = quiz, onClick = { onQuizClick(quiz.id) })
        }
    }

    if (doneQuizzes.isNotEmpty()) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)) {
                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(NeonSuccess))
                Spacer(Modifier.width(10.dp))
                Text("Sudah Dikerjakan", fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
            }
        }
        items(doneQuizzes, key = { it.id }) { quiz ->
            StudentQuizCard(quiz = quiz, onClick = { onQuizClick(quiz.id) }, isDone = true)
        }
    }
}

@Composable
private fun StudentQuizCard(
    quiz: Quiz,
    onClick: () -> Unit,
    isDone: Boolean = false,
) {
    val gradientColors = subjectGradient(quiz.title)
    val icon = subjectIcon(quiz.title)
    val accentColor = if (isDone) TextTertiary else gradientColors.first()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, if (isDone) GlassBorder2 else accentColor.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                    .background(accentColor.copy(alpha = 0.08f))
                    .border(1.dp, accentColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = accentColor, modifier = Modifier.size(22.dp))
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    quiz.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = if (isDone) TextSecondary else TextPrimary,
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    quiz.timeLimitMinutes?.let { mins ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Timer, null, modifier = Modifier.size(11.dp), tint = if (isDone) TextTertiary else NeonWarning)
                            Spacer(Modifier.width(3.dp))
                            Text("$mins mnt", fontSize = 10.sp, color = if (isDone) TextTertiary else NeonWarning, fontWeight = FontWeight.Bold)
                        }
                    }
                    Text("${quiz.questionsCount} soal", fontSize = 10.sp, color = TextTertiary)
                    Text("${quiz.maxScore} poin", fontSize = 10.sp, color = TextTertiary)
                }
            }

            Spacer(Modifier.width(8.dp))

            if (isDone) {
                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(NeonSuccess.copy(alpha = 0.1f)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                    Text("DONE", fontSize = 9.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
                }
            } else {
                Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
            }
        }
    }
}
