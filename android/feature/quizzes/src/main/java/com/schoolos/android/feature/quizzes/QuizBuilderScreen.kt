package com.schoolos.android.feature.quizzes

import android.widget.Toast
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*

private val VioletGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF6D28D9), Color(0xFF7C3AED), Color(0xFF4338CA))
)
private val VioletPrimary = Color(0xFF7C3AED)
private val VioletAccent  = Color(0xFF6D28D9)
private val VioletSoft    = Color(0xFF8B5CF6)

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
            // Hero Header — flat bottom, royal violet gradient
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(VioletGradient)
                    .statusBarsPadding()
            ) {
                // Decorative circles
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .offset(x = 250.dp, y = (-35).dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.07f))
                )
                Box(
                    modifier = Modifier
                        .size(85.dp)
                        .offset(x = 285.dp, y = 22.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.18f))
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Kembali",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (state.currentStep == 1) "Konfigurasi Kuis CBT" else "Bank Soal & Kunci Jawaban",
                                fontSize = 19.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                letterSpacing = (-0.3).sp
                            )
                            Text(
                                text = if (state.currentStep == 1)
                                    "Langkah 1/2 — Pengaturan Evaluasi"
                                else
                                    "Langkah 2/2 — Penyusunan Butir Soal",
                                fontSize = 12.sp,
                                color = Color.White.copy(alpha = 0.8f),
                                fontWeight = FontWeight.Medium
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (state.currentStep == 1) Icons.Default.Quiz else Icons.Default.QuestionAnswer,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    // Step progress bar
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Step 1 pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(Color.White)
                        )
                        // Step 2 pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(
                                    if (state.currentStep == 2) Color.White
                                    else Color.White.copy(alpha = 0.3f)
                                )
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuizInfoForm(viewModel: QuizBuilderViewModel) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    val classOptions = remember(state.availableClasses) { state.availableClasses.map { it.name } }
    val subjectOptions = remember(state.availableSubjects) { state.availableSubjects.map { it.name } }

    var selectedClass by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf("") }
    var isClassMenuExpanded by remember { mutableStateOf(false) }
    var isSubjectMenuExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(classOptions) {
        if (selectedClass.isEmpty() && classOptions.isNotEmpty()) selectedClass = classOptions.first()
    }
    LaunchedEffect(subjectOptions) {
        if (selectedSubject.isEmpty() && subjectOptions.isNotEmpty()) selectedSubject = subjectOptions.first()
    }

    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var selectedDuration by remember { mutableStateOf(30) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        // ── SASARAN ROMBEL & MAPEL ──
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                QuizSectionHeader(
                    icon = Icons.Default.Group,
                    title = "Sasaran Evaluasi & Rombel",
                    subtitle = "Pilih kelas dan mata pelajaran yang diuji",
                    accentColor = VioletPrimary
                )

                QuizDropdown(
                    value = selectedClass,
                    label = "Rombel Target",
                    icon = Icons.Default.Group,
                    expanded = isClassMenuExpanded,
                    accentColor = VioletPrimary,
                    onExpand = { isClassMenuExpanded = true },
                    onDismiss = { isClassMenuExpanded = false },
                    options = classOptions,
                    onSelect = { selectedClass = it }
                )

                QuizDropdown(
                    value = selectedSubject,
                    label = "Mata Pelajaran",
                    icon = Icons.Default.School,
                    expanded = isSubjectMenuExpanded,
                    accentColor = VioletPrimary,
                    onExpand = { isSubjectMenuExpanded = true },
                    onDismiss = { isSubjectMenuExpanded = false },
                    options = subjectOptions,
                    onSelect = { selectedSubject = it }
                )
            }
        }

        Spacer(Modifier.height(4.dp))

        // ── IDENTITAS & INSTRUKSI CBT ──
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                QuizSectionHeader(
                    icon = Icons.Default.Quiz,
                    title = "Identitas & Instruksi CBT",
                    subtitle = "Isi judul dan petunjuk pengerjaan",
                    accentColor = VioletSoft
                )

                QuizTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = "Judul Kuis CBT *",
                    placeholder = "Contoh: Kuis CBT: Pengukuran Besaran Pokok",
                    icon = Icons.Default.Title,
                    accentColor = VioletPrimary
                )

                QuizTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = "Petunjuk Pengerjaan Peserta",
                    placeholder = "Pilih jawaban yang paling tepat. KKM = 70.",
                    icon = Icons.Default.Info,
                    accentColor = VioletPrimary,
                    minHeight = 90.dp
                )

                // Duration chips
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Durasi Ujian:",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(15, 30, 45, 60, 90).forEach { mins ->
                            val isSelected = selectedDuration == mins
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isSelected)
                                            Brush.linearGradient(listOf(VioletAccent, VioletPrimary))
                                        else
                                            Brush.linearGradient(listOf(CosmicBlack, CosmicBlack))
                                    )
                                    .border(
                                        width = if (isSelected) 0.dp else 1.5.dp,
                                        color = if (isSelected) Color.Transparent else GlassBorder,
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { selectedDuration = mins }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "${mins}m",
                                    color = if (isSelected) Color.White else TextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }

        if (!state.error.isNullOrBlank()) {
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonError.copy(alpha = 0.12f))
                    .border(1.dp, NeonError.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.ErrorOutline, null, tint = NeonError, modifier = Modifier.size(18.dp))
                    Text(state.error!!, color = NeonError, fontSize = 12.sp)
                }
            }
        }

        // ── LANJUT BUTTON ──
        Spacer(Modifier.height(16.dp))
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
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(54.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = VioletPrimary)
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp)
            } else {
                Text("LANJUT KE BANK SOAL", fontWeight = FontWeight.Black, fontSize = 14.sp, letterSpacing = 0.5.sp)
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Default.ChevronRight, null, modifier = Modifier.size(20.dp))
            }
        }

        Spacer(Modifier.height(30.dp))
    }
}

