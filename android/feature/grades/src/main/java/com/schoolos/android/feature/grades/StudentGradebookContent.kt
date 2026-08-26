package com.schoolos.android.feature.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
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
import com.schoolos.android.domain.model.SubjectGradeSummary

fun LazyListScope.studentGradebookContent(
    subjects: List<SubjectGradeSummary>,
    onSubjectClick: (String, String) -> Unit
) {
    items(subjects, key = { it.subjectId }) { subject ->
        StudentSubjectGradeCard(
            summary = subject,
            onClick = { onSubjectClick(subject.subjectId, subject.subjectName) },
        )
    }
}

@Composable
private fun StudentSubjectGradeCard(summary: SubjectGradeSummary, onClick: () -> Unit) {
    val (emoji, color) = when {
        summary.subjectName.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        summary.subjectName.contains("IPA", ignoreCase = true) || summary.subjectName.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        summary.subjectName.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        summary.subjectName.contains("IPS", ignoreCase = true) -> Pair("🌍", NeonWarning)
        summary.subjectName.contains("Penjaskes", ignoreCase = true) || summary.subjectName.contains("Olahraga", ignoreCase = true) -> Pair("⚽", NeonError)
        else -> Pair("📖", TextTertiary)
    }

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
                    .background(color.copy(alpha = 0.08f))
                    .border(1.dp, color.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(emoji, fontSize = 20.sp)
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        summary.subjectName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "%.1f".format(summary.finalScore),
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        color = TextPrimary,
                    )
                }
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    LetterGradeBadge(summary.letterGrade)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "${summary.gradedComponentCount}/${summary.componentCount} Dinilai",
                        fontSize = 11.sp,
                        color = TextTertiary,
                    )
                }
            }

            Spacer(Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}
