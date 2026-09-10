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
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
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
    onAssignmentClick: (String) -> Unit,
) {
    val showAll = selectedTab == "Semua"
    val showDueSoon = showAll || selectedTab == "Segera"
    val showActive = showAll || selectedTab == "Aktif"
    val showCompleted = showAll || selectedTab == "Selesai"

    val hasAnyItems = (showDueSoon && dueSoonItems.isNotEmpty()) ||
            (showActive && activeItems.isNotEmpty()) ||
            (showCompleted && completedItems.isNotEmpty())

    if (!hasAnyItems) {
        item {
            EmptyAssignmentState(selectedTab = selectedTab)
        }
    } else {
        // Show due soon (urgent) first
        if (showDueSoon && dueSoonItems.isNotEmpty()) {
            renderAssignmentSection(
                title = "Segera Berakhir",
                items = dueSoonItems,
                accentColor = NeonError,
                onAssignmentClick = onAssignmentClick
            )
        }

        // Show active assignments
        if (showActive && activeItems.isNotEmpty()) {
            renderAssignmentSection(
                title = "Sedang Berlangsung",
                items = activeItems,
                accentColor = StudentNeon,
                onAssignmentClick = onAssignmentClick
            )
        }

        // Show completed assignments
        if (showCompleted && completedItems.isNotEmpty()) {
            renderAssignmentSection(
                title = "Tugas Selesai",
                items = completedItems,
                accentColor = NeonSuccess,
                onAssignmentClick = onAssignmentClick
            )
        }
    }
}

private fun LazyListScope.renderAssignmentSection(
    title: String,
    items: List<Assignment>,
    accentColor: Color,
    onAssignmentClick: (String) -> Unit,
) {
    if (items.isEmpty()) return

    item {
        SectionHeader(
            title = title,
            count = items.size,
            accentColor = accentColor,
        )
    }

    items(items, key = { it.id }) { assignment ->
        StudentAssignmentCard(
            assignment = assignment,
            accentColor = accentColor,
            onClick = { onAssignmentClick(assignment.id) }
        )
    }
}

@Composable
private fun SectionHeader(
    title: String,
    count: Int,
    accentColor: Color,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 6.dp)
    ) {
        // Glowing dot indicator
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(accentColor)
        )
        Spacer(Modifier.width(8.dp))
        Text(
            title.uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            color = TextPrimary,
            letterSpacing = 0.8.sp
        )
        Spacer(Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(accentColor.copy(alpha = 0.12f))
                .padding(horizontal = 8.dp, vertical = 2.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "$count",
                color = accentColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.ExtraBold
            )
        }
    }
}

@Composable
private fun StudentAssignmentCard(
    assignment: Assignment,
    accentColor: Color,
    onClick: () -> Unit,
) {
    val dueInfo = dueDateInfo(assignment.dueAt)
    val isOverdue = dueInfo?.label?.contains("Terlambat") == true
    val isCompleted = assignment.status == "submitted" || assignment.status == "graded"
    val title = assignment.title.ifBlank { "Tugas Tanpa Judul" }

    // Dynamic subject color badge
    val subjectLabel = assignment.subjectName ?: assignment.className ?: "Umum"
    val cardAccent = when {
        isOverdue -> NeonError
        isCompleted -> NeonSuccess
        else -> accentColor
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay, ambientColor = GlassOverlay)
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(
                width = if (isOverdue) 1.5.dp else 1.dp,
                color = if (isOverdue) NeonError.copy(alpha = 0.6f) else GlassBorder,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Column {
            // ── TOP ROW: SUBJECT TAG & SCORE PILL ────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Subject / Class pill
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(cardAccent.copy(alpha = 0.10f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(cardAccent)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = subjectLabel.uppercase(),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = cardAccent,
                        letterSpacing = 0.5.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Max Score pill
                if (assignment.maxScore > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(CosmicDark)
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text("🎯", fontSize = 10.sp)
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = "${assignment.maxScore} Poin",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // ── MAIN CONTENT: ICON + TITLE + CLASS ──────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Icon Box
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    cardAccent.copy(alpha = 0.18f),
                                    cardAccent.copy(alpha = 0.08f)
                                )
                            )
                        )
                        .border(1.dp, cardAccent.copy(alpha = 0.25f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.AutoMirrored.Filled.Assignment,
                        contentDescription = null,
                        tint = cardAccent,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(Modifier.width(14.dp))

                // Title and details
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isOverdue) NeonError else TextPrimary,
                        maxLines = 2,
                        lineHeight = 20.sp,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (!assignment.className.isNullOrBlank() && assignment.subjectName != null) {
                        Spacer(Modifier.height(3.dp))
                        Text(
                            text = assignment.className!!,
                            fontSize = 11.sp,
                            color = TextTertiary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = TextTertiary,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(Modifier.height(14.dp))

            // ── BOTTOM ROW: DUE DATE BADGE & STATUS ─────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(CosmicDark)
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = when {
                            isOverdue -> NeonError
                            dueInfo != null -> dueInfo.color
                            else -> TextTertiary
                        },
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = dueInfo?.label ?: "Tanpa batas waktu",
                        fontSize = 11.sp,
                        fontWeight = if (isOverdue || dueInfo != null) FontWeight.Bold else FontWeight.Medium,
                        color = when {
                            isOverdue -> NeonError
                            dueInfo != null -> dueInfo.color
                            else -> TextTertiary
                        }
                    )
                }

                // Submission Status text
                val statusText = when {
                    isCompleted -> "Terkumpul"
                    isOverdue -> "Terlambat"
                    else -> "Belum Dikumpul"
                }
                val statusColor = when {
                    isCompleted -> NeonSuccess
                    isOverdue -> NeonError
                    else -> TextTertiary
                }
                Text(
                    text = statusText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = statusColor
                )
            }
        }
    }
}

@Composable
private fun EmptyAssignmentState(selectedTab: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(24.dp))
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(StudentNeon.copy(alpha = 0.12f))
                    .border(1.dp, StudentNeon.copy(alpha = 0.25f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (selectedTab == "Selesai") "🏆" else "🎉",
                    fontSize = 28.sp
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = when (selectedTab) {
                    "Segera" -> "Tidak Ada Tugas Mendesak"
                    "Aktif" -> "Semua Tugas Aktif Selesai"
                    "Selesai" -> "Belum Ada Tugas Selesai"
                    else -> "Semua Tugas Beres!"
                },
                fontSize = 16.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Text(
                text = when (selectedTab) {
                    "Segera" -> "Bagus! Kamu tidak memiliki tugas dengan tenggat dekat."
                    "Selesai" -> "Tugas yang sudah kamu kumpulkan akan muncul di sini."
                    else -> "Tidak ada penugasan baru. Waktunya istirahat atau pelajari materi berikutnya!"
                },
                fontSize = 12.sp,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = 18.sp
            )
        }
    }
}