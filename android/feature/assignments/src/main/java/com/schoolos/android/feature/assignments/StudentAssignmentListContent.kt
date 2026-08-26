package com.schoolos.android.feature.assignments

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
import com.schoolos.android.domain.model.Assignment

fun LazyListScope.studentAssignmentListContent(
    activeItems: List<Assignment>,
    dueSoonItems: List<Assignment>,
    completedItems: List<Assignment>,
    selectedTab: String,
    onAssignmentClick: (String) -> Unit
) {
    if (selectedTab == "Semua" || selectedTab == "Segera") {
        renderStudentSection("🚨 Segera Berakhir", dueSoonItems, NeonError, onAssignmentClick)
    }
    if (selectedTab == "Semua" || selectedTab == "Aktif") {
        renderStudentSection("📋 Tugas Aktif", activeItems, StudentNeon, onAssignmentClick)
    }
    if (selectedTab == "Semua" || selectedTab == "Selesai") {
        renderStudentSection("✅ Selesai & Dinilai", completedItems, NeonSuccess, onAssignmentClick)
    }
}

private fun LazyListScope.renderStudentSection(
    title: String,
    items: List<Assignment>,
    color: Color,
    onAssignmentClick: (String) -> Unit,
) {
    if (items.isEmpty()) return

    item {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
        ) {
            Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(color))
            Spacer(Modifier.width(8.dp))
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextPrimary)
            Spacer(Modifier.width(8.dp))
            Text("${items.size}", color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }

    items(items, key = { it.id }) { assignment ->
        StudentAssignmentCard(assignment = assignment, onClick = { onAssignmentClick(assignment.id) })
    }
}

@Composable
private fun StudentAssignmentCard(
    assignment: Assignment,
    onClick: () -> Unit,
) {
    val (emoji, accentColor) = when {
        assignment.title.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        assignment.title.contains("IPA", ignoreCase = true) || assignment.title.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        assignment.title.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        else -> Pair("📝", NeonWarning)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp))
                    .background(accentColor.copy(alpha = 0.08f))
                    .border(1.dp, accentColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(emoji, fontSize = 18.sp)
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    assignment.title,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = TextPrimary,
                )
                val dueAtStr = assignment.dueAt
                if (dueAtStr != null) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "⏰ Batas: ${formatDateShort(dueAtStr)}",
                        fontSize = 11.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(Modifier.width(8.dp))
            StatusChip(label = assignment.status)
            Spacer(Modifier.width(4.dp))
            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
        }
    }
}
