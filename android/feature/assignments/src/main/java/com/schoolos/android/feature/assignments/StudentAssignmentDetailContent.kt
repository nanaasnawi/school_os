package com.schoolos.android.feature.assignments

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.GlassOverlay
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonInfo
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission
import com.schoolos.android.domain.model.LearningMaterial
import com.schoolos.android.domain.model.MaterialType

@Composable
fun StudentAssignmentDetailContent(
    assignment: Assignment,
    submission: AssignmentSubmission?,
    isParent: Boolean,
    isSubmitting: Boolean,
    content: String,
    onContentChange: (String) -> Unit,
    onOpenMaterial: (String) -> Unit,
    onSubmitClick: () -> Unit,
    childName: String = "",
    onAskTeacher: (() -> Unit)? = null,
) {
    val dueInfo = dueDateInfo(assignment.dueAt)
    val isSubmitted = submission != null && submission.status != "pending"
    val isGraded = submission?.status == "graded"
    val isLate = submission?.status == "late"

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // ── 1. STATUS OVERVIEW CARD ──────────────────────────────────────────
        AssignmentStatusCard(
            assignment = assignment,
            isSubmitted = isSubmitted,
            isGraded = isGraded,
            dueInfo = dueInfo,
            isParent = isParent,
            childName = childName,
        )

        // ── 2. TIMELINE STRIP (Due Date + Submission Time) ───────────────────
        TimelineCard(
            dueAt = assignment.dueAt,
            submission = submission,
            dueInfo = dueInfo,
        )

        // ── 3. DESCRIPTION / INSTRUKSI ───────────────────────────────────────
        if (assignment.instructions?.isNotBlank() == true) {
            InstructionsCard(instructions = assignment.instructions!!)
        }

        // ── 4. MATERIALS ─────────────────────────────────────────────────────
        if (assignment.materials.isNotEmpty()) {
            MaterialsSection(
                materials = assignment.materials,
                onOpenMaterial = onOpenMaterial
            )
        }

        // ── 4B. TANYA GURU KONSULTASI LANGSUNG (In-App Q&A) ─────────────────
        if (!isParent && onAskTeacher != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(TeacherNeon.copy(alpha = 0.08f))
                    .border(1.dp, TeacherNeon.copy(alpha = 0.28f), RoundedCornerShape(16.dp))
                    .clickable { onAskTeacher() }
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(TeacherNeon.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Forum,
                                contentDescription = null,
                                tint = TeacherNeon,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Ada Pertanyaan Seputar Tugas Ini?",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Tanya guru pengampu langsung tanpa keluar app",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(TeacherNeon)
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Tanya Guru 💬",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }
                }
            }
        }

        // ── 5. SUBMISSION PANEL ──────────────────────────────────────────────
        if (isSubmitted && submission != null) {
            SubmissionStatusCard(
                submission = submission,
                maxScore = assignment.maxScore,
                childName = childName,
            )
        } else {
            SubmissionEditor(
                isParent = isParent,
                isSubmitting = isSubmitting,
                isActive = assignment.isActive && assignment.status == "active",
                content = content,
                onContentChange = onContentChange,
                onSubmitClick = onSubmitClick,
            )
        }
    }
}

// ── STATUS OVERVIEW CARD ─────────────────────────────────────────────────────
@Composable
private fun AssignmentStatusCard(
    assignment: Assignment,
    isSubmitted: Boolean,
    isGraded: Boolean,
    dueInfo: DueInfo?,
    isParent: Boolean,
    childName: String,
) {
    val (accentColor, statusLabel) = when {
        isGraded -> Pair(NeonSuccess, "Dinilai ✓")
        isSubmitted -> Pair(NeonBlue, "Dikumpulkan ✓")
        dueInfo?.label?.contains("Terlambat") == true -> Pair(NeonError, "Terlambat!")
        dueInfo?.label?.contains("Hari ini") == true -> Pair(NeonWarning, "Hari Terakhir!")
        else -> Pair(StudentNeon, "Aktif")
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(
                width = 1.dp,
                brush = Brush.verticalGradient(
                    listOf(accentColor.copy(alpha = 0.45f), GlassBorder)
                ),
                shape = RoundedCornerShape(20.dp)
            )
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Top row: header label + status chip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(accentColor)
                    )
                    Spacer(Modifier.width(7.dp))
                    Text(
                        text = if (isParent && childName.isNotBlank()) "Tugas Anak · $childName" else "STATUS TUGAS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 0.8.sp
                    )
                }
                // Submitted status chip
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(accentColor.copy(alpha = 0.14f))
                        .border(1.dp, accentColor.copy(alpha = 0.40f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = statusLabel,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = accentColor
                    )
                }
            }

            // Assignment title
            Text(
                text = assignment.title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary,
                lineHeight = 24.sp,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )

            // Meta row: subject + class
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonBlue.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        tint = NeonBlue,
                        modifier = Modifier.size(14.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = listOfNotNull(
                        assignment.subjectName,
                        assignment.className?.let { "Kelas $it" }
                    ).joinToString(" • "),
                    fontSize = 12.sp,
                    color = TextSecondary,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }

            // Teacher row
            if (assignment.teacherName != null) {
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = TextTertiary,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(Modifier.width(5.dp))
                    Text(
                        text = "Dari: ${assignment.teacherName}",
                        fontSize = 11.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(Modifier.weight(1f))
                    // Max score chip
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(StudentNeon.copy(alpha = 0.10f))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "Skor Max: ${assignment.maxScore}",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = StudentNeon
                        )
                    }
                }
            }
        }
    }
}

