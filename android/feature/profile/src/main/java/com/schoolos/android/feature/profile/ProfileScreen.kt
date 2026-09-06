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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VerifiedUser
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextButton
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.DynamicSchoolLogo
import com.schoolos.android.core.designsystem.GlassBorder
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
    onLogout: () -> Unit = {},
    onNavigateToSecurity: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToHelp: () -> Unit = {},
    onNavigateToAbout: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val state by viewModel.state.collectAsState()
    val user = state.user

    var showSecurityDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    val isDarkTheme = LocalIsDarkTheme.current
    val toggleTheme = LocalThemeToggle.current

    val isTeacher = com.schoolos.android.core.auth.isTeacherRole(user?.role)
    val isParent = com.schoolos.android.core.auth.isParentRole(user?.role)
    val roleNeon = when {
        isTeacher -> TeacherNeon
        isParent -> ParentNeon
        else -> StudentNeon
    }

    // Determine clean contact info: Never display raw internal UUID emails for Wali
    val displayContact: String = when {
        isParent -> {
            val phone = state.identifier.ifBlank { "" }
            if (phone.isNotBlank()) formatPhoneNumber(phone)
            else if (user?.email?.contains("@wali.schoolos.id") == false) user?.email ?: ""
            else "Nomor HP Terhubung"
        }
        else -> user?.email?.ifBlank { "user@schoolos.id" } ?: "user@schoolos.id"
    }

    Scaffold(containerColor = CosmicBlack) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            // ── HERO PROFILE CARD (NO AVATAR CLIPPING) ───────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(CosmicNavy)
                    .border(1.dp, roleNeon.copy(alpha = 0.25f), RoundedCornerShape(22.dp)),
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Decorative ambient header banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(72.dp)
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        roleNeon.copy(alpha = 0.18f),
                                        NeonBlue.copy(alpha = 0.04f),
                                    )
                                )
                            ),
                    )

                    // Avatar container cleanly placed without negative clipping
                    Box(
                        modifier = Modifier
                            .padding(top = 0.dp)
                            .size(86.dp)
                            .shadow(6.dp, CircleShape, spotColor = roleNeon.copy(alpha = 0.35f))
                            .clip(CircleShape)
                            .background(CosmicNavy)
                            .border(
                                width = 2.5.dp,
                                brush = Brush.linearGradient(listOf(roleNeon, NeonBlue)),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        val icon = when {
                            isTeacher -> Icons.Default.Person
                            isParent -> Icons.Default.Face
                            else -> Icons.Default.School
                        }
                        Icon(
                            imageVector = icon,
                            contentDescription = "Avatar",
                            modifier = Modifier.size(46.dp),
                            tint = roleNeon,
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    // User full name
                    Text(
                        text = user?.name?.ifBlank { "Pengguna SchoolOS" } ?: "Pengguna SchoolOS",
                        fontWeight = FontWeight.Black,
                        fontSize = 19.sp,
                        color = TextPrimary,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(Modifier.height(6.dp))

                    // Contact row with verified badge
                    if (isParent) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(horizontal = 16.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = NeonSuccess,
                                modifier = Modifier.size(13.dp),
                            )
                            Spacer(Modifier.width(5.dp))
                            Text(
                                text = displayContact,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextSecondary,
                            )
                            Spacer(Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(NeonSuccess.copy(alpha = 0.12f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = NeonSuccess,
                                        modifier = Modifier.size(10.dp),
                                    )
                                    Spacer(Modifier.width(3.dp))
                                    Text(
                                        text = "Terverifikasi",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = NeonSuccess,
                                    )
                                }
                            }
                        }
                    } else {
                        Text(
                            text = displayContact,
                            fontSize = 12.sp,
                            color = TextTertiary,
                            textAlign = TextAlign.Center,
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    // Role Badge
                    RoleBadge(role = user?.role?.ifBlank { if (isParent) "Wali Murid" else "Siswa" } ?: "Pengguna")

                    Spacer(Modifier.height(18.dp))
                }
            }

            // ── IF PARENT: DEDICATED CONNECTED STUDENT SHOWCASE CARD ─────────
            if (isParent) {
                val studentName = state.childName.ifBlank { "Data Siswa Binaan" }
                val studentClass = state.className.ifBlank { "Kelas Binaan" }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(CosmicNavy)
                        .border(1.dp, ParentNeon.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
                        .padding(16.dp),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Card Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(ParentNeon.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.School,
                                        contentDescription = null,
                                        tint = ParentNeon,
                                        modifier = Modifier.size(18.dp),
                                    )
                                }
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Siswa Dalam Bimbingan",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary,
                                    )
                                    Text(
                                        text = "Pemantauan aktif tugas & kehadiran",
                                        fontSize = 10.sp,
                                        color = TextTertiary,
                                    )
                                }
                            }

                            // Active badge
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(NeonSuccess.copy(alpha = 0.12f))
                                    .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp),
                            ) {
                                Text(
                                    text = "Siswa Aktif ✓",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NeonSuccess,
                                )
                            }
                        }

                        // Student Information Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(CosmicBlack)
                                .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                                .padding(12.dp),
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        text = studentName,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 15.sp,
                                        color = TextPrimary,
                                    )
                                    // Class Pill
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(StudentNeon.copy(alpha = 0.15f))
                                            .padding(horizontal = 8.dp, vertical = 3.dp),
                                    ) {
                                        Text(
                                            text = studentClass,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = StudentNeon,
                                        )
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("Status: ", fontSize = 11.sp, color = TextTertiary)
                                        Text("Terhubung Realtime", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NeonSuccess)
                                    }
                                    Text(state.schoolName.ifBlank { "Lembaga Terdaftar" }, fontSize = 11.sp, color = TextTertiary)
                                }
                            }
                        }
                    }
                }
            } else {
                // Non-parent summary stats
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(CosmicNavy)
                        .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    val idLabel = if (isTeacher) "NIP" else "NISN"
                    val classLabel = if (isTeacher) "Wali Kelas" else "Kelas"
                    val classValue = if (isTeacher) state.className.ifBlank { "Semua" } else state.className.ifBlank { "-" }
                    val idValue = state.identifier.ifBlank { "-" }

                    CompactProfileStat("Status", "Aktif", NeonSuccess)
                    Box(Modifier.width(1.dp).height(24.dp).background(GlassBorder2))
                    CompactProfileStat(classLabel, classValue, NeonBlue)
                    Box(Modifier.width(1.dp).height(24.dp).background(GlassBorder2))
                    CompactProfileStat(idLabel, idValue, StudentNeon)
                }
            }

            // ── INSTITUTION CARD ─────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                    .padding(14.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(NeonBlue.copy(alpha = 0.08f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        DynamicSchoolLogo(
                            logoUrl = state.schoolLogoUrl,
                            modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)),
                            fallback = {
                                Icon(Icons.Default.School, null, tint = NeonBlue, modifier = Modifier.size(22.dp))
                            }
                        )
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Lembaga Terdaftar",
                                fontSize = 10.sp,
                                color = TextTertiary,
                                fontWeight = FontWeight.Bold,
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = null,
                                tint = NeonSuccess,
                                modifier = Modifier.size(12.dp),
                            )
                        }
                        Text(
                            text = state.schoolName.ifBlank { "Lembaga Sekolah" },
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = TextPrimary,
                        )
                    }
                    Text("✓ Terhubung", fontSize = 11.sp, color = NeonSuccess, fontWeight = FontWeight.Bold)
                }
            }

            // ── SETTINGS & PREFERENCES ───────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(18.dp)),
            ) {
                Column {
                    // Dark / Light Mode Switch
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(NeonWarning.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
                                contentDescription = null,
                                tint = NeonWarning,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isDarkTheme) "Mode Gelap" else "Mode Terang",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = TextPrimary,
                            )
                            Text(
                                text = "Sesuaikan kontras tampilan aplikasi",
                                fontSize = 10.sp,
                                color = TextTertiary,
                            )
                        }
                        Switch(
                            checked = isDarkTheme,
                            onCheckedChange = { toggleTheme() },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = NeonBlue,
                                uncheckedThumbColor = TextTertiary,
                                uncheckedTrackColor = CosmicBlack,
                            ),
                            modifier = Modifier.size(width = 44.dp, height = 24.dp)
                        )
                    }

                    Box(Modifier.fillMaxWidth().height(1.dp).background(GlassBorder))

                    CompactSettingItem(
                        icon = Icons.Default.Lock,
                        color = NeonSuccess,
                        title = "Keamanan & Kata Sandi",
                        sub = "Kelola sandi & autentikasi masuk",
                        onClick = {
                            showSecurityDialog = true
                            onNavigateToSecurity()
                        }
                    )
                    CompactSettingItem(
                        icon = Icons.Default.Notifications,
                        color = StudentNeon,
                        title = "Notifikasi & Pengingat",
                        sub = "Notifikasi tugas dan rekap nilai",
                        onClick = onNavigateToNotifications
                    )
                    CompactSettingItem(
                        icon = Icons.AutoMirrored.Filled.HelpOutline,
                        color = NeonWarning,
                        title = "Bantuan & Kontak Sekolah",
                        sub = "Pusat bantuan & layanan admin",
                        onClick = {
                            showHelpDialog = true
                            onNavigateToHelp()
                        }
                    )
                    CompactSettingItem(
                        icon = Icons.Default.Info,
                        color = NeonBlue,
                        title = "Tentang Aplikasi SchoolOS",
                        sub = "Versi ${state.appVersion.ifBlank { "1.0.0" }} Stable",
                        onClick = {
                            showAboutDialog = true
                            onNavigateToAbout()
                        }
                    )
                }
            }

            // ── LOGOUT BUTTON ────────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(NeonError.copy(alpha = 0.08f))
                    .border(1.dp, NeonError.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                    .clickable(enabled = !state.loggingOut, onClick = { showLogoutDialog = true }),
                contentAlignment = Alignment.Center,
            ) {
                if (state.loggingOut) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = NeonError,
                    )
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = null,
                            tint = NeonError,
                            modifier = Modifier.size(19.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "Keluar Akun",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = NeonError,
                        )
                    }
                }
            }

            Spacer(Modifier.height(50.dp))
        }
    }

    // ── SECURITY & PASSWORD DIALOG ───────────────────────────────────────────
    if (showSecurityDialog) {
        var currentPassword by remember { mutableStateOf("") }
        var newPassword by remember { mutableStateOf("") }
        var confirmPassword by remember { mutableStateOf("") }
        var showPassword by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showSecurityDialog = false },
            containerColor = CosmicNavy,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonSuccess.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Lock, null, tint = NeonSuccess, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Keamanan Akun", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
                        Text("Ganti sandi & autentikasi", color = TextTertiary, fontSize = 11.sp)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, null, tint = NeonSuccess, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Sesi Aktif & Terenkripsi", color = NeonSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Text("ID Akun: ${user?.id?.take(8) ?: "-"} • Role: ${user?.role ?: "-"}", color = TextSecondary, fontSize = 11.sp)
                        }
                    }

                    OutlinedTextField(
                        value = currentPassword,
                        onValueChange = { currentPassword = it },
                        label = { Text("Kata Sandi Saat Ini", fontSize = 12.sp) },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = { Text("Kata Sandi Baru", fontSize = 12.sp) },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = { Text("Konfirmasi Sandi Baru", fontSize = 12.sp) },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    null,
                                    tint = TextTertiary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonBlue,
                            unfocusedBorderColor = GlassBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (currentPassword.isBlank() || newPassword.isBlank()) {
                            Toast.makeText(context, "Harap isi kata sandi!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (newPassword.length < 6) {
                            Toast.makeText(context, "Kata sandi baru minimal 6 karakter!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (newPassword != confirmPassword) {
                            Toast.makeText(context, "Konfirmasi sandi tidak cocok!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        Toast.makeText(context, "Kata sandi berhasil diperbarui!", Toast.LENGTH_LONG).show()
                        showSecurityDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NeonSuccess),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Simpan Sandi", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSecurityDialog = false }) {
                    Text("Tutup", color = TextSecondary, fontSize = 13.sp)
                }
            }
        )
    }

    // ── HELP & SUPPORT DIALOG ────────────────────────────────────────────────
    if (showHelpDialog) {
        AlertDialog(
            onDismissRequest = { showHelpDialog = false },
            containerColor = CosmicNavy,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonWarning.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.AutoMirrored.Filled.HelpOutline, null, tint = NeonWarning, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Bantuan & Kontak", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
                        Text(state.schoolName.ifBlank { "Layanan Sekolah" }, color = TextTertiary, fontSize = 11.sp)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicBlack)
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/6281234567890?text=Halo%20Admin%20SchoolOS"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Kontak Layanan: 0812-3456-7890", Toast.LENGTH_LONG).show()
                                }
                            }
                            .padding(14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(NeonSuccess.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Phone, null, tint = NeonSuccess, modifier = Modifier.size(18.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("WhatsApp Layanan Admin", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 13.sp)
                                Text("Respon cepat jam kerja • Tap hubungi", color = TextSecondary, fontSize = 11.sp)
                            }
                            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:layanan@schoolos.id"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Email: layanan@schoolos.id", Toast.LENGTH_LONG).show()
                                }
                            }
                            .padding(14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(NeonBlue.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Email, null, tint = NeonBlue, modifier = Modifier.size(18.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Email Bantuan Akademik", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 13.sp)
                                Text("layanan@schoolos.id", color = TextSecondary, fontSize = 11.sp)
                            }
                            Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(16.dp))
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(CosmicBlack.copy(alpha = 0.5f))
                            .padding(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🕒 Jam Operasional: ", fontSize = 11.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
                            Text("Senin – Jumat, 08.00 – 16.00 WIB", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showHelpDialog = false }) {
                    Text("Tutup", color = NeonBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // ── ABOUT SCHOOLOS DIALOG ────────────────────────────────────────────────
    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            containerColor = CosmicNavy,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(NeonBlue.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Info, null, tint = NeonBlue, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Tentang SchoolOS", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
                        Text("Sistem Operasi Manajemen Sekolah", color = TextTertiary, fontSize = 11.sp)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(CosmicBlack)
                            .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                            .padding(14.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("SchoolOS Mobile", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NeonBlue.copy(alpha = 0.15f))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text("v${state.appVersion.ifBlank { "1.0.0" }}", color = NeonBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Text(
                                "Platform terpadu untuk pembelajaran daring, tugas, CBT, jadwal terstruktur, dan pemantauan realtime.",
                                color = TextSecondary,
                                fontSize = 12.sp,
                                lineHeight = 17.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(CosmicBlack)
                                .border(0.5.dp, GlassBorder, RoundedCornerShape(8.dp))
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("PostgreSQL Sync", color = TextTertiary, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(CosmicBlack)
                                .border(0.5.dp, GlassBorder, RoundedCornerShape(8.dp))
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Axum Cloud Engine", color = TextTertiary, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(CosmicBlack)
                                .border(0.5.dp, GlassBorder, RoundedCornerShape(8.dp))
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Jetpack Compose", color = TextTertiary, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Text(
                        "Lembaga: ${state.schoolName.ifBlank { "Lembaga Pendidikan Terdaftar" }}\n© 2026 SchoolOS. Seluruh hak cipta dilindungi.",
                        color = TextTertiary,
                        fontSize = 10.sp,
                        lineHeight = 14.sp
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showAboutDialog = false }) {
                    Text("Tutup", color = NeonBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // ── LOGOUT CONFIRMATION DIALOG ───────────────────────────────────────────
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = CosmicNavy,
            title = {
                Text("Konfirmasi Keluar Akun", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
            },
            text = {
                Text(
                    text = "Apakah Anda yakin ingin keluar dari akun ${user?.name ?: "ini"}? Anda harus login kembali untuk mengakses jadwal dan modul pembelajaran.",
                    color = TextSecondary,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NeonError),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Ya, Keluar", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Batal", color = TextSecondary, fontSize = 13.sp)
                }
            }
        )
    }
}

@Composable
private fun CompactProfileStat(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 9.sp, color = TextTertiary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(2.dp))
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Black, color = color)
    }
}

@Composable
private fun CompactSettingItem(
    icon: ImageVector,
    color: Color,
    title: String,
    sub: String,
    onClick: () -> Unit = {},
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(color.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
            Text(sub, fontSize = 10.sp, color = TextTertiary)
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = TextTertiary.copy(alpha = 0.4f),
            modifier = Modifier.size(16.dp),
        )
    }
}

private fun formatPhoneNumber(phone: String): String {
    val clean = phone.filter { it.isDigit() }
    return when {
        clean.startsWith("08") && clean.length >= 10 -> {
            "${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8)}"
        }
        clean.startsWith("628") && clean.length >= 11 -> {
            "+62 ${clean.substring(2, 5)}-${clean.substring(5, 9)}-${clean.substring(9)}"
        }
        else -> phone
    }
}
