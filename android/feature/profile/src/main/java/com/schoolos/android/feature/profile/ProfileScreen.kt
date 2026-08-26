package com.schoolos.android.feature.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.schoolos.android.core.designsystem.CosmicNavy
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.GlassBorder2
import com.schoolos.android.core.designsystem.LocalIsDarkTheme
import com.schoolos.android.core.designsystem.LocalThemeToggle
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.RoleBadge
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: (() -> Unit)? = null,
    onLogout: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val user = state.user

    val isDarkTheme = LocalIsDarkTheme.current
    val toggleTheme = LocalThemeToggle.current

    val roleLower = user?.role?.lowercase() ?: "siswa"
    val roleNeon = when (roleLower) {
        "teacher", "guru" -> TeacherNeon
        "parent", "guardian", "ortu", "wali" -> ParentNeon
        else -> StudentNeon
    }

    Scaffold(containerColor = CosmicBlack) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // ── REFACTORED NON-OVERLAPPING LIST HEADER ─────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 0.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (onBack != null) {
                        CustomBackButton(onClick = onBack)
                    }
                }
            }

            // ── COMPACT PROFILE HERO ──────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CosmicNavy)
                    .border(1.dp, roleNeon.copy(alpha = 0.2f), RoundedCornerShape(18.dp)),
            ) {
                Column {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(80.dp)
                            .background(Brush.linearGradient(listOf(roleNeon.copy(alpha = 0.15f), NeonBlue.copy(alpha = 0.05f)))),
                    )

                    Box(
                        modifier = Modifier.fillMaxWidth().padding(top = 0.dp),
                        contentAlignment = Alignment.TopCenter,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(CosmicNavy)
                                .border(2.dp, roleNeon.copy(alpha = 0.5f), CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            val icon = when (roleLower) {
                                "teacher", "guru" -> Icons.Default.Person
                                "parent", "guardian", "ortu", "wali" -> Icons.Default.Face
                                else -> Icons.Default.School
                            }
                            Icon(icon, null, modifier = Modifier.size(38.dp), tint = roleNeon)
                        }
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(user?.name?.ifBlank { "Pengguna" } ?: "Pengguna", fontWeight = FontWeight.Black, fontSize = 17.sp, color = TextPrimary)
                        Text(user?.email?.ifBlank { "user@schoolos.id" } ?: "user@schoolos.id", fontSize = 11.sp, color = TextTertiary)
                        Spacer(Modifier.height(10.dp))
                        RoleBadge(role = user?.role?.ifBlank { "Siswa" } ?: "Siswa")

                        Spacer(Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(CosmicBlack).padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                        ) {
                            val idLabel = when {
                                roleLower == "teacher" || roleLower == "guru" -> "NIP"
                                roleLower == "parent" || roleLower == "wali" || roleLower == "ortu" -> "ID Wali"
                                else -> "NIS"
                            }
                            val classLabel = when {
                                roleLower == "teacher" || roleLower == "guru" -> "Wali Kelas"
                                roleLower == "parent" || roleLower == "wali" || roleLower == "ortu" -> "Anak"
                                else -> "Kelas"
                            }
                            val classValue = when {
                                roleLower == "teacher" || roleLower == "guru" -> "7A"
                                roleLower == "parent" || roleLower == "wali" || roleLower == "ortu" -> "Ahmad"
                                else -> "7A"
                            }

                            CompactProfileStat("Status", "Aktif", NeonSuccess)
                            Box(Modifier.width(1.dp).height(20.dp).background(GlassBorder2))
                            CompactProfileStat(classLabel, classValue, NeonBlue)
                            Box(Modifier.width(1.dp).height(20.dp).background(GlassBorder2))
                            CompactProfileStat(idLabel, if (idLabel == "NIP") "19880702" else "123456", StudentNeon)
                        }
                    }
                }
            }

            // ── COMPACT INSTITUTION ──────────────────────────────────────────
            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(CosmicNavy)
                    .border(1.dp, GlassBorder2, RoundedCornerShape(16.dp)).padding(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(NeonBlue.copy(alpha = 0.08f)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.School, null, tint = NeonBlue, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Institusi", fontSize = 9.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                        Text("SD Negeri 1 Silih Asih", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                    }
                    Text("✓", fontSize = 16.sp, color = NeonSuccess, fontWeight = FontWeight.Black)
                }
            }

            // ── SETTINGS (Compact) ────────────────────────────────────────────
            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(CosmicNavy)
                    .border(1.dp, GlassBorder2, RoundedCornerShape(16.dp)),
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(NeonWarning.copy(alpha = 0.08f)), contentAlignment = Alignment.Center) {
                            Icon(if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode, null, tint = NeonWarning, modifier = Modifier.size(18.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(if (isDarkTheme) "Mode Gelap" else "Mode Terang", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary, modifier = Modifier.weight(1f))
                        Switch(
                            checked = isDarkTheme, onCheckedChange = { toggleTheme() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = NeonBlue, uncheckedThumbColor = TextTertiary, uncheckedTrackColor = CosmicBlack),
                            modifier = Modifier.size(width = 44.dp, height = 24.dp)
                        )
                    }

                    CompactSettingItem(Icons.Default.Lock, NeonSuccess, "Keamanan", "Sandi & Autentikasi")
                    CompactSettingItem(Icons.Default.Notifications, StudentNeon, "Notifikasi", "Pengingat Jadwal")
                    CompactSettingItem(Icons.AutoMirrored.Filled.HelpOutline, NeonWarning, "Bantuan", "FAQ & Support")
                    CompactSettingItem(Icons.Default.Info, NeonBlue, "Tentang", "Versi 1.0.0 Stable")
                }
            }

            // ── COMPACT LOGOUT ────────────────────────────────────────────────
            Box(
                modifier = Modifier.fillMaxWidth().height(48.dp).clip(RoundedCornerShape(14.dp))
                    .background(NeonError.copy(alpha = 0.08f)).border(1.dp, NeonError.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                    .clickable(onClick = onLogout),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.AutoMirrored.Filled.ExitToApp, null, tint = NeonError, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Keluar Akun", fontSize = 14.sp, fontWeight = FontWeight.Black, color = NeonError)
                }
            }

            Spacer(Modifier.height(60.dp))
        }
    }
}

@Composable
private fun CompactProfileStat(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 9.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Black, color = color)
    }
}

@Composable
private fun CompactSettingItem(icon: ImageVector, color: Color, title: String, sub: String) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable {}.padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(color.copy(alpha = 0.08f)), contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
            Text(sub, fontSize = 10.sp, color = TextTertiary)
        }
        Icon(Icons.Default.ChevronRight, null, tint = TextTertiary.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
    }
}