// ── TIMELINE CARD (Due + Submission time) ────────────────────────────────────
@Composable
private fun TimelineCard(
    dueAt: String?,
    submission: AssignmentSubmission?,
    dueInfo: DueInfo?,
) {
    if (dueAt.isNullOrBlank() && submission == null) return

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = NeonBlue,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(Modifier.width(7.dp))
                Text(
                    "LINIMASA TUGAS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = TextTertiary,
                    letterSpacing = 0.8.sp
                )
            }

            Spacer(Modifier.height(14.dp))

            // Due date row
            if (!dueAt.isNullOrBlank() && dueInfo != null) {
                TimelineItem(
                    icon = Icons.Default.Schedule,
                    accentColor = dueInfo.color,
                    title = dueInfo.label,
                    subtitle = "Tenggat: ${formatDateShort(dueAt)}",
                    isLast = submission == null
                )
            }

            // Submission row
            if (submission != null) {
                val subColor = when (submission.status) {
                    "graded" -> NeonSuccess
                    "late" -> NeonError
                    else -> NeonBlue
                }
                val subTitle = when (submission.status) {
                    "submitted" -> "Terkirim"
                    "graded" -> "Sudah Dinilai"
                    "late" -> "Terlambat"
                    else -> "Diproses"
                }
                TimelineItem(
                    icon = if (submission.status == "graded") Icons.Default.CheckCircle else Icons.Default.Schedule,
                    accentColor = subColor,
                    title = subTitle,
                    subtitle = "Dikirim: ${formatDateShort(submission.submittedAt)}",
                    isLast = true
                )
            }
        }
    }
}

@Composable
private fun TimelineItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color,
    title: String,
    subtitle: String,
    isLast: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        // Timeline track
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.14f))
                    .border(1.dp, accentColor.copy(alpha = 0.40f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = accentColor, modifier = Modifier.size(16.dp))
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(20.dp)
                        .background(
                            Brush.verticalGradient(
                                listOf(accentColor.copy(alpha = 0.4f), GlassBorder)
                            )
                        )
                )
            }
        }

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.padding(top = 5.dp)) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Black, color = accentColor)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, fontSize = 12.sp, color = TextSecondary)
        }
    }
}

