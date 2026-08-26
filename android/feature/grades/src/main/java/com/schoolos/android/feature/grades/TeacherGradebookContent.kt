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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*

fun LazyListScope.teacherGradebookContent(
    onSubjectClick: (String, String) -> Unit
) {
    items(listOf(
        Triple("7A", "Matematika", 28),
        Triple("8B", "Matematika", 30),
        Triple("9C", "Matematika", 29)
    )) { (kelas, mapel, siswa) ->
        TeacherClassGradeCard(
            kelas = kelas,
            mapel = mapel,
            studentCount = siswa,
            onClick = { onSubjectClick(kelas, mapel) }
        )
    }
}

@Composable
private fun TeacherClassGradeCard(
    kelas: String,
    mapel: String,
    studentCount: Int,
    onClick: () -> Unit
) {
    val color = when (kelas) {
        "7A" -> StudentNeon
        "8B" -> NeonBlue
        else -> TeacherNeon
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
                Text(kelas, fontWeight = FontWeight.Black, fontSize = 18.sp, color = color)
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "$mapel — $kelas",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = TextPrimary
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("$studentCount Siswa", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.width(8.dp))
                    Text("•", fontSize = 11.sp, color = TextTertiary)
                    Spacer(Modifier.width(8.dp))
                    Text("Rata-rata: 90.2", fontSize = 11.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
                }
            }

            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}
