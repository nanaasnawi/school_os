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
import androidx.compose.material.icons.filled.Analytics

fun LazyListScope.teacherAssignmentListContent(
    activeItems: List<Assignment>,
    dueSoonItems: List<Assignment>,
    selectedTab: String,
    onAssignmentClick: (String) -> Unit
) {
    if (selectedTab == "Semua" || selectedTab == "Perlu Dinilai") {
        renderTeacherSection("📝 Perlu Dinilai", dueSoonItems, NeonError, onAssignmentClick)
    }
    if (selectedTab == "Semua" || selectedTab == "Aktif") {
        renderTeacherSection("📋 Tugas Berjalan", activeItems, StudentNeon, onAssignmentClick)
    }
}

private fun LazyListScope.renderTeacherSection(
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
        TeacherAssignmentCard(assignment = assignment, onClick = { onAssignmentClick(assignment.id) })
    }
}

@Composable
private fun TeacherAssignmentCard(
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
            .shadow(4.dp, RoundedCornerShape(22.dp), spotColor = GlassOverlay)
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // PREMIUM ICON BLOCK
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(emoji, fontSize = 20.sp)
                }

                Spacer(Modifier.width(14.dp))

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
                        "Matematika • Kelas 7A",
                        fontSize = 11.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
            }

            Spacer(Modifier.height(16.dp))
            
            // ANALYTICAL METADATA STRIP
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(CosmicDark)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Analytics, null, tint = NeonBlue, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("12/28 Dinilai", fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Black)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("42%", fontSize = 9.sp, color = accentColor, fontWeight = FontWeight.Black)
                }
            }
            
            Spacer(Modifier.height(10.dp))
            
            // INTEGRATED PROGRESS BAR
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.42f)
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(accentColor)
                )
            }
        }
    }
}