// ── INSTRUCTIONS CARD ────────────────────────────────────────────────────────
@Composable
private fun InstructionsCard(instructions: String) {
    var expanded by remember { mutableStateOf(true) }
    val chevronAngle by animateFloatAsState(
        targetValue = if (expanded) 90f else 0f,
        animationSpec = tween(200),
        label = "chevronAngle"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
    ) {
        Column {
            // Header (clickable to expand/collapse)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(9.dp))
                            .background(StudentNeon.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = null,
                            tint = StudentNeon,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(
                            "Instruksi Tugas",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            "Baca dengan cermat",
                            fontSize = 10.sp,
                            color = TextTertiary
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = TextTertiary,
                    modifier = Modifier
                        .size(18.dp)
                        .rotate(chevronAngle)
                )
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column {
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    Text(
                        text = instructions,
                        fontSize = 13.sp,
                        color = TextSecondary,
                        lineHeight = 21.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

// ── MATERIALS SECTION ────────────────────────────────────────────────────────
@Composable
private fun MaterialsSection(
    materials: List<LearningMaterial>,
    onOpenMaterial: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(NeonBlue.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.MenuBook,
                    contentDescription = null,
                    tint = NeonBlue,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(
                    "Bahan Belajar",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )
                Text(
                    "${materials.size} materi tersedia",
                    fontSize = 10.sp,
                    color = TextTertiary
                )
            }
        }

        materials.forEachIndexed { idx, material ->
            MaterialRow(
                material = material,
                index = idx + 1,
                onOpenMaterial = onOpenMaterial
            )
        }
    }
}

@Composable
private fun MaterialRow(
    material: LearningMaterial,
    index: Int,
    onOpenMaterial: (String) -> Unit,
) {
    val (matColor, matEmoji) = when (material.materialType) {
        MaterialType.VIDEO -> Pair(NeonError, "🎬")
        MaterialType.IMAGE -> Pair(NeonWarning, "🖼️")
        MaterialType.DOCUMENT -> Pair(NeonBlue, "📄")
        else -> Pair(StudentNeon, "📁")
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
            .clickable { onOpenMaterial(material.id) }
            .padding(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(matColor.copy(alpha = 0.12f))
                    .border(1.dp, matColor.copy(alpha = 0.25f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(matEmoji, fontSize = 16.sp)
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = material.title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = material.size ?: material.subject,
                    fontSize = 11.sp,
                    color = TextTertiary
                )
            }
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(matColor.copy(alpha = 0.10f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text("Buka", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = matColor)
            }
        }
    }
}

// ── SUBMISSION EDITOR ─────────────────────────────────────────────────────────
@Composable
private fun SubmissionEditor(
    isParent: Boolean,
    isSubmitting: Boolean,
    isActive: Boolean,
    content: String,
    onContentChange: (String) -> Unit,
    onSubmitClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(9.dp))
                        .background(StudentNeon.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        tint = StudentNeon,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(
                        if (isParent) "Jawaban Anak" else "Jawaban Kamu",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                    Text(
                        if (!isActive) "Tugas telah ditutup" else "Tulis & kirim sebelum tenggat",
                        fontSize = 10.sp,
                        color = TextTertiary
                    )
                }
            }

            HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

            if (!isActive) {
                // Closed state
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(CosmicBlack)
                        .border(1.dp, GlassBorder2, RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Tugas ini sudah ditutup dan tidak bisa dikirim",
                            fontSize = 12.sp,
                            color = TextTertiary,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                // Text input
                OutlinedTextField(
                    value = content,
                    onValueChange = onContentChange,
                    placeholder = {
                        Text(
                            "Tulis jawabanmu di sini dengan jelas dan lengkap sebelum dikirim...",
                            fontSize = 12.sp,
                            color = TextTertiary
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp),
                    maxLines = 6,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = StudentNeon,
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = CosmicBlack,
                        unfocusedContainerColor = CosmicBlack,
                    )
                )

                // Character count
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        "${content.length} karakter",
                        fontSize = 10.sp,
                        color = TextTertiary
                    )
                }

                // Submit button
                Button(
                    onClick = onSubmitClick,
                    enabled = content.isNotBlank() && !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = StudentNeon,
                        disabledContainerColor = GlassBorder
                    ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            color = CosmicBlack,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Mengirim...",
                            fontWeight = FontWeight.Black,
                            color = CosmicBlack,
                            fontSize = 14.sp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Kumpulkan Tugas",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}

// ── SUBMISSION STATUS CARD (after submission) ─────────────────────────────────
@Composable
private fun SubmissionStatusCard(
    submission: AssignmentSubmission,
    maxScore: Int,
    childName: String = "",
) {
    val (statusColor, statusIcon, statusTitle) = when (submission.status) {
        "graded" -> Triple(NeonSuccess, Icons.Default.CheckCircle, "Tugas Dinilai")
        "late" -> Triple(NeonError, Icons.Default.Warning, "Terlambat")
        "submitted" -> Triple(NeonBlue, Icons.Default.Schedule, "Terkirim")
        else -> Triple(NeonWarning, Icons.Default.Schedule, "Menunggu Penilaian")
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(
                width = 1.dp,
                brush = Brush.verticalGradient(
                    listOf(statusColor.copy(alpha = 0.45f), GlassBorder)
                ),
                shape = RoundedCornerShape(20.dp)
            )
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Status header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(statusColor.copy(alpha = 0.15f))
                            .border(1.dp, statusColor.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = statusIcon,
                            contentDescription = null,
                            tint = statusColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            text = statusTitle,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = statusColor
                        )
                        Text(
                            text = "Dikirim: ${formatDateShort(submission.submittedAt)}",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                }

                // Score badge (if graded)
                if (submission.status == "graded" && submission.score != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(
                                Brush.verticalGradient(
                                    listOf(NeonSuccess.copy(alpha = 0.20f), NeonSuccess.copy(alpha = 0.08f))
                                )
                            )
                            .border(1.dp, NeonSuccess.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = NeonSuccess,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(Modifier.width(3.dp))
                                Text(
                                    text = "${submission.score}",
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = NeonSuccess
                                )
                            }
                            Text(
                                text = "dari $maxScore",
                                fontSize = 10.sp,
                                color = TextTertiary,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Submitted content preview
            if (!submission.content.isNullOrBlank()) {
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                Column {
                    Text(
                        "JAWABAN YANG DIKIRIM",
                        fontSize = 10.sp,
                        color = TextTertiary,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 0.8.sp
                    )
                    Spacer(Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder2, RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = submission.content!!,
                            fontSize = 13.sp,
                            color = TextSecondary,
                            lineHeight = 20.sp
                        )
                    }
                }
            }

            // Feedback from teacher
            if (!submission.feedback.isNullOrBlank() && submission.status == "graded") {
                HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Grade,
                            contentDescription = null,
                            tint = NeonSuccess,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "CATATAN GURU",
                            fontSize = 10.sp,
                            color = NeonSuccess,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.8.sp
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(NeonSuccess.copy(alpha = 0.06f))
                            .border(1.dp, NeonSuccess.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = submission.feedback!!,
                            fontSize = 13.sp,
                            color = TextSecondary,
                            lineHeight = 20.sp
                        )
                    }
                }
            }

            // Parent child name
            if (childName.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = TextTertiary,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "Anak: $childName",
                        fontSize = 11.sp,
                        color = TextTertiary
                    )
                }
            }
        }
    }
}