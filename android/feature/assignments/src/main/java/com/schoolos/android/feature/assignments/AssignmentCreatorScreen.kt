package com.schoolos.android.feature.assignments

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Title
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.*
import java.time.Instant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentCreatorScreen(
    onBack: () -> Unit = {},
    onSuccess: () -> Unit = {},
    viewModel: AssignmentCreatorViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var maxScore by remember { mutableStateOf("100") }
    var dueDate by remember { mutableStateOf(Instant.now().plusSeconds(86400 * 7).toString()) }

    LaunchedEffect(state.success) {
        if (state.success) {
            onSuccess()
            viewModel.resetState()
        }
    }

    Scaffold(
        containerColor = CosmicBlack,
        topBar = {
            Box(modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CustomBackButton(onClick = onBack)
                    Spacer(Modifier.width(16.dp))
                    Text("Buat Tugas Baru", fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextPrimary)
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
            Spacer(Modifier.height(8.dp))

            // Title Input
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Judul Tugas") },
                placeholder = { Text("Contoh: PR Matematika - Aljabar") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Title, null, tint = NeonBlue) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
            )

            // Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Deskripsi") },
                placeholder = { Text("Jelaskan materi tugas ini...") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                leadingIcon = { Icon(Icons.Default.Description, null, tint = NeonBlue) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
            )

            // Instructions
            OutlinedTextField(
                value = instructions,
                onValueChange = { instructions = it },
                label = { Text("Petunjuk Pengerjaan") },
                placeholder = { Text("Cara siswa mengerjakan...") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Max Score
                OutlinedTextField(
                    value = maxScore,
                    onValueChange = { if (it.all { char -> char.isDigit() }) maxScore = it },
                    label = { Text("Poin Maks") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
                )

                // Due Date Placeholder
                Box(
                    modifier = Modifier
                        .weight(1.5f)
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White)
                        .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CalendarMonth, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Tenggat: 7 Hari Lagi", fontSize = 14.sp, color = TextSecondary)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { 
                    viewModel.createAssignment(title, description, instructions, maxScore.toIntOrNull() ?: 100, dueDate)
                },
                enabled = title.isNotBlank() && !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Save, null)
                    Spacer(Modifier.width(8.dp))
                    Text("PUBLIKASIKAN TUGAS", fontWeight = FontWeight.Black, fontSize = 14.sp)
                }
            }

            state.error?.let {
                Text(it, color = NeonError, fontSize = 12.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}