@Composable
private fun QuizQuestionForm(viewModel: QuizBuilderViewModel, onFinish: () -> Unit) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    var questionType by remember { mutableStateOf("MULTIPLE_CHOICE") }
    var qText by remember { mutableStateOf("") }
    var rubricText by remember { mutableStateOf("") }
    var points by remember { mutableStateOf("20") }
    var correctOptionIndex by remember { mutableStateOf(0) }
    val options = remember { mutableStateListOf("Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        // ── QUESTION CHIPS TRACKER ──
        if (state.questionsList.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Butir Soal Tersusun (${state.questionsList.size} Soal):",
                            color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(VioletPrimary.copy(alpha = 0.15f))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "Total: ${state.totalPoints} Poin",
                                color = VioletSoft, fontSize = 11.sp, fontWeight = FontWeight.Black
                            )
                        }
                    }

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(state.questionsList) { q ->
                            val isPg = q.type == "MULTIPLE_CHOICE"
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (isPg) VioletPrimary.copy(alpha = 0.15f)
                                        else NeonSuccess.copy(alpha = 0.15f)
                                    )
                                    .border(
                                        1.dp,
                                        if (isPg) VioletPrimary.copy(alpha = 0.5f) else NeonSuccess.copy(alpha = 0.5f),
                                        RoundedCornerShape(10.dp)
                                    )
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    "#${q.number} ${if (isPg) "PG" else "Esai"} (${q.points}p)",
                                    color = if (isPg) VioletSoft else NeonSuccess,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(4.dp))
        }

        // ── CURRENT QUESTION INFO ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(VioletPrimary.copy(alpha = 0.15f))
                    .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text(
                    "Butir Soal Ke-${state.questionsList.size + 1}",
                    color = VioletSoft,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black
                )
            }

            // Points presets inline
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                listOf("5", "10", "20", "25").forEach { p ->
                    val isP = points == p
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isP) VioletPrimary.copy(alpha = 0.2f) else CosmicNavy)
                            .border(1.dp, if (isP) VioletPrimary else GlassBorder, RoundedCornerShape(8.dp))
                            .clickable { points = p }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Text("${p}p", color = if (isP) VioletSoft else TextTertiary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // ── FORMAT SOAL TOGGLE ──
        Card(
            colors = CardDefaults.cardColors(containerColor = CosmicNavy),
            shape = RoundedCornerShape(0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Format Butir Soal:", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        "MULTIPLE_CHOICE" to "🔘  Pilihan Ganda (PG)",
                        "ESSAY" to "📝  Soal Esai / Uraian"
                    ).forEach { (type, label) ->
                        val isSelected = questionType == type
                        val color = if (type == "MULTIPLE_CHOICE") VioletPrimary else NeonSuccess
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isSelected)
                                        Brush.linearGradient(listOf(color, color.copy(alpha = 0.7f)))
                                    else
                                        Brush.linearGradient(listOf(CosmicBlack, CosmicBlack))
                                )
                                .border(
                                    width = if (isSelected) 0.dp else 1.5.dp,
                                    color = if (isSelected) Color.Transparent else GlassBorder,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable { questionType = type }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                label,
                                color = if (isSelected) Color.White else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium
                            )
                        }
                    }
                }

                // Question text
                OutlinedTextField(
                    value = qText,
                    onValueChange = { qText = it },
                    label = { Text(if (questionType == "MULTIPLE_CHOICE") "Teks Soal Pilihan Ganda *" else "Teks Soal Esai *") },
                    placeholder = { Text("Tuliskan narasi pertanyaan atau soal kuis di sini...", fontSize = 12.sp, color = TextTertiary) },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = if (questionType == "MULTIPLE_CHOICE") VioletPrimary else NeonSuccess,
                        unfocusedBorderColor = GlassBorder,
                        focusedLabelColor = if (questionType == "MULTIPLE_CHOICE") VioletPrimary else NeonSuccess,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        unfocusedLabelColor = TextTertiary
                    )
                )
            }
        }

        Spacer(Modifier.height(4.dp))

        // ── OPTIONS / RUBRIC ──
        if (questionType == "MULTIPLE_CHOICE") {
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.RadioButtonChecked, null, tint = VioletPrimary, modifier = Modifier.size(16.dp))
                        Text(
                            "Pilihan Jawaban — klik radio untuk Kunci Benar:",
                            color = VioletSoft,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    options.forEachIndexed { index, option ->
                        val isCorrect = correctOptionIndex == index
                        val letter = ('A' + index).toString()

                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isCorrect) NeonSuccess.copy(alpha = 0.1f) else CosmicBlack
                            ),
                            shape = RoundedCornerShape(12.dp),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = Brush.linearGradient(
                                    if (isCorrect) listOf(NeonSuccess, NeonSuccess.copy(alpha = 0.5f))
                                    else listOf(GlassBorder, GlassBorder)
                                )
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 4.dp, end = 8.dp, top = 4.dp, bottom = 4.dp),
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
                                // Letter badge
                                Box(
                                    modifier = Modifier
                                        .size(26.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (isCorrect) NeonSuccess
                                            else VioletPrimary.copy(alpha = 0.2f)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        letter,
                                        color = if (isCorrect) Color.White else VioletSoft,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                                Spacer(Modifier.width(8.dp))
                                OutlinedTextField(
                                    value = option,
                                    onValueChange = { options[index] = it },
                                    placeholder = { Text("Teks pilihan $letter", fontSize = 12.sp) },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = if (isCorrect) NeonSuccess else VioletPrimary,
                                        unfocusedBorderColor = Color.Transparent,
                                        focusedTextColor = TextPrimary,
                                        unfocusedTextColor = TextPrimary
                                    )
                                )
                                if (options.size > 2) {
                                    IconButton(
                                        onClick = {
                                            options.removeAt(index)
                                            if (correctOptionIndex >= options.size) correctOptionIndex = 0
                                        },
                                        modifier = Modifier.size(30.dp)
                                    ) {
                                        Icon(Icons.Default.Close, "Hapus", tint = TextTertiary, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }

                    if (options.size < 5) {
                        TextButton(
                            onClick = { options.add("Pilihan " + ('A' + options.size)) },
                            colors = ButtonDefaults.textButtonColors(contentColor = VioletPrimary)
                        ) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("+ Tambah Pilihan (${'A' + options.size})", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonSuccess.copy(alpha = 0.08f))
                            .padding(10.dp)
                    ) {
                        Icon(Icons.Default.Info, null, tint = NeonSuccess, modifier = Modifier.size(16.dp))
                        Text(
                            "Siswa akan mengetik jawaban uraian secara langsung di app.",
                            color = TextSecondary, fontSize = 11.sp
                        )
                    }

                    OutlinedTextField(
                        value = rubricText,
                        onValueChange = { rubricText = it },
                        label = { Text("Kunci / Pedoman Penilaian (Opsional)") },
                        placeholder = { Text("Contoh: Poin penuh jika siswa menyebutkan 3 prinsip utama...") },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonSuccess,
                            unfocusedBorderColor = GlassBorder,
                            focusedLabelColor = NeonSuccess,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }
            }
        }

        if (!state.error.isNullOrBlank()) {
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonError.copy(alpha = 0.12f))
                    .border(1.dp, NeonError.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Text(state.error!!, color = NeonError, fontSize = 12.sp)
            }
        }

        // ── ACTION BUTTONS ──
        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = {
                    if (qText.isBlank()) {
                        Toast.makeText(context, "Teks soal tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                        return@OutlinedButton
                    }
                    val fullNarrative = if (questionType == "ESSAY" && rubricText.isNotBlank())
                        "${qText.trim()}\n\n[Rubrik: ${rubricText.trim()}]"
                    else qText.trim()

                    viewModel.addQuestion(
                        questionText = fullNarrative,
                        questionType = questionType,
                        choices = if (questionType == "MULTIPLE_CHOICE") options.toList() else emptyList(),
                        correctIndex = correctOptionIndex,
                        points = points.toIntOrNull() ?: 10,
                        onSuccessCallback = {
                            val savedNum = state.questionsList.size
                            Toast.makeText(context, "✓ Soal ke-$savedNum tersimpan!", Toast.LENGTH_SHORT).show()
                            qText = ""
                            rubricText = ""
                            correctOptionIndex = 0
                            options.indices.forEach { options[it] = "Pilihan " + ('A' + it) }
                        }
                    )
                },
                enabled = qText.isNotBlank() && !state.isLoading,
                modifier = Modifier.weight(1f).height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = VioletPrimary),
                border = ButtonDefaults.outlinedButtonBorder().copy(
                    brush = Brush.linearGradient(listOf(VioletAccent, VioletSoft))
                )
            ) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("+ Soal Baru", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = {
                    if (qText.isNotBlank()) {
                        val fullNarrative = if (questionType == "ESSAY" && rubricText.isNotBlank())
                            "${qText.trim()}\n\n[Rubrik: ${rubricText.trim()}]"
                        else qText.trim()
                        viewModel.addQuestion(
                            questionText = fullNarrative,
                            questionType = questionType,
                            choices = if (questionType == "MULTIPLE_CHOICE") options.toList() else emptyList(),
                            correctIndex = correctOptionIndex,
                            points = points.toIntOrNull() ?: 10,
                            onSuccessCallback = {
                                Toast.makeText(context, "✓ Kuis CBT berhasil diterbitkan!", Toast.LENGTH_SHORT).show()
                                onFinish()
                            }
                        )
                    } else {
                        Toast.makeText(context, "✓ Kuis CBT selesai dibuat!", Toast.LENGTH_SHORT).show()
                        onFinish()
                    }
                },
                enabled = !state.isLoading,
                modifier = Modifier.weight(1.3f).height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonSuccess)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp)
                } else {
                    Icon(Icons.Default.Check, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Simpan & Terbitkan", fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        Spacer(Modifier.height(30.dp))
    }
}

