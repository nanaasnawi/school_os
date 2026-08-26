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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.Assignment
import androidx.compose.material.icons.filled.Schedule

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
            modifier = Modifier.padding(start = 4.dp, top = 8.dp, bottom = 4.dp)
        ) {
            Text(
                title.uppercase(),
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                color = color,
                letterSpacing = 1.sp
            )
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .size(width = 24.dp, height = 18.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text("${items.size}", color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    items(items, key = { it.id }) { assignment ->
        StudentAssignmentCard(
            assignment = assignment,
            sectionColor = color,
            onClick = { onAssignmentClick(assignment.id) }
        )
    }
}

@Composable
private fun StudentAssignmentCard(
    assignment: Assignment,
    sectionColor: Color,
    onClick: () -> Unit,
) {
    val (emoji, accentColor) = when {
        assignment.title.contains("Matematika", ignoreCase = true) -> Pair("🧮", StudentNeon)
        assignment.title.contains("IPA", ignoreCase = true) || assignment.title.contains("Sains", ignoreCase = true) -> Pair("🔬", NeonBlue)
        assignment.title.contains("Bahasa", ignoreCase = true) -> Pair("📚", NeonSuccess)
        else -> Pair("📝", NeonWarning)
    }

    val isUrgent = sectionColor == NeonError

    Box(
        modifier = Modifier
            .shadow(
                elevation = if (isUrgent) 6.dp else 4.dp,
                shape = RoundedCornerShape(22.dp),
                spotColor = if (isUrgent) NeonError.copy(alpha = 0.2f) else GlassOverlay
            )
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(CosmicNavy)
            .border(
                1.dp,
                if (isUrgent) NeonError.copy(alpha = 0.4f) else GlassBorder,
                RoundedCornerShape(22.dp)
            )
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // PREMIUM ICON BLOCK
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(emoji, fontSize = 22.sp)
                }

                Spacer(Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        assignment.title,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        color = TextPrimary,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Matematika • 7A",
                        fontSize = 11.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
            }

            Spacer(Modifier.height(16.dp))
            
            // METADATA STRIP
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isUrgent) NeonError.copy(alpha = 0.05f) else CosmicDark)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Schedule, 
                        null, 
                        tint = if (isUrgent) NeonError else TextTertiary, 
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        assignment.dueAt?.let { "Batas: ${formatDateShort(it)}" } ?: "Tanpa Batas",
                        fontSize = 11.sp,
                        color = if (isUrgent) NeonError else TextPrimary,
                        fontWeight = FontWeight.Black
                    )
                }

                StatusChip(label = assignment.status)
            }
        }
    }
}
