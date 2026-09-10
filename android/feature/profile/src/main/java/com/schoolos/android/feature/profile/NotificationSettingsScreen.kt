package com.schoolos.android.feature.profile

import android.widget.Toast
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
fun NotificationSettingsScreen(
    onBack: () -> Unit = {},
) {
    val context = LocalContext.current

    var masterPush by remember { mutableStateOf(true) }
    var assignmentReminders by remember { mutableStateOf(true) }
    var announcementAlerts by remember { mutableStateOf(true) }
    var scheduleReminders by remember { mutableStateOf(true) }
    var gradeAlerts by remember { mutableStateOf(true) }
    var soundEnabled by remember { mutableStateOf(true) }
    var vibrateEnabled by remember { mutableStateOf(true) }
    var quietHours by remember { mutableStateOf(false) }

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
                            text = "Notifikasi & Pengingat",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            text = "Atur frekuensi & jenis pengingat tugas",
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
            // ── HERO BANNER ──────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(24.dp), spotColor = Color(0x306366F1))
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0xFF4338CA), // Indigo
                                Color(0xFF6D28D9), // Violet
                                Color(0xFF7C3AED), // Purple
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
                                Icon(Icons.Default.Notifications, null, tint = Color.White, modifier = Modifier.size(22.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "PUSAT PENGINGAT",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White.copy(alpha = 0.8f),
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "Pengingat Tepat Waktu",
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
                            Text(if (masterPush) "AKTIF" else "NONAKTIF", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    Text(
                        text = "SchoolOS mengirimkan pemberitahuan tepat waktu untuk batas pengumpulan tugas, kuis CBT, dan evaluasi hasil belajar.",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        lineHeight = 17.sp
                    )
                }
            }

            // ── MASTER TOGGLE CARD ───────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Izinkan Semua Notifikasi",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = "Terima pemberitahuan push langsung di perangkat ini",
                            fontSize = 11.sp,
                            color = TextTertiary
                        )
                    }
                    Switch(
                        checked = masterPush,
                        onCheckedChange = {
                            masterPush = it
                            Toast.makeText(context, if (it) "Notifikasi diaktifkan" else "Notifikasi dimatikan", Toast.LENGTH_SHORT).show()
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = StudentNeon,
                            uncheckedThumbColor = TextTertiary,
                            uncheckedTrackColor = CosmicDark
                        )
                    )
                }
            }

            // ── ACADEMIC CATEGORIES ──────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(
                        text = "KATEGORI AKADEMIK",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    NotificationSwitchItem(
                        icon = "📝",
                        title = "Pengingat Tugas & Deadline",
                        desc = "Pemberitahuan H-1 sebelum tenggat dan tugas baru",
                        checked = assignmentReminders && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { assignmentReminders = it }
                    )

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    NotificationSwitchItem(
                        icon = "📢",
                        title = "Pengumuman & Siaran Sekolah",
                        desc = "Surat edaran, libur sekolah, dan berita penting",
                        checked = announcementAlerts && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { announcementAlerts = it }
                    )

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    NotificationSwitchItem(
                        icon = "📅",
                        title = "Jadwal Pelajaran & Sesi Kelas",
                        desc = "Peringatan sesi belajar pagi dan agenda hari ini",
                        checked = scheduleReminders && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { scheduleReminders = it }
                    )

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    NotificationSwitchItem(
                        icon = "📊",
                        title = "Pembaruan Nilai & Rapor",
                        desc = "Saat guru mengunggah nilai tugas atau kuis",
                        checked = gradeAlerts && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { gradeAlerts = it }
                    )
                }
            }

            // ── SOUND & VIBRATION ────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = GlassOverlay)
                    .clip(RoundedCornerShape(20.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(
                        text = "SUARA & PREFERENSI",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = TextTertiary,
                        letterSpacing = 1.sp
                    )

                    NotificationSwitchItem(
                        icon = "🔊",
                        title = "Suara Notifikasi",
                        desc = "Bunyikan nada saat ada tugas atau pesan masuk",
                        checked = soundEnabled && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { soundEnabled = it }
                    )

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    NotificationSwitchItem(
                        icon = "📳",
                        title = "Getar",
                        desc = "Aktifkan getaran perangkat untuk pemberitahuan",
                        checked = vibrateEnabled && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { vibrateEnabled = it }
                    )

                    HorizontalDivider(color = GlassBorder, thickness = 0.5.dp)

                    NotificationSwitchItem(
                        icon = "🌙",
                        title = "Jam Tenang (21.00 - 06.00 WIB)",
                        desc = "Senyapkan pengingat akademik selama jam istirahat malam",
                        checked = quietHours && masterPush,
                        enabled = masterPush,
                        onCheckedChange = { quietHours = it }
                    )
                }
            }

            Spacer(Modifier.height(30.dp))
        }
    }
}

@Composable
private fun NotificationSwitchItem(
    icon: String,
    title: String,
    desc: String,
    checked: Boolean,
    enabled: Boolean = true,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(CosmicDark),
                contentAlignment = Alignment.Center
            ) {
                Text(icon, fontSize = 16.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = if (enabled) TextPrimary else TextTertiary
                )
                Text(
                    text = desc,
                    fontSize = 11.sp,
                    color = TextTertiary,
                    lineHeight = 15.sp
                )
            }
        }
        Spacer(Modifier.width(8.dp))
        Switch(
            checked = checked,
            enabled = enabled,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = StudentNeon,
                uncheckedThumbColor = TextTertiary,
                uncheckedTrackColor = CosmicDark
            )
        )
    }
}