// ─── Quiz-screen-local shared components ────────────────────────────────────

@Composable
private fun QuizSectionHeader(
    icon: ImageVector,
    title: String,
    subtitle: String,
    accentColor: Color
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(accentColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(20.dp))
        }
        Column {
            Text(title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Text(subtitle, color = TextTertiary, fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuizDropdown(
    value: String,
    label: String,
    icon: ImageVector,
    expanded: Boolean,
    accentColor: Color,
    onExpand: () -> Unit,
    onDismiss: () -> Unit,
    options: List<String>,
    onSelect: (String) -> Unit
) {
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { if (!expanded) onExpand() else onDismiss() }
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            leadingIcon = {
                Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(20.dp))
            },
            trailingIcon = {
                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
            },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = accentColor,
                unfocusedBorderColor = GlassBorder,
                focusedLabelColor = accentColor,
                focusedLeadingIconColor = accentColor,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                unfocusedLabelColor = TextTertiary
            )
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = onDismiss,
            modifier = Modifier.background(CosmicNavy)
        ) {
            options.forEach { option ->
                val isSelected = option == value
                DropdownMenuItem(
                    text = {
                        Text(
                            option,
                            color = if (isSelected) accentColor else TextPrimary,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    onClick = { onSelect(option); onDismiss() },
                    leadingIcon = if (isSelected) ({
                        Icon(Icons.Default.Check, null, tint = accentColor, modifier = Modifier.size(16.dp))
                    }) else null
                )
            }
        }
    }
}

@Composable
private fun QuizTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    icon: ImageVector,
    accentColor: Color,
    minHeight: androidx.compose.ui.unit.Dp = 56.dp
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(placeholder, fontSize = 12.sp, color = TextTertiary) },
        leadingIcon = {
            Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(20.dp))
        },
        modifier = Modifier.fillMaxWidth().heightIn(min = minHeight),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = accentColor,
            unfocusedBorderColor = GlassBorder,
            focusedLabelColor = accentColor,
            focusedLeadingIconColor = accentColor,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
            unfocusedLabelColor = TextTertiary
        )
    )
}
