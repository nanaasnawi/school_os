package com.schoolos.android.feature.profile

import android.content.Intent
import android.net.Uri
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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutAppScreen(
    onBack: () -> Unit = {},
) {
    val context = LocalContext.current

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
                            text = "Tentang Aplikasi",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            text = "Informasi sistem & lisensi perangkat lunak",
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
            // ── HERO APP CARD ────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(10.dp, RoundedCornerShape(26.dp), spotColor = Color(0x352563EB))
                    .clip(RoundedCornerShape(26.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0xFF1D4ED8), // Deep Blue
                                Color(0xFF2563EB), // Royal Blue
                                Color(0xFF4F46E5), // Indigo
                            )
                        )
                    )
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.20f))
                            .border(1.5.dp, Color.White.copy(alpha = 0.45f), RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🎓", fontSize = 38.sp)
                    }

                    Spacer(Modifier.height(14.dp))

                    Text(
                        text = "SchoolOS",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.5).sp
                    )

                    Spacer(Modifier.height(4.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.18f))
                            .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Versi 1.0.0 (Build 2026.09) • Stable",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(Modifier.height(12.dp))

                    Text(
                        text = "Sistem Operasi Digital Terpadu untuk Tata Kelola & Pembelajaran Sekolah Modern",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        textAlign = TextAlign.Center,
                        lineHeight = 17.sp
                    )
                }
            }

            // ── HIGHLIGHT CAPABILITIES ───────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                .clip(RoundedCornerShape(20.dp))
                .background(CosmicNavy)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "FITUR UNGGULAN SISTEM",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    AboutFeatureRow("⚡", "Sinkronisasi Realtime", "Pembaruan otomatis agenda belajar, nilai, dan absensi tanpa lag.")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    AboutFeatureRow("🔒", "Perlindungan Data Siswa", "Keamanan enkripsi sesi pengguna dan kepatuhan regulasi privasi data.")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    AboutFeatureRow("📱", "Arsitektur Native Modern", "Ditenagai oleh Jetpack Compose dan Material 3 yang mulus dan responsif.")
                }
            }

            // ── SYSTEM DIAGNOSTICS ───────────────────────────────
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
                        text = "DIAGNOSTIK & LINGKUNGAN APLIKASI",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    DiagnosticRow("Platform", "Android Native (Kotlin)")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    DiagnosticRow("UI Toolkit", "Jetpack Compose Modern")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    DiagnosticRow("Status Gateway API", "Terhubung (v1.0.0)")
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    DiagnosticRow("Cache & Database", "Room DB v2.0 (Offline-First)")
                }
            }

            // ── LEGAL & POLICY LINKS ─────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "LEGAL & KEBIJAKAN",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    PolicyLinkRow(
                        title = "Kebijakan Privasi Data Pengguna",
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://schoolos.id/privacy"))
                            context.startActivity(intent)
                        }
                    )
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    PolicyLinkRow(
                        title = "Syarat & Ketentuan Layanan Sekolah",
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://schoolos.id/terms"))
                            context.startActivity(intent)
                        }
                    )
                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)
                    PolicyLinkRow(
                        title = "Lisensi Komponen Open Source",
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://schoolos.id/licenses"))
                            context.startActivity(intent)
                        }
                    )
                }
            }

            // ── COPYRIGHT FOOTER ─────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "© 2026 SchoolOS Ecosystem",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "Hak Cipta Dilindungi Undang-Undang",
                    fontSize = 11.sp,
                    color = TextTertiary
                )
            }

            Spacer(Modifier.height(30.dp))
        }
    }
}

@Composable
private fun AboutFeatureRow(icon: String, title: String, desc: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(CosmicDark),
            contentAlignment = Alignment.Center
        ) {
            Text(icon, fontSize = 16.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
            Spacer(Modifier.height(2.dp))
            Text(desc, fontSize = 11.sp, color = TextTertiary, lineHeight = 16.sp)
        }
    }
}

@Composable
private fun DiagnosticRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = TextSecondary)
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}

@Composable
private fun PolicyLinkRow(title: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = NeonBlue)
        Icon(Icons.Default.OpenInNew, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
    }
}
