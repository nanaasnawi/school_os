package com.schoolos.android.feature.learning

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*

@Composable
fun LearningMaterialListScreen(
    onBack: () -> Unit = {},
    onMaterialClick: (String) -> Unit = {},
    onCreateMaterial: () -> Unit = {},
    subjectId: String = "",
    viewModel: LearningViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val materials = state.materials
    val role = state.userRole.lowercase()
    val isTeacher = role in listOf("teacher", "guru")

    val categories = if (isTeacher) {
        listOf("Semua", "IPAS", "Matematika") // Teachers distribute — no personal-progress filters
    } else {
        listOf("Semua", "IPAS", "Matematika", "Belum Selesai", "Selesai")
    }

    Scaffold(
        containerColor = CosmicBlack,
        floatingActionButton = {
            if (isTeacher) {
                ExtendedFloatingActionButton(
                    onClick = onCreateMaterial,
                    containerColor = TeacherNeon,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    icon = { Icon(Icons.Default.Add, null) },
                    text = { Text("Buat Materi", fontWeight = FontWeight.Bold) }
                )
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 30.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ── HEADER ────────────────────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CustomBackButton(onClick = onBack)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                "Modul Pembelajaran",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = TextPrimary,
                                letterSpacing = (-0.3).sp
                            )
                        }
                    }

                    if (isTeacher) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(TeacherNeon.copy(alpha = 0.12f))
                                .border(1.dp, TeacherNeon.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                .clickable(onClick = onCreateMaterial)
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Add, null, tint = TeacherNeon, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Tambah", color = TeacherNeon, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ── ACTIVE SUBJECT FILTER (from session detail) ──────────────────
            if (state.subjectFilter != null) {
                item {
                    SubjectFilterChip(
                        subject = state.subjectFilter!!,
                        onClear = viewModel::clearSubjectFilter,
                    )
                }
            }

            // ── PROGRESS MOTIVATION BANNER (For Students) ────────────────────
            if (!isTeacher && state.totalMaterials > 0) {
                item {
                    val progressFraction = if (state.totalMaterials > 0) {
                        state.totalCompleted.toFloat() / state.totalMaterials.toFloat()
                    } else 0f
                    val animatedProgress by animateFloatAsState(targetValue = progressFraction, label = "prog")

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        NeonBlue.copy(alpha = 0.08f),
                                        StudentNeon.copy(alpha = 0.08f)
                                    )
                                )
                            )
                            .border(1.dp, NeonBlue.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(NeonBlue.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.AutoAwesome, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
                                    }
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        "Progres Modul Belajar",
                                        color = TextPrimary,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (progressFraction >= 1f) NeonSuccess.copy(alpha = 0.15f) else NeonBlue.copy(alpha = 0.15f))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        "${state.totalCompleted}/${state.totalMaterials} Selesai (${(progressFraction * 100).toInt()}%)",
                                        color = if (progressFraction >= 1f) NeonSuccess else NeonBlue,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }

                            Spacer(Modifier.height(10.dp))

                            // Custom Rounded Progress Track
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(CosmicDark)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(animatedProgress)
                                        .fillMaxHeight()
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(
                                            Brush.horizontalGradient(
                                                listOf(NeonBlue, if (progressFraction >= 1f) NeonSuccess else StudentNeon)
                                            )
                                        )
                                )
                            }
                        }
                    }
                }
            }

            // ── SEARCH BAR ──────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(CosmicNavy)
                        .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                        .padding(horizontal = 14.dp, vertical = 11.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Search, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(10.dp))
                        BasicTextField(
                            value = state.searchQuery,
                            onValueChange = { viewModel.onSearchQueryChanged(it) },
                            modifier = Modifier.weight(1f),
                            textStyle = TextStyle(color = TextPrimary, fontSize = 14.sp),
                            singleLine = true,
                            decorationBox = { innerTextField ->
                                if (state.searchQuery.isEmpty()) {
                                    Text("Cari judul materi atau topik...", color = TextTertiary, fontSize = 14.sp)
                                }
                                innerTextField()
                            }
                        )
                        if (state.searchQuery.isNotEmpty()) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Hapus",
                                tint = TextTertiary,
                                modifier = Modifier
                                    .size(18.dp)
                                    .clickable { viewModel.onSearchQueryChanged("") }
                            )
                        }
                    }
                }
            }

            // ── CATEGORY FILTER CHIPS ────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = state.selectedCategory == cat
                        val chipBg = if (isSelected) NeonBlue else CosmicNavy
                        val chipTextColor = if (isSelected) Color.White else TextSecondary
                        val chipBorder = if (isSelected) NeonBlue else GlassBorder

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(chipBg)
                                .border(1.dp, chipBorder, RoundedCornerShape(10.dp))
                                .clickable { viewModel.onCategorySelected(cat) }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(
                                text = cat,
                                color = chipTextColor,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── LOADING STATE ────────────────────────────────────────────────
            if (state.isLoading) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = NeonBlue, modifier = Modifier.size(32.dp))
                    }
                }
            }

            // ── EMPTY STATE ──────────────────────────────────────────────────
            if (!state.isLoading && materials.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                            .padding(36.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📚", fontSize = 44.sp)
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "Materi Tidak Ditemukan",
                                color = TextPrimary,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                if (state.searchQuery.isNotEmpty()) "Coba kata kunci pencarian yang lain" else "Belum ada materi ajar pada kategori ini",
                                color = TextTertiary,
                                fontSize = 12.sp,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }

            // ── MATERIAL CARDS ───────────────────────────────────────────────
            items(materials) { item ->
                ModernMaterialCard(item = item, isTeacher = isTeacher, onClick = { onMaterialClick(item.id) })
            }
        }
    }
}

