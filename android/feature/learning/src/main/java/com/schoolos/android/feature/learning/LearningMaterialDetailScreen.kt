package com.schoolos.android.feature.learning

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningMaterial
import com.schoolos.android.domain.model.MaterialType
import com.schoolos.android.feature.learning.components.*

@Composable
fun LearningMaterialDetailScreen(
    materialId: String,
    onBack: () -> Unit = {},
    onCreateMaterial: () -> Unit = {},
    onAskTeacher: ((materialTitle: String, materialId: String, subjectName: String) -> Unit)? = null,
    viewModel: LearningViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    LaunchedEffect(materialId) {
        viewModel.loadMaterialDetail(materialId)
    }

    val materialState by viewModel.selectedMaterial.collectAsState()
    if (materialState == null) {
        Scaffold(
            containerColor = CosmicBlack,
            topBar = {
                Surface(
                    color = CosmicNavy,
                    modifier = Modifier.fillMaxWidth().border(1.dp, GlassBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CustomBackButton(onClick = onBack)
                        Spacer(Modifier.width(12.dp))
                        Text(
                            text = "Memuat Modul...",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                }
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                LoadingState()
            }
        }
        return
    }

    val material = materialState!!
    val isCompleted = material.isCompleted

    // Role-aware UX: teachers distribute materials, students consume them
    val learningState by viewModel.state.collectAsState()
    val isTeacher = learningState.userRole.lowercase() in listOf("teacher", "guru")

    var textSizeMultiplier by remember { mutableStateOf(1.0f) }

    Scaffold(
        containerColor = CosmicBlack,
        topBar = {
            Surface(
                color = CosmicNavy,
                modifier = Modifier.fillMaxWidth().border(1.dp, GlassBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CustomBackButton(onClick = onBack)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Isi Modul Pembelajaran",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = material.subject,
                                fontSize = 11.sp,
                                color = TextTertiary
                            )
                        }
                    }

                    // Font Size Adjuster
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(CosmicDark)
                                .clickable { if (textSizeMultiplier > 0.85f) textSizeMultiplier -= 0.15f }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("A-", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(NeonBlue.copy(alpha = 0.15f))
                                .clickable { if (textSizeMultiplier < 1.4f) textSizeMultiplier += 0.15f }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("A+", color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        },
        bottomBar = {
            Surface(
                color = CosmicNavy,
                tonalElevation = 10.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .border(1.dp, GlassBorder, RoundedCornerShape(topStart = 50.dp, topEnd = 20.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isTeacher) {
                        // ── TEACHER: distribution panel (no student "mark as done" UX) ──
                        Column {
                            Text("Status Distribusi", color = TextTertiary, fontSize = 11.sp)
                            Spacer(Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(TeacherNeon)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    "${material.completedCount} siswa menyelesaikan",
                                    color = TeacherNeon,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        }

                        Button(
                            onClick = onCreateMaterial,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = TeacherNeon,
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.height(44.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "Buat Materi",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    } else {
                        // ── STUDENT: learning progress + mark-as-done ──
                        Column {
                            Text("Status Pembelajaran", color = TextTertiary, fontSize = 11.sp)
                            Spacer(Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(if (isCompleted) NeonSuccess else NeonBlue)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    if (isCompleted) "✓ Selesai Dipelajari" else "Sedang Dipelajari",
                                    color = if (isCompleted) NeonSuccess else NeonBlue,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        }

                        Button(
                            onClick = {
                                viewModel.toggleMaterialCompletion(material.id)
                                Toast.makeText(
                                    context,
                                    if (!isCompleted) "✓ Materi ditandai selesai! Progres berhasil diperbarui." else "Status materi diperbarui menjadi sedang dipelajari.",
                                    Toast.LENGTH_SHORT
                                ).show()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isCompleted) NeonSuccess.copy(alpha = 0.18f) else NeonBlue,
                                contentColor = if (isCompleted) NeonSuccess else Color.White
                            ),
                            border = if (isCompleted) androidx.compose.foundation.BorderStroke(1.dp, NeonSuccess.copy(alpha = 0.4f)) else null,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.height(44.dp)
                        ) {
                            Icon(
                                imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.DoneAll,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = if (isCompleted) "Selesai (Batal)" else "Tandai Selesai",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            val mediaUrl = material.mediaUrl

            // ── VIDEO OR IMAGE HERO VIEWER ──────────────────────────────────
            if (material.materialType == MaterialType.VIDEO) {
                Box(modifier = Modifier.fillMaxWidth().background(Color.Black)) {
                    if (!mediaUrl.isNullOrBlank()) {
                        InAppVideoPlayer(
                            videoUrl = mediaUrl,
                            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(190.dp)
                                .clip(RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp))
                                .background(CosmicNavy),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.PlayCircleOutline, contentDescription = null, tint = NeonBlue, modifier = Modifier.size(44.dp))
                                Spacer(Modifier.height(8.dp))
                                Text("Tautan video pembelajaran belum disematkan oleh pengampu.", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            } else if (material.materialType == MaterialType.IMAGE) {
                Box(modifier = Modifier.fillMaxWidth().background(CosmicNavy)) {
                    InAppImageViewer(
                        imageUrl = mediaUrl ?: material.thumbnailUrl ?: "",
                        title = material.title,
                        modifier = Modifier.fillMaxWidth().height(260.dp)
                    )
                }
            }

            // ── MAIN CONTENT CONTAINER ──────────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Spacer(Modifier.height(2.dp))
                // ── HERO MATERIAL OVERVIEW CARD ─────────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(CosmicNavy)
                        .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
                        .padding(18.dp)
                ) {
                    Column {
                        // Top Meta Badges
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NeonBlue.copy(alpha = 0.12f))
                                        .padding(horizontal = 9.dp, vertical = 4.dp)
                                ) {
                                    Text(material.subject, color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(CosmicDark)
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        when (material.materialType) {
                                            MaterialType.DOCUMENT -> "PDF"
                                            MaterialType.VIDEO -> "Video"
                                            MaterialType.ARTICLE -> "Artikel"
                                            else -> "Gambar"
                                        },
                                        color = TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }

                            if (isCompleted) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NeonSuccess.copy(alpha = 0.14f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("✓ Selesai", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // Material Title
                        Text(
                            text = material.title,
                            fontSize = (18 * textSizeMultiplier).sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary,
                            lineHeight = (25 * textSizeMultiplier).sp
                        )

                        Spacer(Modifier.height(14.dp))

                        // Divider
                        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(GlassBorder))

                        Spacer(Modifier.height(12.dp))

                        // Teacher & Class Pill Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val descParts = (material.description ?: "").split(" • ")
                                val teacherName = if (descParts.size >= 3 && descParts[2].isNotBlank()) descParts[2] else "Guru Pengampu"
                                val className = if (descParts.size >= 2 && descParts[1].isNotBlank()) descParts[1] else "Semua Rombel"

                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(TeacherNeon.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.School, null, tint = TeacherNeon, modifier = Modifier.size(20.dp))
                                }
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(teacherName, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Spacer(Modifier.width(4.dp))
                                        Icon(Icons.Default.Verified, null, tint = NeonBlue, modifier = Modifier.size(14.dp))
                                    }
                                    Text("Pengampu • $className", color = TextTertiary, fontSize = 11.sp)
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                if (material.completedCount > 0) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(NeonBlue.copy(alpha = 0.15f))
                                            .border(1.dp, NeonBlue.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text("👥 ${material.completedCount} Siswa Belajar", color = NeonBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NeonSuccess.copy(alpha = 0.1f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("Modul Aktif", color = NeonSuccess, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // ── TANYA GURU / KONSULTASI MATERI (In-App Q&A) ──────────────
                if (!isTeacher && onAskTeacher != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(TeacherNeon.copy(alpha = 0.08f))
                            .border(1.dp, TeacherNeon.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                            .clickable { onAskTeacher(material.title, material.id, material.subject) }
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
                                        text = "Ada Bagian yang Belum Dipahami?",
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

                // ── RINGKASAN & TUJUAN PEMBELAJARAN (Structured) ───────────
                val matDesc = material.description
                if (!matDesc.isNullOrBlank()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
                            .padding(18.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NeonBlue.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.AutoMirrored.Filled.MenuBook, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
                                }
                                Spacer(Modifier.width(10.dp))
                                Text(
                                    "Capaian & Tujuan Pembelajaran",
                                    color = TextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(Modifier.height(12.dp))

                            val parts = matDesc.split(" • ").filter { it.isNotBlank() }
                            parts.forEach { part ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .padding(top = 4.dp)
                                            .size(7.dp)
                                            .clip(CircleShape)
                                            .background(NeonBlue)
                                    )
                                    Spacer(Modifier.width(10.dp))
                                    Text(
                                        text = part.trim(),
                                        color = TextSecondary,
                                        fontSize = (13 * textSizeMultiplier).sp,
                                        lineHeight = (19 * textSizeMultiplier).sp
                                    )
                                }
                            }
                        }
                    }
                }

                // ── IN-APP DOCUMENT VIEWER ───────────────────────────────────
                if (material.materialType == MaterialType.DOCUMENT) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
                            .padding(16.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Description, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Dokumen Materi Ajar", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(CosmicDark)
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("HD Multi-Page", color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }

                            Spacer(Modifier.height(14.dp))

                            InAppPdfViewer(
                                pdfUrl = mediaUrl ?: "",
                                title = material.title,
                                subject = material.subject,
                                description = material.description ?: "",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // ── ARTICLE TEXT READER ──────────────────────────────────────
                if (material.materialType == MaterialType.ARTICLE) {
                    ArticleReaderView(
                        title = material.title,
                        content = material.contentBody ?: material.description ?: "",
                        textSizeMultiplier = textSizeMultiplier
                    )
                }

                Spacer(Modifier.height(30.dp))
            }
        }
    }
}

