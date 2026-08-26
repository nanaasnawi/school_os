package com.schoolos.android.feature.quizzes

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Quiz
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
            Box(modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CustomBackButton(onClick = onBack)
                    Spacer(Modifier.width(16.dp))
                    Text("Penyusun Kuis", fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                }
            }
        }
    ) { padding ->
        AnimatedContent(
            targetState = state.currentStep,
            label = "quizStep",
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
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var timeLimit by remember { mutableStateOf("30") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Langkah 1: Informasi Dasar", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = NeonBlue)
        
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Judul Kuis") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
        )

        OutlinedTextField(
            value = desc,
            onValueChange = { desc = it },
            label = { Text("Deskripsi Singkat") },
            modifier = Modifier.fillMaxWidth().height(100.dp),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
        )

        OutlinedTextField(
            value = timeLimit,
            onValueChange = { timeLimit = it },
            label = { Text("Durasi (Menit)") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
        )

        Spacer(Modifier.weight(1f))

        Button(
            onClick = { viewModel.createQuiz(title, desc, timeLimit.toIntOrNull(), 70, 100) },
            enabled = title.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
        ) {
            Text("LANJUT KE PERTANYAAN", fontWeight = FontWeight.Black)
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, null)
        }
    }
}

@Composable
private fun QuizQuestionForm(viewModel: QuizBuilderViewModel, onFinish: () -> Unit) {
    var qText by remember { mutableStateOf("") }
    val options = remember { mutableStateListOf("", "", "", "") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Langkah 2: Tambah Pertanyaan", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = NeonSuccess)

        OutlinedTextField(
            value = qText,
            onValueChange = { qText = it },
            label = { Text("Teks Pertanyaan") },
            modifier = Modifier.fillMaxWidth().height(120.dp),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonSuccess)
        )

        options.forEachIndexed { index, option ->
            OutlinedTextField(
                value = option,
                onValueChange = { options[index] = it },
                label = { Text("Pilihan ${'A' + index}") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonSuccess)
            )
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(
                onClick = { 
                    viewModel.addQuestion(qText, options.toList())
                    qText = ""
                    options.indices.forEach { options[it] = "" }
                },
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, null)
                Spacer(Modifier.width(4.dp))
                Text("TAMBAH LAGI")
            }

            Button(
                onClick = { 
                    viewModel.addQuestion(qText, options.toList())
                    onFinish() 
                },
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonSuccess)
            ) {
                Text("SELESAI", fontWeight = FontWeight.Black)
            }
        }
    }
}
