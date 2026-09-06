package com.schoolos.android.feature.auth

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.WifiTethering
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.core.network.MaintenanceManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Composable
fun MaintenanceScreen(
    maintenanceManager: MaintenanceManager,
    onMaintenanceResolved: () -> Unit,
) {
    // Intercept back button so users cannot bypass maintenance screen into private data
    BackHandler(enabled = true) {
        // No-op: stay on maintenance screen
    }

    val maintenanceMessage by maintenanceManager.maintenanceMessage.collectAsState()
    val scope = rememberCoroutineScope()

    var isChecking by remember { mutableStateOf(false) }
    var countdown by remember { mutableIntStateOf(15) }
    var feedbackMessage by remember { mutableStateOf<String?>(null) }

    // Pulsing radar animation for enterprise look
    val infiniteTransition = rememberInfiniteTransition(label = "RadarAura")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.16f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulseScale"
    )
    val beaconAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "BeaconAlpha"
    )

    // Auto-check countdown ticker (every 15 seconds)
    LaunchedEffect(Unit) {
        while (isActive) {
            delay(1000)
            if (countdown <= 1) {
                countdown = 15
                val inMaint = maintenanceManager.checkServerStatus()
                if (!inMaint) {
                    onMaintenanceResolved()
                    break
                }
            } else {
                countdown -= 1
            }
        }
    }

    val handleRecheck: () -> Unit = {
        scope.launch {
            isChecking = true
            feedbackMessage = null
            val inMaint = maintenanceManager.checkServerStatus()
            isChecking = false
            if (!inMaint) {
                feedbackMessage = "Server telah aktif kembali! Mengalihkan..."
                delay(400)
                onMaintenanceResolved()
            } else {
                feedbackMessage = "Server masih dalam proses optimalisasi."
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CosmicBlack)
            .padding(horizontal = 24.dp, vertical = 20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(Modifier.height(16.dp))

            // ── Concentric Radar Core Icon ─────────────────────────
            Box(
                modifier = Modifier.size(100.dp),
                contentAlignment = Alignment.Center
            ) {
                // Outer Pulse Aura
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .scale(pulseScale)
                        .clip(CircleShape)
                        .background(NeonWarning.copy(alpha = 0.12f))
                        .border(1.dp, NeonWarning.copy(alpha = 0.25f), CircleShape)
                )

                // Inner Glass Core
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(RoundedCornerShape(22.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    NeonWarning.copy(alpha = 0.20f),
                                    NeonBlue.copy(alpha = 0.15f)
                                )
                            )
                        )
                        .border(1.5.dp, NeonWarning.copy(alpha = 0.45f), RoundedCornerShape(22.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Dns,
                        contentDescription = "Maintenance Mode",
                        tint = NeonWarning,
                        modifier = Modifier.size(38.dp)
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Live Operational Status Pill ───────────────────────
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(NeonWarning.copy(alpha = 0.12f))
                    .border(1.dp, NeonWarning.copy(alpha = 0.35f), CircleShape)
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(NeonWarning.copy(alpha = beaconAlpha))
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "STATUS: PEMELIHARAAN SISTEM",
                    color = NeonWarning,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 0.8.sp
                )
            }

            Spacer(Modifier.height(16.dp))

            // ── Main Titles ─────────────────────────────────────────
            Text(
                text = "Sistem Sedang Dalam Pemeliharaan",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
                lineHeight = 26.sp
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "Peningkatan infrastruktur cloud & sinkronisasi data sedang berlangsung demi stabilitas layanan seluruh civitas sekolah.",
                color = TextSecondary,
                fontSize = 12.5.sp,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp,
                modifier = Modifier.padding(horizontal = 8.dp)
            )

            Spacer(Modifier.height(20.dp))

            // ── Telemetry Status Rows (3 High-Tech Badges) ─────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Status 1: Server Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Speed, null, tint = NeonBlue, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Status Server", fontSize = 12.sp, color = TextSecondary)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(NeonWarning)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text("Optimalisasi Berjalan", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = NeonWarning)
                    }
                }

                // Status 2: Data Integrity
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, null, tint = NeonSuccess, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Keamanan Data", fontSize = 12.sp, color = TextSecondary)
                    }
                    Text("Terenkripsi & Terjaga", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = NeonSuccess)
                }

                // Status 3: Infrastructure
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.WifiTethering, null, tint = Color(0xFF38BDF8), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Infrastruktur", fontSize = 12.sp, color = TextSecondary)
                    }
                    Text("School OS Cloud v2.4", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Technical Operational Notice (Zero Super Admin Leak) ─
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CosmicSurface)
                    .border(1.dp, NeonWarning.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.WifiTethering,
                        null,
                        tint = NeonWarning,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "CATATAN TEKNIS OPERASIONAL",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonWarning,
                        letterSpacing = 0.5.sp
                    )
                }

                Spacer(Modifier.height(8.dp))

                Text(
                    text = "\u201C$maintenanceMessage\u201D",
                    fontSize = 12.sp,
                    color = TextPrimary,
                    fontStyle = FontStyle.Italic,
                    lineHeight = 17.sp
                )
            }

            Spacer(Modifier.height(20.dp))

            // ── Primary Check Server Button ────────────────────────
            Button(
                onClick = handleRecheck,
                enabled = !isChecking,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = NeonBlue,
                    contentColor = Color.White
                )
            ) {
                if (isChecking) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("Memeriksa Koneksi Server...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                } else {
                    Icon(Icons.Default.Refresh, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Periksa Status Server Sekarang", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            if (feedbackMessage != null) {
                Spacer(Modifier.height(10.dp))
                Text(
                    text = "ℹ️ $feedbackMessage",
                    fontSize = 11.5.sp,
                    color = Color(0xFF38BDF8),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(12.dp))

            // ── Auto-Check Countdown Row & Progress Bar ────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Default.Schedule, null, tint = TextTertiary, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(5.dp))
                Text(
                    text = "Pemeriksaan otomatis dalam $countdown detik",
                    fontSize = 11.sp,
                    color = TextTertiary
                )
            }

            Spacer(Modifier.height(6.dp))

            LinearProgressIndicator(
                progress = { (15 - countdown) / 15f },
                modifier = Modifier
                    .fillMaxWidth(0.8f)
                    .height(3.dp)
                    .clip(CircleShape),
                color = NeonBlue,
                trackColor = CosmicNavy,
                strokeCap = StrokeCap.Round
            )

            Spacer(Modifier.height(20.dp))

            // ── Footer Assistance Text (No Super Admin mention) ────
            Text(
                text = "Hubungi Administrator TI Sekolah jika membutuhkan akses darurat.\nSchool OS Enterprise \u2022 v2.4.0",
                fontSize = 10.5.sp,
                color = TextTertiary.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                lineHeight = 15.sp
            )

            Spacer(Modifier.height(16.dp))
        }
    }
}
