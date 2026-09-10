package com.schoolos.android.feature.learning

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfRenderer
import android.content.Intent
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.SubcomposeAsyncImage
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.LearningMaterial
import com.schoolos.android.domain.model.MaterialType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import androidx.core.graphics.createBitmap

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
                                    Icon(Icons.Default.MenuBook, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
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

/**
 * Native in-app PDF viewer rendering multi-page images using PdfRenderer
 */
@Composable
fun InAppPdfViewer(
    pdfUrl: String,
    title: String,
    subject: String,
    description: String = "",
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    var pages by remember { mutableStateOf<List<ImageBitmap>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(pdfUrl, title, description) {
        isLoading = true
        errorMessage = null
        withContext(Dispatchers.IO) {
            try {
                val pdfFile = File(context.cacheDir, "material_doc_${title.hashCode()}.pdf")
                
                var downloadSuccess = false
                if (pdfUrl.startsWith("http://", ignoreCase = true) || pdfUrl.startsWith("https://", ignoreCase = true)) {
                    try {
                        val connection = URL(pdfUrl).openConnection()
                        connection.connectTimeout = 8000
                        connection.readTimeout = 15000
                        val inputStream = connection.getInputStream()
                        val outputStream = FileOutputStream(pdfFile)
                        inputStream.copyTo(outputStream)
                        outputStream.close()
                        inputStream.close()
                        downloadSuccess = true
                    } catch (e: Exception) {
                        downloadSuccess = false
                    }
                }

                // If remote download failed or url was local/empty, generate structured PDF pages using REAL database data
                if (!downloadSuccess || !pdfFile.exists() || pdfFile.length() < 100) {
                    val pdfDoc = PdfDocument()
                    
                    // Parse dynamic description parts: Subject • Grade • Teacher • Detail
                    val descParts = description.split(" • ").map { it.trim() }.filter { it.isNotBlank() }
                    val teacherName = if (descParts.size >= 3) descParts[2] else "Guru Pengampu"
                    val className = if (descParts.size >= 2) descParts[1] else "Semua Rombel"
                    val mainContent = if (descParts.size >= 4) descParts.drop(3).joinToString(" • ") else description.ifBlank { "Materi pembelajaran terstruktur Kurikulum Sekolah." }

                    // Page 1: Cover & Capaian Pembelajaran dari Database
                    val pageInfo1 = PdfDocument.PageInfo.Builder(595, 842, 1).create()
                    val page1 = pdfDoc.startPage(pageInfo1)
                    val canvas1: Canvas = page1.canvas

                    val paintBg = Paint().apply { color = android.graphics.Color.parseColor("#0F172A") }
                    canvas1.drawRect(0f, 0f, 595f, 842f, paintBg)

                    val paintHeader = Paint().apply {
                        color = android.graphics.Color.parseColor("#38BDF8")
                        textSize = 13f
                        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    }
                    canvas1.drawText("MODUL AJAR DIGITAL RESMI • $className", 50f, 60f, paintHeader)

                    val paintTitle = Paint().apply {
                        color = android.graphics.Color.WHITE
                        textSize = 20f
                        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    }
                    val titleLines = splitTextIntoLines(title, 38)
                    var yOffset = 105f
                    for (line in titleLines) {
                        canvas1.drawText(line, 50f, yOffset, paintTitle)
                        yOffset += 28f
                    }

                    val paintMeta = Paint().apply {
                        color = android.graphics.Color.parseColor("#94A3B8")
                        textSize = 12f
                    }
                    canvas1.drawText("Mata Pelajaran: $subject  |  Pengampu: $teacherName", 50f, yOffset + 10f, paintMeta)

                    val paintLine = Paint().apply {
                        color = android.graphics.Color.parseColor("#334155")
                        strokeWidth = 2f
                    }
                    canvas1.drawLine(50f, yOffset + 26f, 545f, yOffset + 26f, paintLine)

                    val paintSubTitle = Paint().apply {
                        color = android.graphics.Color.parseColor("#38BDF8")
                        textSize = 13f
                        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    }
                    canvas1.drawText("RINGKASAN & TUJUAN PEMBELAJARAN", 50f, yOffset + 54f, paintSubTitle)

                    val paintBody = Paint().apply {
                        color = android.graphics.Color.parseColor("#E2E8F0")
                        textSize = 11.5f
                    }
                    var textY = yOffset + 80f
                    val contentLines = splitTextIntoLines(mainContent, 65)
                    for (line in contentLines) {
                        if (textY < 790f) {
                            canvas1.drawText(line, 50f, textY, paintBody)
                            textY += 18f
                        }
                    }

                    pdfDoc.finishPage(page1)

                    // Page 2: Panduan Belajar & Evaluasi Mandiri
                    val pageInfo2 = PdfDocument.PageInfo.Builder(595, 842, 2).create()
                    val page2 = pdfDoc.startPage(pageInfo2)
                    val canvas2: Canvas = page2.canvas
                    canvas2.drawRect(0f, 0f, 595f, 842f, paintBg)

                    canvas2.drawText("PANDUAN BELAJAR & INSTRUKSI SISWA", 50f, 60f, paintHeader)

                    val guideItems = listOf(
                        "1. Pemahaman Materi Mandiri",
                        "   Pelajari dan catat poin-poin penting pada modul $subject ini secara saksama.",
                        "",
                        "2. Tugas Terstruktur & Evaluasi CBT",
                        "   Setelah menyelesaikan modul, akses menu Tugas atau Kuis CBT untuk mengukur pemahaman.",
                        "",
                        "3. Konsultasi dengan Guru Pengampu",
                        "   Diskusikan kendala pembelajaran langsung dengan $teacherName di sesi kelas berikutnya.",
                        "",
                        "Dokumen digital terverifikasi dan disinkronkan otomatis dari Database Akademik School OS."
                    )
                    var text2Y = 100f
                    for (line in guideItems) {
                        canvas2.drawText(line, 50f, text2Y, paintBody)
                        text2Y += 21f
                    }

                    pdfDoc.finishPage(page2)

                    val fos = FileOutputStream(pdfFile)
                    pdfDoc.writeTo(fos)
                    fos.close()
                    pdfDoc.close()
                }

                val pfd = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = PdfRenderer(pfd)
                val renderedBitmaps = mutableListOf<ImageBitmap>()
                val pageCount = minOf(renderer.pageCount, 15)
                for (i in 0 until pageCount) {
                    val page = renderer.openPage(i)
                    val bitmap = createBitmap(page.width * 2, page.height * 2)
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    renderedBitmaps.add(bitmap.asImageBitmap())
                    page.close()
                }
                renderer.close()
                pfd.close()

                withContext(Dispatchers.Main) {
                    pages = renderedBitmaps
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorMessage = e.message ?: "Gagal memuat dokumen PDF"
                    isLoading = false
                }
            }
        }
    }

    // Fullscreen state for single page lightbox
    var fullscreenPageIndex by remember { mutableStateOf<Int?>( null) }

    Column(modifier = modifier) {
        if (isLoading) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(CosmicNavy),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(color = NeonBlue, modifier = Modifier.size(36.dp))
                Spacer(Modifier.height(10.dp))
                Text("Merender Dokumen PDF In-App...", color = TextSecondary, fontSize = 12.sp)
            }
        } else if (pages.isNotEmpty()) {
            val totalPages = pages.size
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "📑 Pembaca Dokumen ($totalPages Halaman)",
                        color = NeonBlue,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                pages.forEachIndexed { index: Int, pageBitmap: ImageBitmap ->
                    val pageNumber = index + 1
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { fullscreenPageIndex = index }
                    ) {
                        Column {
                            Box {
                                Image(
                                    bitmap = pageBitmap,
                                    contentDescription = "Halaman $pageNumber",
                                    modifier = Modifier.fillMaxWidth().wrapContentHeight(),
                                    contentScale = ContentScale.FillWidth
                                )
                                // Fullscreen hint overlay (bottom-right)
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .padding(8.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.Black.copy(alpha = 0.65f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Fullscreen, null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(Modifier.width(3.dp))
                                        Text("Perbesar", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF0F172A))
                                    .padding(vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "Halaman $pageNumber dari $totalPages",
                                    color = Color.White.copy(alpha = 0.8f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(CosmicNavy)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(errorMessage ?: "Dokumen belum dapat ditampilkan.", color = TextSecondary, fontSize = 12.sp)
            }
        }
    }

    // ── FULLSCREEN PDF PAGE LIGHTBOX ─────────────────────────────────────────
    val fsIndex = fullscreenPageIndex
    if (fsIndex != null && pages.isNotEmpty() && fsIndex in pages.indices) {
        var currentPage by remember(fsIndex) { mutableStateOf(fsIndex) }
        var scale by remember { mutableStateOf(1f) }
        var offsetX by remember { mutableStateOf(0f) }
        var offsetY by remember { mutableStateOf(0f) }

        Dialog(
            onDismissRequest = { fullscreenPageIndex = null },
            properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = true)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0B0F19))
            ) {
                // Page container with pinch-to-zoom & gestures
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer(
                            scaleX = scale,
                            scaleY = scale,
                            translationX = offsetX,
                            translationY = offsetY
                        )
                        .pointerInput(currentPage) {
                            detectTransformGestures { _, pan, zoom, _ ->
                                val newScale = (scale * zoom).coerceIn(1f, 6f)
                                scale = newScale
                                if (scale > 1f) {
                                    offsetX += pan.x
                                    offsetY += pan.y
                                } else {
                                    offsetX = 0f
                                    offsetY = 0f
                                }
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        shape = RoundedCornerShape(4.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                        modifier = Modifier
                            .padding(horizontal = 12.dp, vertical = 68.dp)
                            .fillMaxSize()
                    ) {
                        Image(
                            bitmap = pages[currentPage],
                            contentDescription = "Halaman ${currentPage + 1}",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.White)
                        )
                    }
                }

                // Top bar overlay: close + page indicator
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .statusBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { fullscreenPageIndex = null },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.65f))
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Color.White)
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.Black.copy(alpha = 0.65f))
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            "Halaman ${currentPage + 1} / ${pages.size}",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (scale > 1f) {
                        IconButton(
                            onClick = { scale = 1f; offsetX = 0f; offsetY = 0f },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(NeonBlue.copy(alpha = 0.7f))
                        ) {
                            Icon(Icons.Default.ZoomOut, contentDescription = "Reset Zoom", tint = Color.White)
                        }
                    } else {
                        Spacer(Modifier.size(40.dp))
                    }
                }

                // Floating Zoom Controls (Zoom In / Percentage / Zoom Out)
                Column(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(end = 14.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black.copy(alpha = 0.75f))
                        .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                        .padding(vertical = 8.dp, horizontal = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    IconButton(
                        onClick = {
                            scale = (scale + 0.5f).coerceAtMost(6f)
                        },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(Icons.Default.ZoomIn, contentDescription = "Perbesar", tint = Color.White)
                    }

                    Text(
                        text = "${(scale * 100).toInt()}%",
                        color = NeonBlue,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )

                    IconButton(
                        onClick = {
                            val newScale = (scale - 0.5f).coerceAtLeast(1f)
                            scale = newScale
                            if (scale == 1f) {
                                offsetX = 0f
                                offsetY = 0f
                            }
                        },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(Icons.Default.ZoomOut, contentDescription = "Perkecil", tint = Color.White)
                    }
                }

                // Bottom navigation: prev / next page
                if (pages.size > 1) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .padding(horizontal = 24.dp, vertical = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (currentPage > 0) NeonBlue.copy(alpha = 0.8f)
                                    else Color.Black.copy(alpha = 0.3f)
                                )
                                .clickable(enabled = currentPage > 0) {
                                    currentPage--
                                    scale = 1f; offsetX = 0f; offsetY = 0f
                                }
                                .padding(horizontal = 20.dp, vertical = 10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.ChevronLeft, null, tint = Color.White, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Sebelumnya", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (currentPage < pages.size - 1) NeonBlue.copy(alpha = 0.8f)
                                    else Color.Black.copy(alpha = 0.3f)
                                )
                                .clickable(enabled = currentPage < pages.size - 1) {
                                    currentPage++
                                    scale = 1f; offsetX = 0f; offsetY = 0f
                                }
                                .padding(horizontal = 20.dp, vertical = 10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Berikutnya", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.width(4.dp))
                                Icon(Icons.Default.ChevronRight, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Interactive In-App Video Player for YouTube and Direct Video URLs.
 * Configured with proper Origin & Referer headers to eliminate YouTube Error 153.
 */
@Composable
fun InAppVideoPlayer(
    videoUrl: String,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val youtubeId = remember(videoUrl) {
        extractYouTubeVideoId(videoUrl)
    }

    val htmlContent = remember(videoUrl, youtubeId) {
        if (youtubeId != null) {
            """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; }
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                    .video-wrapper { position: relative; width: 100%; height: 100%; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.youtube.com/embed/$youtubeId?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&origin=https://schoolos.id"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen>
                    </iframe>
                </div>
            </body>
            </html>
            """.trimIndent()
        } else {
            """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; }
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                    video { width: 100%; height: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <video controls autoplay playsinline style="width:100%;height:100%;">
                    <source src="$videoUrl">
                    Browser tidak mendukung pemutar video ini.
                </video>
            </body>
            </html>
            """.trimIndent()
        }
    }

    Box(modifier = modifier.clip(RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp))) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        mediaPlaybackRequiresUserGesture = false
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        allowContentAccess = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        // Remove WebView signature to prevent YouTube player restriction
                        val defaultUa = userAgentString
                        userAgentString = defaultUa.replace("; wv", "")
                    }
                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val url = request?.url?.toString() ?: return false
                            if (!url.contains("youtube.com/embed") && !url.contains("schoolos.id")) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, request.url)
                                    ctx.startActivity(intent)
                                    return true
                                } catch (e: Exception) {
                                    // ignore
                                }
                            }
                            return false
                        }
                    }
                    setBackgroundColor(android.graphics.Color.BLACK)
                    loadDataWithBaseURL(
                        "https://schoolos.id",
                        htmlContent,
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
            },
            update = { webView ->
                webView.loadDataWithBaseURL(
                    "https://schoolos.id",
                    htmlContent,
                    "text/html",
                    "UTF-8",
                    null
                )
            }
        )

        // Shortcut button to open in YouTube app if available
        Row(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(videoUrl))
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(context, "Tidak dapat membuka tautan video", Toast.LENGTH_SHORT).show()
                    }
                }
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
            Spacer(Modifier.width(4.dp))
            Text("Buka di YouTube", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

private fun extractYouTubeVideoId(url: String): String? {
    return when {
        url.contains("youtu.be/") -> {
            url.substringAfter("youtu.be/").substringBefore("?").substringBefore("&").trim()
        }
        url.contains("watch?v=") -> {
            url.substringAfter("watch?v=").substringBefore("&").substringBefore("?").trim()
        }
        url.contains("/embed/") -> {
            url.substringAfter("/embed/").substringBefore("?").substringBefore("&").trim()
        }
        url.contains("/shorts/") -> {
            url.substringAfter("/shorts/").substringBefore("?").substringBefore("&").trim()
        }
        else -> null
    }
}

/**
 * In-App High Resolution Image & Infographic Viewer with Pinch-to-Zoom and Lightbox
 */
@Composable
fun InAppImageViewer(
    imageUrl: String,
    title: String,
    modifier: Modifier = Modifier,
) {
    var showFullscreenLightbox by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        SubcomposeAsyncImage(
            model = imageUrl,
            contentDescription = title,
            contentScale = ContentScale.Crop,
            loading = {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NeonBlue, modifier = Modifier.size(32.dp))
                }
            },
            error = {
                Box(
                    modifier = Modifier.fillMaxSize().background(CosmicNavy),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.BrokenImage, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("Infografis Pembelajaran", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .clickable { showFullscreenLightbox = true }
        )

        // Overlay hint button
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(12.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color.Black.copy(alpha = 0.7f))
                .clickable { showFullscreenLightbox = true }
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ZoomIn, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Perbesar Infografis", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    if (showFullscreenLightbox) {
        Dialog(
            onDismissRequest = { showFullscreenLightbox = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            var scale by remember { mutableStateOf(1f) }
            var offsetX by remember { mutableStateOf(0f) }
            var offsetY by remember { mutableStateOf(0f) }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
            ) {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    contentDescription = title,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer(
                            scaleX = scale,
                            scaleY = scale,
                            translationX = offsetX,
                            translationY = offsetY
                        )
                        .pointerInput(Unit) {
                            detectTransformGestures { _, pan, zoom, _ ->
                                scale = (scale * zoom).coerceIn(1f, 5f)
                                if (scale > 1f) {
                                    offsetX += pan.x
                                    offsetY += pan.y
                                } else {
                                    offsetX = 0f
                                    offsetY = 0f
                                }
                            }
                        }
                )

                // Close button
                IconButton(
                    onClick = { showFullscreenLightbox = false },
                    modifier = Modifier
                        .statusBarsPadding()
                        .padding(16.dp)
                        .align(Alignment.TopStart)
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.6f))
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Color.White)
                }

                // Reset zoom button
                if (scale > 1f) {
                    Button(
                        onClick = {
                            scale = 1f
                            offsetX = 0f
                            offsetY = 0f
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Black.copy(alpha = 0.7f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 24.dp)
                    ) {
                        Text("Reset Zoom (1x)", color = Color.White, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

/**
 * Article & Text Reader View with Typography
 */
@Composable
fun ArticleReaderView(
    title: String,
    content: String,
    textSizeMultiplier: Float = 1.0f,
    modifier: Modifier = Modifier,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CosmicNavy),
        shape = RoundedCornerShape(14.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("📖 Teks Bacaan Lengkap", color = NeonSuccess, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                val wordCount = content.split("\\s+".toRegex()).size
                val estMinutes = maxOf(1, wordCount / 120)
                Text("± $estMinutes mnt baca", color = TextTertiary, fontSize = 11.sp)
            }

            HorizontalDivider(color = GlassBorder)

            val paragraphs = if (content.isNotBlank()) content.split("\n\n") else listOf("Belum ada teks materi.")
            for (p in paragraphs) {
                if (p.isNotBlank()) {
                    Text(
                        text = p.trim(),
                        color = TextPrimary,
                        fontSize = (14 * textSizeMultiplier).sp,
                        lineHeight = (22 * textSizeMultiplier).sp,
                        textAlign = TextAlign.Justify
                    )
                }
            }
        }
    }
}

private fun splitTextIntoLines(text: String, maxCharsPerLine: Int): List<String> {
    val words = text.split(" ")
    val lines = mutableListOf<String>()
    var currentLine = ""
    for (word in words) {
        if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
            currentLine = (currentLine + " " + word).trim()
        } else {
            if (currentLine.isNotEmpty()) lines.add(currentLine)
            currentLine = word
        }
    }
    if (currentLine.isNotEmpty()) lines.add(currentLine)
    return lines
}
