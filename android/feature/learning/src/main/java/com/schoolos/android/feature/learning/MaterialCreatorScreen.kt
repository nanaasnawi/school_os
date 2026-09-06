package com.schoolos.android.feature.learning

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.SubcomposeAsyncImage
import com.schoolos.android.core.designsystem.*
import com.schoolos.android.domain.model.MaterialType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MaterialCreatorScreen(
    initialClass: String? = null,
    initialSubject: String? = null,
    onBack: () -> Unit = {},
    onSuccess: () -> Unit = {},
    viewModel: MaterialCreatorViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val state by viewModel.state.collectAsState()

    val classOptions = remember(state.availableClasses) {
        state.availableClasses.map { it.name }
    }
    val subjectOptions = remember(state.availableSubjects) {
        state.availableSubjects.map { it.name }
    }

    var selectedClass by remember { mutableStateOf(initialClass ?: "") }
    var selectedSubject by remember { mutableStateOf(initialSubject ?: "") }
    var isClassMenuExpanded by remember { mutableStateOf(false) }
    var isSubjectMenuExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(classOptions) {
        if (selectedClass.isEmpty() && classOptions.isNotEmpty()) {
            selectedClass = classOptions.first()
        }
    }

    LaunchedEffect(subjectOptions) {
        if (selectedSubject.isEmpty() && subjectOptions.isNotEmpty()) {
            selectedSubject = subjectOptions.first()
        }
    }

    var selectedType by remember { mutableStateOf(MaterialType.DOCUMENT) }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var contentBody by remember { mutableStateOf("") }
    var mediaUrl by remember { mutableStateOf("") }
    var showPreview by remember { mutableStateOf(false) }

    LaunchedEffect(state.success) {
        if (state.success) {
            Toast.makeText(context, "✓ Materi ajar berhasil diterbitkan ke siswa!", Toast.LENGTH_SHORT).show()
            onSuccess()
            viewModel.resetState()
        }
    }

    Scaffold(
        containerColor = CosmicBlack,
        topBar = {
            Surface(
                color = CosmicNavy,
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .border(1.dp, GlassBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder, CircleShape)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali", tint = Color.White)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text("Studio Materi Guru", fontSize = 17.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                        Text("Publikasikan Modul Digital ke Kelas", fontSize = 11.sp, color = NeonBlue)
                    }
                }
            }
        },
        bottomBar = {
            Surface(
                color = CosmicNavy,
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .border(1.dp, GlassBorder, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { showPreview = !showPreview },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(48.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonBlue),
                        border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.linearGradient(listOf(NeonBlue, NeonBlue)))
                    ) {
                        Icon(
                            if (showPreview) Icons.Default.Edit else Icons.Default.Visibility,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(if (showPreview) "Tutup Preview" else "Preview Siswa", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                Toast.makeText(context, "Judul materi tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            val fullDesc = "$selectedSubject • $selectedClass • $description"
                            val targetClassId = state.availableClasses.find { it.name == selectedClass }?.id ?: selectedClass
                            viewModel.createMaterial(
                                title = title.trim(),
                                description = fullDesc.trim(),
                                materialType = selectedType,
                                mediaUrl = mediaUrl.trim().ifBlank { null },
                                contentBody = if (selectedType == MaterialType.ARTICLE) contentBody.trim() else null,
                                subject = selectedSubject,
                                classId = targetClassId
                            )
                        },
                        enabled = title.isNotBlank() && !state.isLoading,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1.3f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Terbitkan Materi", fontWeight = FontWeight.Black, fontSize = 13.sp)
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
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(Modifier.height(4.dp))

            // ── LIVE STUDENT FEED PREVIEW CARD ──
            AnimatedVisibility(visible = showPreview) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    shape = RoundedCornerShape(14.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(NeonBlue, GlassBorder))),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(NeonBlue.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("Preview Modul di HP Siswa", color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Text("• In-App Reader", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Text(
                            text = title.ifBlank { "Judul Modul Materi Pembelajaran" },
                            color = TextPrimary,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )

                        Text(
                            text = description.ifBlank { "Deskripsi pengantar dan capaian kompetensi materi..." },
                            color = TextSecondary,
                            fontSize = 12.sp
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(CosmicBlack)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(selectedSubject, color = TextTertiary, fontSize = 10.sp)
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(CosmicBlack)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(selectedType.name, color = NeonBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ── SECTION 1: PILIHAN FORMAT MATERI ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Pilih Format Modul Pembelajaran *", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            Triple(MaterialType.DOCUMENT, "Dokumen PDF", "📑"),
                            Triple(MaterialType.VIDEO, "Video Ajar", "🎥"),
                            Triple(MaterialType.IMAGE, "Infografis", "🖼️"),
                            Triple(MaterialType.ARTICLE, "Artikel Digital", "📝")
                        ).forEach { (type, label, icon) ->
                            val isSelected = selectedType == type
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSelected) NeonBlue.copy(alpha = 0.15f) else CosmicBlack)
                                    .border(
                                        1.dp,
                                        if (isSelected) NeonBlue else GlassBorder,
                                        RoundedCornerShape(12.dp)
                                    )
                                    .clickable { selectedType = type }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(icon, fontSize = 22.sp)
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        label,
                                        color = if (isSelected) NeonBlue else TextTertiary,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ── SECTION 2: SASARAN ROMBEL & MAPEL ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Sasaran Rombel & Mata Pelajaran", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)

                    // Rombel Dropdown
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedClass,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Rombel Target *") },
                            trailingIcon = {
                                IconButton(onClick = { isClassMenuExpanded = true }) {
                                    Icon(Icons.Default.ArrowDropDown, null, tint = NeonBlue)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().clickable { isClassMenuExpanded = true },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonBlue,
                                unfocusedBorderColor = GlassBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )
                        DropdownMenu(
                            expanded = isClassMenuExpanded,
                            onDismissRequest = { isClassMenuExpanded = false },
                            modifier = Modifier.background(CosmicNavy).border(1.dp, GlassBorder)
                        ) {
                            classOptions.forEach { cls ->
                                DropdownMenuItem(
                                    text = { Text(cls, color = if (cls == selectedClass) NeonBlue else TextPrimary, fontWeight = if (cls == selectedClass) FontWeight.Bold else FontWeight.Normal) },
                                    onClick = {
                                        selectedClass = cls
                                        isClassMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Mapel Dropdown
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedSubject,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Mata Pelajaran *") },
                            trailingIcon = {
                                IconButton(onClick = { isSubjectMenuExpanded = true }) {
                                    Icon(Icons.Default.ArrowDropDown, null, tint = NeonBlue)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().clickable { isSubjectMenuExpanded = true },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonBlue,
                                unfocusedBorderColor = GlassBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )
                        DropdownMenu(
                            expanded = isSubjectMenuExpanded,
                            onDismissRequest = { isSubjectMenuExpanded = false },
                            modifier = Modifier.background(CosmicNavy).border(1.dp, GlassBorder)
                        ) {
                            subjectOptions.forEach { sub ->
                                DropdownMenuItem(
                                    text = { Text(sub, color = if (sub == selectedSubject) NeonBlue else TextPrimary, fontWeight = if (sub == selectedSubject) FontWeight.Bold else FontWeight.Normal) },
                                    onClick = {
                                        selectedSubject = sub
                                        isSubjectMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // ── SECTION 3: KONTEN SESUAI FORMAT ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Konten & Tautan Materi", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)

                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Judul Materi / Modul *") },
                        placeholder = { Text("Contoh: Bab 1: Eksperimen Gaya & Gerak Sains") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Deskripsi & Tujuan Pembelajaran") },
                        placeholder = { Text("Uraian singkat materi untuk panduan siswa...") },
                        modifier = Modifier.fillMaxWidth().height(90.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )

                    when (selectedType) {
                        MaterialType.DOCUMENT -> {
                            OutlinedTextField(
                                value = mediaUrl,
                                onValueChange = { mediaUrl = it },
                                label = { Text("Tautan Dokumen PDF (URL / File Cloud) *") },
                                placeholder = { Text("https://contoh.com/modul-ajar.pdf") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonBlue,
                                    unfocusedBorderColor = GlassBorder,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary
                                )
                            )
                        }
                        MaterialType.VIDEO -> {
                            OutlinedTextField(
                                value = mediaUrl,
                                onValueChange = { mediaUrl = it },
                                label = { Text("Tautan Video (YouTube / MP4) *") },
                                placeholder = { Text("https://www.youtube.com/watch?v=kKKM8Y-u7ds") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonBlue,
                                    unfocusedBorderColor = GlassBorder,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary
                                )
                            )
                        }
                        MaterialType.IMAGE -> {
                            OutlinedTextField(
                                value = mediaUrl,
                                onValueChange = { mediaUrl = it },
                                label = { Text("Tautan Gambar / Infografis (URL) *") },
                                placeholder = { Text("https://images.unsplash.com/photo-...") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonBlue,
                                    unfocusedBorderColor = GlassBorder,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary
                                )
                            )

                            if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(160.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(CosmicBlack)
                                ) {
                                    SubcomposeAsyncImage(
                                        model = mediaUrl,
                                        contentDescription = "Preview",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                            }
                        }
                        MaterialType.ARTICLE -> {
                            OutlinedTextField(
                                value = contentBody,
                                onValueChange = { contentBody = it },
                                label = { Text("Isi Teks Artikel Pembelajaran *") },
                                placeholder = { Text("Tuliskan naskah materi lengkap di sini...") },
                                modifier = Modifier.fillMaxWidth().height(160.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonBlue,
                                    unfocusedBorderColor = GlassBorder,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary
                                )
                            )
                        }
                    }
                }
            }

            if (!state.error.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(NeonError.copy(alpha = 0.15f))
                        .padding(12.dp)
                ) {
                    Text(state.error!!, color = NeonError, fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(30.dp))
        }
    }
}
