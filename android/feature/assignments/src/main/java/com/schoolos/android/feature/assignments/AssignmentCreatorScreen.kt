package com.schoolos.android.feature.assignments

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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import java.time.Instant
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentCreatorScreen(
    initialClass: String? = null,
    initialSubject: String? = null,
    onBack: () -> Unit = {},
    onSuccess: () -> Unit = {},
    viewModel: AssignmentCreatorViewModel = hiltViewModel()
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

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var maxScore by remember { mutableStateOf("100") }
    var submissionType by remember { mutableStateOf("ONLINE_TEXT") } // ONLINE_TEXT, FILE_UPLOAD, LINK, PHOTO
    var selectedDueDays by remember { mutableStateOf(7) }
    var showPreview by remember { mutableStateOf(false) }

    LaunchedEffect(state.success) {
        if (state.success) {
            Toast.makeText(context, "✓ Tugas berhasil diterbitkan ke siswa!", Toast.LENGTH_SHORT).show()
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
                        Text("Studio Penugasan Guru", fontSize = 17.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                        Text("Rancang & Terbitkan Tugas Siswa", fontSize = 11.sp, color = NeonBlue)
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
                                Toast.makeText(context, "Judul tugas tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            val fullDesc = "$selectedSubject • $selectedClass • $description"
                            val calculatedDueDate = Instant.now().plus(selectedDueDays.toLong(), ChronoUnit.DAYS).toString()
                            val targetClassId = state.availableClasses.find { it.name == selectedClass }?.id ?: selectedClass
                            viewModel.createAssignment(
                                title = title.trim(),
                                description = fullDesc.trim(),
                                instructions = instructions.ifBlank { "Kerjakan tugas secara teliti dan kumpulkan sebelum batas waktu berakhir." },
                                maxScore = maxScore.toIntOrNull() ?: 100,
                                dueAt = calculatedDueDate,
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
                            Icon(Icons.Default.Publish, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Terbitkan Tugas", fontWeight = FontWeight.Black, fontSize = 13.sp)
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

            // ── LIVE STUDENT PREVIEW DRAWER (If toggled) ──
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
                                Text("Tampilan di HP Siswa", color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Text("Tenggat: $selectedDueDays Hari Lagi", color = NeonWarning, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Text(
                            text = title.ifBlank { "Judul Tugas Anda Akan Muncul Di Sini" },
                            color = TextPrimary,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )

                        Text(
                            text = description.ifBlank { "Deskripsi dan panduan ringkas pengerjaan tugas oleh guru..." },
                            color = TextSecondary,
                            fontSize = 12.sp,
                            lineHeight = 17.sp
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
                                Text(selectedClass, color = TextTertiary, fontSize = 10.sp)
                            }
                            Text("• Maks $maxScore Poin", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ── SECTION 1: SASARAN & IDENTITAS ROMBEL ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(NeonBlue.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("1", color = NeonBlue, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(Modifier.width(10.dp))
                        Text("Sasaran & Rombel Belajar", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }

                    // Rombel Target Dropdown
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

                    // Mata Pelajaran Dropdown
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

            // ── SECTION 2: KONTEN & INSTRUKSI TUGAS ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(NeonSuccess.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("2", color = NeonSuccess, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(Modifier.width(10.dp))
                        Text("Konten & Panduan Tugas", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Judul Tugas *") },
                        placeholder = { Text("Contoh: Praktik Uji Kandungan Nutrisi Makanan") },
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
                        label = { Text("Deskripsi / Latar Belakang Tugas") },
                        placeholder = { Text("Uraian singkat tujuan dan cakupan tugas...") },
                        modifier = Modifier.fillMaxWidth().height(90.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )

                    OutlinedTextField(
                        value = instructions,
                        onValueChange = { instructions = it },
                        label = { Text("Instruksi Langkah Pengerjaan Siswa") },
                        placeholder = { Text("1. Amati benda di sekitar...\n2. Catat dalam tabel...\n3. Buat kesimpulan.") },
                        modifier = Modifier.fillMaxWidth().height(110.dp),
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

            // ── SECTION 3: FORMAT PENGUMPULAN & BATAS WAKTU ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(NeonWarning.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("3", color = NeonWarning, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(Modifier.width(10.dp))
                        Text("Pengumpulan & Batas Waktu", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }

                    // Batas Waktu Presets
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Batas Waktu Pengumpulan (Deadline):", color = TextSecondary, fontSize = 12.sp)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(
                                1 to "Besok (24 Jam)",
                                3 to "3 Hari",
                                7 to "1 Minggu",
                                14 to "2 Minggu"
                            ).forEach { (days, label) ->
                                val isSelected = selectedDueDays == days
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isSelected) NeonBlue else CosmicBlack)
                                        .border(1.dp, if (isSelected) NeonBlue else GlassBorder, RoundedCornerShape(10.dp))
                                        .clickable { selectedDueDays = days }
                                        .padding(vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        label,
                                        color = if (isSelected) Color.White else TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }

                    // Nilai Maksimal & KKM
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = maxScore,
                            onValueChange = { maxScore = it },
                            label = { Text("Nilai Maksimal") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonBlue,
                                unfocusedBorderColor = GlassBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )

                        OutlinedTextField(
                            value = "75",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("KKM Kelulusan") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonSuccess,
                                unfocusedBorderColor = GlassBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )
                    }
                }
            }

            // Error Display
            if (!state.error.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(NeonError.copy(alpha = 0.15f))
                        .padding(12.dp)
                ) {
                    Text(state.error!!, color = NeonError, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(30.dp))
        }
    }
}
