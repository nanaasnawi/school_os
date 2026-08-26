package com.schoolos.android.feature.learning

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.PlayCircleOutline
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

data class MaterialItem(
    val id: String,
    val title: String,
    val type: String, // PDF, VIDEO, MODULE
    val size: String,
    val subject: String,
    val color: Color
)

@Composable
fun LearningMaterialListScreen(
    onBack: () -> Unit = {}
) {
    val materials = listOf(
        MaterialItem("1", "Modul Operasi Pecahan - Bab 1", "PDF", "2.4 MB", "Matematika", StudentNeon),
        MaterialItem("2", "Video Pembelajaran: Ekosistem Laut", "VIDEO", "15:20", "IPA", NeonBlue),
        MaterialItem("3", "Ringkasan Materi Tata Surya", "MODULE", "1.1 MB", "IPA", NeonBlue),
        MaterialItem("4", "Kumpulan Soal Latihan UTS", "PDF", "3.8 MB", "Umum", NeonWarning),
        MaterialItem("5", "Panduan Menulis Puisi Kreatif", "PDF", "0.9 MB", "B. Indonesia", NeonSuccess)
    )

    Scaffold(containerColor = CosmicBlack) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // HEADER
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().statusBarsPadding(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CustomBackButton(onClick = onBack)
                    Spacer(Modifier.width(16.dp))
                    Text(
                        "Materi Belajar",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                }
            }

            // SEARCH BAR PLACEHOLDER
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White)
                        .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Search, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Cari judul materi...", color = TextTertiary, fontSize = 14.sp)
                    }
                }
            }

            // MATERIAL LIST
            items(materials) { item ->
                MaterialCard(item)
            }
        }
    }
}

@Composable
private fun MaterialCard(item: MaterialItem) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color.White)
            .border(1.dp, GlassBorder, RoundedCornerShape(18.dp))
            .clickable { /* Download/Open */ }
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(item.color.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when(item.type) {
                        "VIDEO" -> Icons.Default.PlayCircleOutline
                        else -> Icons.Default.Description
                    },
                    contentDescription = null,
                    tint = item.color,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    item.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = TextPrimary
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(item.subject, fontSize = 11.sp, color = item.color, fontWeight = FontWeight.Black)
                    Spacer(Modifier.width(8.dp))
                    Text("•", color = TextTertiary, fontSize = 10.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("${item.type} • ${item.size}", fontSize = 11.sp, color = TextTertiary)
                }
            }
            Icon(Icons.Default.FileDownload, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
        }
    }
}