@Composable
private fun ModernMaterialCard(item: MaterialItem, isTeacher: Boolean = false, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(CosmicNavy)
            .border(1.dp, if (item.isCompleted) NeonSuccess.copy(alpha = 0.35f) else GlassBorder, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Top Row: Subject Pill + Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Subject Tag
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(item.color.copy(alpha = 0.12f))
                        .border(1.dp, item.color.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = item.subject,
                        color = item.color,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Status Badge (role-aware)
                if (isTeacher) {
                    // Teachers see how many students completed — not personal progress
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(TeacherNeon.copy(alpha = 0.14f))
                            .border(1.dp, TeacherNeon.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.People, null, tint = TeacherNeon, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("${item.completedCount} siswa selesai", color = TeacherNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else if (item.isCompleted) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonSuccess.copy(alpha = 0.14f))
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, null, tint = NeonSuccess, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Selesai", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(CosmicDark)
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                            Spacer(Modifier.width(2.dp))
                            Text("Belum Selesai", color = TextTertiary, fontSize = 8.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // Title
            Text(
                text = item.title,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp,
                color = TextPrimary,
                lineHeight = 21.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            // Description preview if available
            val descExcerpt = item.description?.replace(" • ", " - ")
            if (!descExcerpt.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = descExcerpt,
                    color = TextSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(Modifier.height(14.dp))

            // Bottom Meta Row: Format Chip + Reading Time + Action Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Format Chip
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(CosmicDark)
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Icon(
                            imageVector = when (item.type) {
                                "VIDEO" -> Icons.Default.PlayCircleOutline
                                else -> Icons.Default.Description
                            },
                            contentDescription = null,
                            tint = item.color,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = if (item.type == "VIDEO") "Video Pelajaran" else "Modul PDF",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    // Reading / Watch Time
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "⏱️ ${item.readTimeMinutes} mnt baca",
                            color = TextTertiary,
                            fontSize = 11.sp
                        )
                    }
                }

                // Action Pill
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(if (item.isCompleted) NeonSuccess.copy(alpha = 0.12f) else NeonBlue.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Buka",
                        tint = if (item.isCompleted) NeonSuccess else NeonBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // Bottom progress bar (if completed show 100% green bar)
            if (item.isCompleted) {
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .clip(RoundedCornerShape(1.5.dp))
                        .background(NeonSuccess)
                )
            }
        }
    }
}
