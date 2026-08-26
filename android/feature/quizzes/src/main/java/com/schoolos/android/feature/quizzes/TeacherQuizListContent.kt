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

fun LazyListScope.teacherQuizListContent(
    activeQuizzes: List<Quiz>,
    doneQuizzes: List<Quiz>,
    onQuizClick: (String) -> Unit
) {
    if (activeQuizzes.isNotEmpty()) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(com.schoolos.android.core.designsystem.TeacherNeon))
                Spacer(Modifier.width(10.dp))
                Text("Kelola Kuis Aktif", fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                Spacer(Modifier.width(8.dp))
                Text("${activeQuizzes.size}", color = com.schoolos.android.core.designsystem.TeacherNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
        items(activeQuizzes, key = { it.id }) { quiz ->
            TeacherQuizCard(quiz = quiz, onClick = { onQuizClick(quiz.id) })
        }
    }

    if (doneQuizzes.isNotEmpty()) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)) {
                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(TextTertiary))
                Spacer(Modifier.width(10.dp))
                Text("Riwayat & Arsip", fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
            }
        }
        items(doneQuizzes, key = { it.id }) { quiz ->
            TeacherQuizCard(quiz = quiz, onClick = { onQuizClick(quiz.id) }, isArchived = true)
        }
    }
}

@Composable
private fun TeacherQuizCard(
    quiz: Quiz,
    onClick: () -> Unit,
    isArchived: Boolean = false
) {
    val gradientColors = subjectGradient(quiz.title)
    val icon = subjectIcon(quiz.title)
    val accentColor = if (isArchived) TextTertiary else gradientColors.first()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder2, RoundedCornerShape(16.dp))
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
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("24/28 Selesai", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(10.dp))
                    Text("•", fontSize = 11.sp, color = TextTertiary)
                    Spacer(Modifier.width(10.dp))
                    Text("Avg: 88.5", fontSize = 11.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(10.dp))
                // Visual Progress
                Box(modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape).background(accentColor.copy(alpha = 0.1f))) {
                    Box(modifier = Modifier.fillMaxWidth(0.85f).height(4.dp).clip(CircleShape).background(accentColor))
                }
            }

            Spacer(Modifier.width(12.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}
