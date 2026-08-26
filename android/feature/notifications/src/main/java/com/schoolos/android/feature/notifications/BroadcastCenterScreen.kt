package com.schoolos.android.feature.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Send
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BroadcastCenterScreen(
    onBack: () -> Unit = {},
    onSuccess: () -> Unit = {},
    viewModel: BroadcastViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var targetStudents by remember { mutableStateOf(true) }
    var targetParents by remember { mutableStateOf(true) }

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
                    Text("Pusat Siaran", fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextPrimary)
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

            Text("Kirim notifikasi ke kelas managed anda.", fontSize = 13.sp, color = TextSecondary)

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Judul Pengumuman") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
            )

            OutlinedTextField(
                value = message,
                onValueChange = { message = it },
                label = { Text("Pesan Utama") },
                modifier = Modifier.fillMaxWidth().height(150.dp),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NeonBlue)
            )

            Text("Target Penerima", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = targetStudents, onCheckedChange = { targetStudents = it }, colors = CheckboxDefaults.colors(checkedColor = NeonBlue))
                    Text("Siswa", fontSize = 14.sp, color = TextPrimary)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = targetParents, onCheckedChange = { targetParents = it }, colors = CheckboxDefaults.colors(checkedColor = NeonBlue))
                    Text("Orang Tua", fontSize = 14.sp, color = TextPrimary)
                }
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { viewModel.sendBroadcast(title, message, targetStudents, targetParents) },
                enabled = title.isNotBlank() && message.isNotBlank() && !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Campaign, null)
                    Spacer(Modifier.width(8.dp))
                    Text("KIRIM PENGUMUMAN", fontWeight = FontWeight.Black, fontSize = 14.sp)
                }
            }
        }
    }
}
