package com.schoolos.android.feature.profile

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolHelpContactScreen(
    onBack: () -> Unit = {},
) {
    val context = LocalContext.current

    var expandedFaqIndex by remember { mutableIntStateOf(-1) }
    var showReportDialog by remember { mutableStateOf(false) }
    var reportText by remember { mutableStateOf("") }

    val faqs = remember {
        listOf(
            Pair(
                "Bagaimana jika saya lupa kata sandi akun?",
                "Anda dapat menghubungi staf Tata Usaha atau Wali Kelas untuk reset kata sandi sementara, lalu perbarui kata sandi di menu Keamanan & Kata Sandi."
            ),
            Pair(
                "Kapan tugas yang diunggah akan dinilai oleh guru?",
                "Guru mata pelajaran biasanya memeriksa tugas dalam waktu 1-3 hari kerja setelah batas tenggat waktu pengumpulan berakhir."
            ),
            Pair(
                "Bagaimana cara mengajukan izin ketidakhadiran?",
                "Orang tua/wali murid dapat mengajukan surat izin sakit atau izin keperluan melalui menu Absensi atau langsung menghubungi Wali Kelas melalui WhatsApp."
            ),
            Pair(
                "Apa yang harus dilakukan jika kuis CBT mengalami kendala koneksi?",
                "Sistem menyimpan jawaban Anda secara otomatis setiap 3 detik. Jangan tutup aplikasi dan refresh jaringan atau hubungi proktor ruang ujian."
            )
        )
    }

    Scaffold(
        containerColor = CosmicBlack,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, CircleShape)
                            .clickable(onClick = onBack),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali",
                            tint = TextPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(
                            text = "Bantuan & Kontak Sekolah",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            text = "Layanan akademik & pusat kendala",
                            fontSize = 12.sp,
                            color = TextTertiary
                        )
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── 1. HERO BANNER ───────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(24.dp), spotColor = Color(0x30F59E0B))
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0xFFD97706), // Amber
                                Color(0xFFF59E0B), // Warm Gold
                                Color(0xFFEA580C), // Orange
                            )
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White.copy(alpha = 0.20f))
                                    .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.AutoMirrored.Filled.HelpOutline, null, tint = Color.White, modifier = Modifier.size(24.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "PUSAT DUKUNGAN",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White.copy(alpha = 0.85f),
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "Layanan Sekolah",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.20f))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text("RESPONSIF", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    Text(
                        text = "Butuh bantuan terkait tugas, nilai, izin kehadiran, atau kendala akun? Tim Tata Usaha dan Bimbingan Konseling siap membantu Anda.",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.9f),
                        lineHeight = 17.sp
                    )
                }
            }

            // ── 2. QUICK ACTIONS (PHONE, WHATSAPP, EMAIL, WEB) ───
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickContactActionCard(
                    icon = "📞",
                    label = "Telepon TU",
                    sub = "021-7654321",
                    color = NeonBlue,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:0217654321"))
                        context.startActivity(intent)
                    }
                )
                QuickContactActionCard(
                    icon = "💬",
                    label = "WhatsApp",
                    sub = "Chat Admin",
                    color = NeonSuccess,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/6281234567890?text=Halo%20Admin%20Sekolah,%20saya%20membutuhkan%20informasi%20akademik"))
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "WhatsApp tidak terpasang di perangkat ini", Toast.LENGTH_SHORT).show()
                        }
                    }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickContactActionCard(
                    icon = "✉️",
                    label = "Email Resmi",
                    sub = "tu@schoolos.id",
                    color = StudentNeon,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val intent = Intent(Intent.ACTION_SENDTO).apply {
                            data = Uri.parse("mailto:admin@schoolos.id")
                            putExtra(Intent.EXTRA_SUBJECT, "Layanan Akademik Siswa SchoolOS")
                        }
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Tidak ada aplikasi email yang terpasang", Toast.LENGTH_SHORT).show()
                        }
                    }
                )
                QuickContactActionCard(
                    icon = "🌐",
                    label = "Website",
                    sub = "schoolos.id",
                    color = NeonWarning,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://schoolos.id"))
                        context.startActivity(intent)
                    }
                )
            }

            // ── 3. OPERATIONAL HOURS CARD ────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "JAM OPERASIONAL LAYANAN",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Senin — Kamis", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("07.00 — 15.30 WIB", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                    }

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Jumat", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("07.00 — 11.30 WIB", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                    }

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Sabtu & Minggu", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(NeonError.copy(alpha = 0.12f))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Tutup", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NeonError)
                        }
                    }
                }
            }

            // ── 4. FREQUENTLY ASKED QUESTIONS (FAQ) ──────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "PERTANYAAN SERING DIAJUKAN (FAQ)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    faqs.forEachIndexed { index, faq ->
                        val isExpanded = expandedFaqIndex == index

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isExpanded) CosmicDark else Color.Transparent)
                                .clickable {
                                    expandedFaqIndex = if (isExpanded) -1 else index
                                }
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = faq.first,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isExpanded) NeonBlue else TextPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = TextTertiary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            AnimatedVisibility(visible = isExpanded) {
                                Column {
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        text = faq.second,
                                        fontSize = 12.sp,
                                        color = TextSecondary,
                                        lineHeight = 17.sp
                                    )
                                }
                            }
                        }

                        if (index < faqs.size - 1) {
                            HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                        }
                    }
                }
            }

            // ── 5. REPORT SYSTEM PROBLEM BUTTON ──────────────────
            OutlinedButton(
                onClick = { showReportDialog = true },
                border = androidx.compose.foundation.BorderStroke(1.dp, NeonError.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Icon(Icons.Default.BugReport, null, tint = NeonError, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Laporkan Kendala Sistem / Bug", color = NeonError, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }

            Spacer(Modifier.height(30.dp))
        }
    }

    // Report Dialog
    if (showReportDialog) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            containerColor = CosmicNavy,
            title = {
                Text("Laporkan Kendala Sistem", fontWeight = FontWeight.Black, color = TextPrimary)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Jelaskan kendala teknis atau masalah yang Anda temukan:",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    OutlinedTextField(
                        value = reportText,
                        onValueChange = { reportText = it },
                        placeholder = { Text("Contoh: Halaman tugas tidak menampilkan berkas PDF...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (reportText.isNotBlank()) {
                            Toast.makeText(context, "Laporan Anda telah diteruskan ke tim IT sekolah.", Toast.LENGTH_LONG).show()
                            reportText = ""
                            showReportDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NeonBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Kirim Laporan", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Batal", color = TextTertiary)
                }
            }
        )
    }
}

@Composable
private fun QuickContactActionCard(
    icon: String,
    label: String,
    sub: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .shadow(2.dp, RoundedCornerShape(16.dp), spotColor = GlassOverlay)
            .clip(RoundedCornerShape(16.dp))
            .background(CosmicNavy)
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Text(icon, fontSize = 20.sp)
            }
            Spacer(Modifier.height(8.dp))
            Text(label, fontWeight = FontWeight.Black, fontSize = 13.sp, color = TextPrimary)
            Text(sub, fontSize = 11.sp, color = TextTertiary, maxLines = 1)
        }
    }
}
