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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import java.time.Instant
import java.time.temporal.ChronoUnit

private val IndigoGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF4338CA), Color(0xFF2563EB), Color(0xFF0891B2))
)
private val IndigoPrimary  = Color(0xFF4338CA)
private val IndigoAccent   = Color(0xFF2563EB)

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
    var submissionType by remember { mutableStateOf("ONLINE_TEXT") }
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
            // Hero Header — flat bottom, indigo-blue gradient
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(IndigoGradient)
                    .statusBarsPadding()
            ) {
                // Decorative circles
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .offset(x = 250.dp, y = (-40).dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.07f))
                )
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .offset(x = 280.dp, y = 20.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
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
                    Column {
                        Text(
                            "Studio Penugasan Guru",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            letterSpacing = (-0.3).sp
                        )
                        Text(
                            "Rancang & Terbitkan Tugas Siswa",
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.8f),
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Assignment,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        },
        bottomBar = {
            Surface(
                color = CosmicNavy,
                shadowElevation = 12.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { showPreview = !showPreview },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f).height(50.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = IndigoPrimary),
                        border = ButtonDefaults.outlinedButtonBorder().copy(
                            brush = Brush.linearGradient(listOf(IndigoPrimary, IndigoAccent))
                        )
                    ) {
                        Icon(
                            if (showPreview) Icons.Default.Edit else Icons.Default.Visibility,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            if (showPreview) "Tutup Preview" else "Preview Siswa",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
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
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1.4f).height(50.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = IndigoPrimary
                        )
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp)
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
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            Spacer(Modifier.height(16.dp))

            // ── LIVE STUDENT PREVIEW CARD ──
            AnimatedVisibility(visible = showPreview) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                    shape = RoundedCornerShape(0.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.linearGradient(
                                    listOf(IndigoPrimary.copy(alpha = 0.08f), IndigoAccent.copy(alpha = 0.04f))
                                )
                            )
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(IndigoAccent))
                                    Text("Tampilan di HP Siswa", color = IndigoAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                AssignmentChip("Tenggat: $selectedDueDays Hari", NeonWarning)
                            }
                            Text(
                                text = title.ifBlank { "Judul Tugas Anda Akan Muncul Di Sini" },
                                color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black
                            )
                            Text(
                                text = description.ifBlank { "Deskripsi dan panduan ringkas pengerjaan tugas oleh guru..." },
                                color = TextSecondary, fontSize = 12.sp, lineHeight = 17.sp
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                AssignmentChip(selectedSubject, IndigoPrimary)
                                AssignmentChip(selectedClass, IndigoAccent)
                                AssignmentChip("Maks $maxScore Poin", NeonSuccess)
                            }
                        }
                    }
                }
            }

            // ── SECTION 1: SASARAN & ROMBEL ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AssignmentSectionHeader(
                        number = 1,
                        title = "Sasaran & Rombel Belajar",
                        subtitle = "Tentukan kelas dan mata pelajaran",
                        numberColor = IndigoPrimary
                    )

                    AssignmentDropdown(
                        value = selectedClass,
                        label = "Rombel Target",
                        icon = Icons.Default.Group,
                        expanded = isClassMenuExpanded,
                        accentColor = IndigoPrimary,
                        onExpand = { isClassMenuExpanded = true },
                        onDismiss = { isClassMenuExpanded = false },
                        options = classOptions,
                        onSelect = { selectedClass = it }
                    )

                    AssignmentDropdown(
                        value = selectedSubject,
                        label = "Mata Pelajaran",
                        icon = Icons.Default.School,
                        expanded = isSubjectMenuExpanded,
                        accentColor = IndigoPrimary,
                        onExpand = { isSubjectMenuExpanded = true },
                        onDismiss = { isSubjectMenuExpanded = false },
                        options = subjectOptions,
                        onSelect = { selectedSubject = it }
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            // ── SECTION 2: KONTEN & PANDUAN ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AssignmentSectionHeader(
                        number = 2,
                        title = "Konten & Panduan Tugas",
                        subtitle = "Tulis judul, deskripsi, dan instruksi detail",
                        numberColor = IndigoAccent
                    )

                    AssignmentTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = "Judul Tugas *",
                        placeholder = "Contoh: Praktik Uji Kandungan Nutrisi Makanan",
                        icon = Icons.Default.Title,
                        accentColor = IndigoPrimary
                    )

                    AssignmentTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = "Deskripsi / Latar Belakang Tugas",
                        placeholder = "Uraian singkat tujuan dan cakupan tugas...",
                        icon = Icons.Default.Notes,
                        accentColor = IndigoPrimary,
                        minHeight = 90.dp
                    )

                    AssignmentTextField(
                        value = instructions,
                        onValueChange = { instructions = it },
                        label = "Instruksi Langkah Pengerjaan",
                        placeholder = "1. Amati benda di sekitar...\n2. Catat dalam tabel...\n3. Buat kesimpulan.",
                        icon = Icons.Default.FormatListNumbered,
                        accentColor = IndigoPrimary,
                        minHeight = 110.dp
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            // ── SECTION 3: PENGUMPULAN & BATAS WAKTU ──
            Card(
                colors = CardDefaults.cardColors(containerColor = CosmicNavy),
                shape = RoundedCornerShape(0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    AssignmentSectionHeader(
                        number = 3,
                        title = "Pengumpulan & Batas Waktu",
                        subtitle = "Atur deadline dan nilai maksimal",
                        numberColor = NeonWarning
                    )

                    // Deadline presets
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            "Batas Waktu Pengumpulan:",
                            color = TextSecondary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            listOf(
                                1 to "+1 Hari",
                                3 to "+3 Hari",
                                7 to "+1 Minggu",
                                14 to "+2 Minggu"
                            ).forEach { (days, label) ->
                                val isSelected = selectedDueDays == days
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isSelected)
                                                Brush.linearGradient(listOf(IndigoPrimary, IndigoAccent))
                                            else
                                                Brush.linearGradient(listOf(CosmicBlack, CosmicBlack))
                                        )
                                        .border(
                                            width = if (isSelected) 0.dp else 1.5.dp,
                                            color = if (isSelected) Color.Transparent else GlassBorder,
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .clickable { selectedDueDays = days }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        label,
                                        color = if (isSelected) Color.White else TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // Score presets
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            "Nilai Maksimal:",
                            color = TextSecondary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            listOf("100", "80", "50").forEach { score ->
                                val isSelected = maxScore == score
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(
                                            if (isSelected) NeonSuccess.copy(alpha = 0.15f)
                                            else CosmicBlack
                                        )
                                        .border(
                                            1.5.dp,
                                            if (isSelected) NeonSuccess else GlassBorder,
                                            RoundedCornerShape(10.dp)
                                        )
                                        .clickable { maxScore = score }
                                        .padding(horizontal = 16.dp, vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        score,
                                        color = if (isSelected) NeonSuccess else TextSecondary,
                                        fontSize = 13.sp,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium
                                    )
                                }
                            }

                            Spacer(Modifier.weight(1f))

                            OutlinedTextField(
                                value = maxScore,
                                onValueChange = { maxScore = it },
                                label = { Text("Custom", fontSize = 11.sp) },
                                modifier = Modifier.width(90.dp).height(54.dp),
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

                    // KKM info
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonWarning.copy(alpha = 0.08f))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Info, null, tint = NeonWarning, modifier = Modifier.size(16.dp))
                        Text("KKM Kelulusan: 75 Poin", color = NeonWarning, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // Error Display
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
                        Text(state.error!!, color = NeonError, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(Modifier.height(30.dp))
        }
    }
}

// ─── Assignment-Screen-local components ─────────────────────────────────────

@Composable
private fun AssignmentChip(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(text, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun AssignmentSectionHeader(number: Int, title: String, subtitle: String, numberColor: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(CircleShape)
                .background(numberColor),
            contentAlignment = Alignment.Center
        ) {
            Text(number.toString(), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
        }
        Column {
            Text(title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Text(subtitle, color = TextTertiary, fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AssignmentDropdown(
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
private fun AssignmentTextField(
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
