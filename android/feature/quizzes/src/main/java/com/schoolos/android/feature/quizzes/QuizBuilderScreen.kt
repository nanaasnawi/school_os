package com.schoolos.android.feature.quizzes

import android.widget.Toast
import androidx.compose.animation.AnimatedContent
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

@Composable
fun QuizBuilderScreen(
    onBack: () -> Unit = {},
    onFinish: () -> Unit = {},
    viewModel: QuizBuilderViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

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
                        Text(
                            text = if (state.currentStep == 1) "Konfigurasi Kuis CBT" else "Bank Soal & Kunci Jawaban",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            text = if (state.currentStep == 1) "Langkah 1 dari 2: Pengaturan Evaluasi" else "Langkah 2 dari 2: Penyusunan Butir Soal",
                            fontSize = 11.sp,
                            color = if (state.currentStep == 1) NeonBlue else NeonSuccess
                        )
                    }
                }
            }
        }
    ) { padding ->
        AnimatedContent(
            targetState = state.currentStep,
            label = "quiz_step",
            modifier = Modifier.padding(padding)
        ) { step ->
            if (step == 1) {
                QuizInfoForm(viewModel)
            } else {
                QuizQuestionForm(viewModel, onFinish)
            }
        }
    }
}

@Composable
private fun QuizInfoForm(viewModel: QuizBuilderViewModel) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    val classOptions = remember(state.availableClasses) {
        state.availableClasses.map { it.name }
    }
    val subjectOptions = remember(state.availableSubjects) {
        state.availableSubjects.map { it.name }
    }

    var selectedClass by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf("") }
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
    var desc by remember { mutableStateOf("") }
    var selectedDuration by remember { mutableStateOf(30) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // SASARAN ROMBEL & MAPEL
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(14.dp),
            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Sasaran Evaluasi & Rombel", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)

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

        // JUDUL & PETUNJUK
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(14.dp),
            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Identitas & Instruksi CBT", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Judul Kuis CBT *") },
                    placeholder = { Text("Contoh: Kuis CBT: Pengukuran Besaran Pokok") },
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
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Petunjuk Pengerjaan Peserta") },
                    placeholder = { Text("Pilih jawaban yang paling tepat. Nilai kelulusan KKM adalah 70.") },
                    modifier = Modifier.fillMaxWidth().height(90.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonBlue,
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                // Durasi Pilihan Chips
                Text("Durasi Ujian (Menit):", color = TextSecondary, fontSize = 12.sp)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(15, 30, 45, 60, 90).forEach { mins ->
                        val isSelected = selectedDuration == mins
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) NeonBlue else CosmicBlack)
                                .border(1.dp, if (isSelected) NeonBlue else GlassBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedDuration = mins }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "$mins m",
                                color = if (isSelected) Color.White else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
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

        Button(
            onClick = {
                if (title.isBlank()) {
                    Toast.makeText(context, "Judul kuis tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                    return@Button
                }
                val fullTitle = if (title.startsWith(selectedSubject)) title else "$selectedSubject: $title"
                val fullDesc = "$selectedSubject • $selectedClass • $desc"
                val targetClassId = state.availableClasses.find { it.name == selectedClass }?.id ?: selectedClass
                viewModel.createQuiz(
                    title = fullTitle.trim(),
                    description = fullDesc.trim(),
                    timeLimit = selectedDuration,
                    passingScore = 70,
                    maxScore = 100,
                    classId = targetClassId
                )
            },
            enabled = title.isNotBlank() && !state.isLoading,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            } else {
                Text("LANJUT KE BANK SOAL", fontWeight = FontWeight.Black)
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Default.ChevronRight, null)
            }
        }

        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun QuizQuestionForm(viewModel: QuizBuilderViewModel, onFinish: () -> Unit) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    var questionType by remember { mutableStateOf("MULTIPLE_CHOICE") } // MULTIPLE_CHOICE or ESSAY
    var questionNumber by remember { mutableStateOf(state.questionsList.size + 1) }
    var qText by remember { mutableStateOf("") }
    var rubricText by remember { mutableStateOf("") }
    var points by remember { mutableStateOf("20") }
    var correctOptionIndex by remember { mutableStateOf(0) }
    val options = remember { mutableStateListOf("Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // QUESTION LIST PROGRESS / CHIPS (SOAL YANG SUDAH TERSUSUN)
        if (state.questionsList.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Daftar Soal Tersusun (${state.questionsList.size} Butir):",
                            color = TextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(NeonBlue.copy(alpha = 0.2f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                "Total: ${state.totalPoints} Poin",
                                color = NeonBlue,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    androidx.compose.foundation.lazy.LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.questionsList.size) { idx ->
                            val q = state.questionsList[idx]
                            val isPg = q.type == "MULTIPLE_CHOICE"
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isPg) NeonBlue.copy(alpha = 0.15f) else NeonSuccess.copy(alpha = 0.15f))
                                    .border(1.dp, if (isPg) NeonBlue.copy(alpha = 0.5f) else NeonSuccess.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    "#${q.number} ${if (isPg) "PG" else "Esai"} (${q.points}p)",
                                    color = if (isPg) NeonBlue else NeonSuccess,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // QUESTION NUMBER & POINTS HEADER
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(NeonSuccess.copy(alpha = 0.2f))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    "Butir Soal Ke-${state.questionsList.size + 1}",
                    color = NeonSuccess,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Bobot Poin:", color = TextSecondary, fontSize = 12.sp)
                Spacer(Modifier.width(6.dp))
                OutlinedTextField(
                    value = points,
                    onValueChange = { points = it },
                    modifier = Modifier.width(68.dp).height(46.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonSuccess,
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            }
        }

        // QUICK PRESET POINTS
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Preset Poin:", color = TextTertiary, fontSize = 11.sp)
            listOf("5", "10", "15", "20", "25").forEach { p ->
                val isPSelected = points == p
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (isPSelected) NeonSuccess.copy(alpha = 0.25f) else CosmicNavy)
                        .border(1.dp, if (isPSelected) NeonSuccess else GlassBorder, RoundedCornerShape(6.dp))
                        .clickable { points = p }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        "$p pts",
                        color = if (isPSelected) NeonSuccess else TextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // FORMAT SOAL TOGGLE: PILIHAN GANDA VS BUKAN PILIHAN GANDA (ESAI)
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(12.dp),
            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Format Butir Soal:", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Pilihan Ganda Button
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (questionType == "MULTIPLE_CHOICE") NeonBlue else CosmicBlack)
                            .border(1.dp, if (questionType == "MULTIPLE_CHOICE") NeonBlue else GlassBorder, RoundedCornerShape(10.dp))
                            .clickable { questionType = "MULTIPLE_CHOICE" }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "🔘 Pilihan Ganda (PG)",
                                color = if (questionType == "MULTIPLE_CHOICE") Color.White else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    // Bukan Pilihan Ganda / Esai Button
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (questionType == "ESSAY") NeonSuccess else CosmicBlack)
                            .border(1.dp, if (questionType == "ESSAY") NeonSuccess else GlassBorder, RoundedCornerShape(10.dp))
                            .clickable { questionType = "ESSAY" }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "📝 Soal Esai / Uraian",
                                color = if (questionType == "ESSAY") Color.White else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }
            }
        }

        // QUESTION TEXT
        OutlinedTextField(
            value = qText,
            onValueChange = { qText = it },
            label = { Text(if (questionType == "MULTIPLE_CHOICE") "Teks Soal Pilihan Ganda *" else "Teks Soal Bukan Pilihan Ganda (Esai) *") },
            placeholder = { Text("Tuliskan narasi pertanyaan atau soal kuis di sini...") },
            modifier = Modifier.fillMaxWidth().height(120.dp),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = if (questionType == "MULTIPLE_CHOICE") NeonBlue else NeonSuccess,
                unfocusedBorderColor = GlassBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            )
        )

        // CONDITIONAL FORM: PILIHAN GANDA (OPTIONS) VS ESAI (RUBRIK/KUNCI JAWABAN ACUAN)
        if (questionType == "MULTIPLE_CHOICE") {
            // OPTIONS WITH RADIO BUTTON CORRECT ANSWER SELECTOR
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "Pilihan Jawaban (Pilih Radio Button untuk KUNCI JAWABAN BENAR):",
                        color = NeonBlue,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )

                    options.forEachIndexed { index, option ->
                        val isCorrect = correctOptionIndex == index
                        val letter = ('A' + index).toString()

                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isCorrect) NeonSuccess.copy(alpha = 0.15f) else CosmicBlack
                            ),
                            shape = RoundedCornerShape(10.dp),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = Brush.linearGradient(
                                    if (isCorrect) listOf(NeonSuccess, NeonSuccess) else listOf(GlassBorder, GlassBorder)
                                )
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = isCorrect,
                                    onClick = { correctOptionIndex = index },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = NeonSuccess,
                                        unselectedColor = TextTertiary
                                    )
                                )

                                Text(
                                    text = "$letter.",
                                    color = if (isCorrect) NeonSuccess else TextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(end = 8.dp)
                                )

                                OutlinedTextField(
                                    value = option,
                                    onValueChange = { options[index] = it },
                                    placeholder = { Text("Teks pilihan $letter") },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = if (isCorrect) NeonSuccess else NeonBlue,
                                        unfocusedBorderColor = Color.Transparent,
                                        focusedTextColor = TextPrimary,
                                        unfocusedTextColor = TextPrimary
                                    )
                                )

                                if (options.size > 2) {
                                    IconButton(
                                        onClick = {
                                            options.removeAt(index)
                                            if (correctOptionIndex >= options.size) {
                                                correctOptionIndex = 0
                                            }
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Hapus", tint = TextTertiary, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }

                    if (options.size < 5) {
                        TextButton(
                            onClick = { options.add("Pilihan " + ('A' + options.size)) },
                            colors = ButtonDefaults.textButtonColors(contentColor = NeonBlue)
                        ) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("+ Tambah Pilihan Jawaban (${'A' + options.size})", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            // FORMAT BUKAN PILIHAN GANDA (ESAI / URAIAN)
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GlassBorder, GlassBorder))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, null, tint = NeonSuccess, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "Informasi Soal Esai / Uraian Siswa:",
                            color = NeonSuccess,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        "Pada CBT Android siswa, soal format ini akan menyediakan lembar input teks uraian berformat luas agar siswa dapat menuliskan jawaban bebas, penjabaran rumus, atau argumentasi.",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )

                    OutlinedTextField(
                        value = rubricText,
                        onValueChange = { rubricText = it },
                        label = { Text("Kunci / Pedoman Penilaian Guru (Opsional)") },
                        placeholder = { Text("Contoh: Poin penuh jika siswa menyebutkan 3 prinsip utama dan memberikan contoh konkrit...") },
                        modifier = Modifier.fillMaxWidth().height(100.dp),
                        shape = RoundedCornerShape(10.dp),
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

        // ACTION BUTTONS
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(
                onClick = {
                    if (qText.isBlank()) {
                        Toast.makeText(context, "Teks soal tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                        return@OutlinedButton
                    }
                    val fullNarrative = if (questionType == "ESSAY" && rubricText.isNotBlank()) {
                        "${qText.trim()}\n\n[Rubrik Penilaian: ${rubricText.trim()}]"
                    } else {
                        qText.trim()
                    }

                    viewModel.addQuestion(
                        questionText = fullNarrative,
                        questionType = questionType,
                        choices = if (questionType == "MULTIPLE_CHOICE") options.toList() else emptyList(),
                        correctIndex = correctOptionIndex,
                        points = points.toIntOrNull() ?: 10,
                        onSuccessCallback = {
                            val savedNum = state.questionsList.size
                            Toast.makeText(context, "✓ Soal ke-$savedNum (${if (questionType == "MULTIPLE_CHOICE") "PG" else "Esai"}) tersimpan!", Toast.LENGTH_SHORT).show()
                            qText = ""
                            rubricText = ""
                            correctOptionIndex = 0
                            options.indices.forEach { options[it] = "Pilihan " + ('A' + it) }
                        }
                    )
                },
                enabled = qText.isNotBlank() && !state.isLoading,
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonBlue),
                border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.linearGradient(listOf(NeonBlue, NeonBlue)))
            ) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(4.dp))
                Text("SIMPAN & SOAL BARU", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = {
                    if (qText.isNotBlank()) {
                        val fullNarrative = if (questionType == "ESSAY" && rubricText.isNotBlank()) {
                            "${qText.trim()}\n\n[Rubrik Penilaian: ${rubricText.trim()}]"
                        } else {
                            qText.trim()
                        }
                        viewModel.addQuestion(
                            questionText = fullNarrative,
                            questionType = questionType,
                            choices = if (questionType == "MULTIPLE_CHOICE") options.toList() else emptyList(),
                            correctIndex = correctOptionIndex,
                            points = points.toIntOrNull() ?: 10,
                            onSuccessCallback = {
                                Toast.makeText(context, "✓ Kuis CBT berhasil diterbitkan ke siswa!", Toast.LENGTH_SHORT).show()
                                onFinish()
                            }
                        )
                    } else {
                        Toast.makeText(context, "✓ Kuis CBT selesai dibuat!", Toast.LENGTH_SHORT).show()
                        onFinish()
                    }
                },
                enabled = !state.isLoading,
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonSuccess)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Icon(Icons.Default.Check, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("SELESAI & TERBITKAN", fontSize = 11.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}
