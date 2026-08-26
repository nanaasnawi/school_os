package com.schoolos.android.feature.learning

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayCircleFilled
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.LearningMaterial
import com.schoolos.android.domain.model.MaterialType

@Composable
fun LearningMaterialDetailScreen(
    materialId: String,
    onBack: () -> Unit = {}
) {
    // Mock data for now
    val material = rememberMaterial(materialId)

    Scaffold(containerColor = CosmicBlack) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // ── HERO MEDIA SECTION ──
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(Color.Black)
            ) {
                if (material.thumbnailUrl != null) {
                    AsyncImage(
                        model = material.thumbnailUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier.fillMaxSize().background(
                            Brush.linearGradient(listOf(NeonBlue, StudentNeon))
                        )
                    )
                }

                // Overlay Back Button
                CustomBackButton(
                    onClick = onBack,
                    modifier = Modifier.statusBarsPadding().padding(16.dp),
                    backgroundColor = Color.White.copy(alpha = 0.3f),
                    contentColor = Color.White
                )

                // Video Play Icon Overlay
                if (material.materialType == MaterialType.VIDEO) {
                    Icon(
                        imageVector = Icons.Default.PlayCircleFilled,
                        contentDescription = "Play",
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.size(72.dp).align(Alignment.Center)
                    )
                }
            }

            // ── CONTENT SECTION ──
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonBlue.copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(material.subject, color = NeonBlue, fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(material.materialType.name, color = TextTertiary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(Modifier.height(16.dp))

                Text(
                    text = material.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary,
                    lineHeight = 30.sp
                )

                Spacer(Modifier.height(24.dp))

                // Content Body
                if (material.contentBody != null) {
                    Text(
                        text = material.contentBody,
                        fontSize = 15.sp,
                        color = TextSecondary,
                        lineHeight = 24.sp
                    )
                } else {
                    Text(
                        text = material.description ?: "Tidak ada deskripsi tersedia.",
                        fontSize = 15.sp,
                        color = TextSecondary,
                        lineHeight = 24.sp
                    )
                }

                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun rememberMaterial(id: String): LearningMaterial {
    // In a real app, this would come from a ViewModel
    return LearningMaterial(
        id = id,
        title = "Modul Operasi Pecahan - Bab 1",
        description = "Materi ini membahas dasar-dari penjumlahan dan pengurangan pecahan dengan penyebut yang berbeda.",
        materialType = MaterialType.ARTICLE,
        subject = "Matematika",
        contentBody = """
            Pecahan adalah cara menyatakan bagian dari keseluruhan. Dalam bab ini, kita akan fokus pada dua operasi dasar: Penjumlahan dan Pengurangan.
            
            1. Menyamakan Penyebut
            Sebelum menjumlahkan atau mengurangkan pecahan, pastikan penyebutnya sama. Jika berbeda, carilah KPK dari kedua penyebut tersebut.
            
            2. Melakukan Operasi
            Setelah penyebut sama, jumlahkan atau kurangkan hanya bagian pembilangnya saja.
            
            Contoh:
            1/2 + 1/4 = 2/4 + 1/4 = 3/4
            
            Tips: Selalu sederhanakan hasil akhir jika memungkinkan.
        """.trimIndent(),
        thumbnailUrl = "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800"
    )
}
