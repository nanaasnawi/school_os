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
import androidx.compose.ui.draw.shadow
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
            .shadow(4.dp, RoundedCornerShape(22.dp), spotColor = GlassOverlay)
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // PREMIUM ICON BLOCK
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(color.copy(alpha = 0.1f))
                    .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(emoji, fontSize = 22.sp)
            }

            Spacer(Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        summary.subjectName,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "%.1f".format(summary.finalScore),
                        fontWeight = FontWeight.Black,
                        fontSize = 20.sp,
                        color = color,
                        letterSpacing = (-1).sp
                    )
                }
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(color.copy(alpha = 0.1f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(summary.letterGrade, fontSize = 10.sp, fontWeight = FontWeight.Black, color = color)
                    }
                    Spacer(Modifier.width(10.dp))
                    Text(
                        "${summary.gradedComponentCount}/${summary.componentCount} Dinilai",
                        fontSize = 11.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
        }
    }
}
