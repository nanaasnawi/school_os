@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.schoolos.android.feature.auth


import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.School


import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Usb
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface
import com.schoolos.android.core.designsystem.CosmicSurface2
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.SchoolOsBrandLogo
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

data class RoleTabConfig(
    val title: String,
    val subtitle: String = "",
    val icon: ImageVector,
    val accentColor: Color,
    val secondaryColor: Color,
    val inputLabel: String,
    val inputPlaceholder: String = "",
    val hintBadge: String = "",
    val hintExample: String = "",
)

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit = {},
    viewModel: LoginViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var passwordVisible by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(state.isLoggedIn) {
        if (state.isLoggedIn) onLoginSuccess()
    }

    // Auto-dismiss error toast after 3 seconds
    LaunchedEffect(state.error) {
        if (state.error != null) {
            kotlinx.coroutines.delay(3000L)
            viewModel.clearError()
        }
    }

    val roleTabs = remember {
        listOf(
            RoleTabConfig(
                title = "Semua",
                icon = Icons.Default.Person,
                accentColor = NeonBlue,
                secondaryColor = Color(0xFF38BDF8),
                inputLabel = "Email / Username",
                inputPlaceholder = "Masukkan email",
            ),
            RoleTabConfig(
                title = "Siswa",
                icon = Icons.Default.School,
                accentColor = StudentNeon,
                secondaryColor = Color(0xFFA855F7),
                inputLabel = "NISN / Email",
                inputPlaceholder = "Masukkan NISN atau email",
            ),
            RoleTabConfig(
                title = "Guru",
                icon = Icons.AutoMirrored.Filled.MenuBook,
                accentColor = TeacherNeon,
                secondaryColor = Color(0xFF34D399),
                inputLabel = "NIP / Email",
                inputPlaceholder = "Masukkan NIP atau email",
            ),
            RoleTabConfig(
                title = "Wali",
                icon = Icons.Default.People,
                accentColor = ParentNeon,
                secondaryColor = Color(0xFFFB7185),
                inputLabel = "WhatsApp / Email",
                inputPlaceholder = "Masukkan WhatsApp atau email",
            ),
        )
    }

    val currentTab = roleTabs.getOrElse(state.selectedRoleTab) { roleTabs[0] }
    val animatedAccentColor by animateColorAsState(
        targetValue = currentTab.accentColor,
        animationSpec = tween(400),
        label = "accentColorAnim"
    )

    // Dynamic background infinite auras
    val infiniteTransition = rememberInfiniteTransition(label = "auras")
    val auraAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(7000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "auraFloat",
    )
    val auraAnim2 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(5000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "auraFloat2",
    )
    val particlePulse by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulseAnim",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CosmicBlack)
    ) {
        // High-end radial gradient aura canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        animatedAccentColor.copy(alpha = 0.18f * (0.7f + auraAnim * 0.3f)),
                        Color.Transparent
                    ),
                    center = Offset(-120f + auraAnim * 90f, -60f + auraAnim * 60f),
                    radius = 650f,
                ),
                radius = 650f,
                center = Offset(-120f + auraAnim * 90f, -60f + auraAnim * 60f),
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        currentTab.secondaryColor.copy(alpha = 0.14f * (0.6f + auraAnim2 * 0.4f)),
                        Color.Transparent
                    ),
                    center = Offset(size.width + 80f - auraAnim2 * 70f, 220f + auraAnim2 * 50f),
                    radius = 520f,
                ),
                radius = 520f,
                center = Offset(size.width + 80f - auraAnim2 * 70f, 220f + auraAnim2 * 50f),
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(NeonBlue.copy(alpha = 0.10f * (0.8f + auraAnim * 0.2f)), Color.Transparent),
                    center = Offset(size.width * 0.85f, size.height * 0.88f - auraAnim * 50f),
                    radius = 480f,
                ),
                radius = 480f,
                center = Offset(size.width * 0.85f, size.height * 0.88f - auraAnim * 50f),
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(top = 48.dp, bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {


            // ── 1. School Crest / App Logo ───
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.scale(0.96f + auraAnim * 0.04f),
            ) {
                // Outer Ambient Glow Aura Ring
                Box(
                    modifier = Modifier
                        .size(112.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    animatedAccentColor.copy(alpha = 0.40f * particlePulse),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // Emblem Container with Metallic & Neon Border
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .shadow(20.dp, CircleShape, spotColor = animatedAccentColor.copy(alpha = 0.45f))
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    CosmicNavy,
                                    CosmicSurface2
                                )
                            )
                        )
                        .border(
                            2.5.dp,
                            Brush.sweepGradient(
                                listOf(
                                    animatedAccentColor,
                                    currentTab.secondaryColor,
                                    NeonBlue,
                                    animatedAccentColor
                                )
                            ),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    com.schoolos.android.core.designsystem.DynamicSchoolLogo(
                        logoUrl = state.schoolLogoUrl,
                        modifier = Modifier
                            .size(90.dp)
                            .clip(CircleShape),
                        fallback = {
                            SchoolOsBrandLogo(size = 80)
                        },
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // ── 2. Header Typography & Identity ──────────────────────────────
            Text(
                text = state.schoolName ?: "School OS",
                fontWeight = FontWeight.Black,
                fontSize = 26.sp,
                color = TextPrimary,
                letterSpacing = (-0.8).sp,
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = "SISTEM INFORMASI AKADEMIK",
                fontSize = 13.sp,
                color = animatedAccentColor,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.6.sp,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )

            Spacer(Modifier.height(22.dp))

            // ── 3. Role Selector Grid / Tabs ─────────────────────────────────
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = CosmicNavy.copy(alpha = 0.95f),
                border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(5.dp),
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    roleTabs.forEachIndexed { index, tab ->
                        val isSelected = state.selectedRoleTab == index
                        val tabBackground = if (isSelected) {
                            tab.accentColor.copy(alpha = 0.16f)
                        } else {
                            Color.Transparent
                        }
                        val tabBorderColor = if (isSelected) tab.accentColor else Color.Transparent

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(15.dp))
                                .background(tabBackground)
                                .border(1.2.dp, tabBorderColor, RoundedCornerShape(15.dp))
                                .clickable { viewModel.onRoleTabChanged(index) }
                                .padding(vertical = 10.dp, horizontal = 2.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) tab.accentColor.copy(alpha = 0.2f) else CosmicSurface)
                                        .border(
                                            0.8.dp,
                                            if (isSelected) tab.accentColor.copy(alpha = 0.6f) else Color.Transparent,
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(
                                        imageVector = tab.icon,
                                        contentDescription = tab.title,
                                        tint = if (isSelected) tab.accentColor else TextTertiary,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = tab.title,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.SemiBold,
                                    color = if (isSelected) tab.accentColor else TextSecondary,
                                )
                                if (tab.subtitle.isNotEmpty()) {
                                    Text(
                                        text = tab.subtitle,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (isSelected) tab.accentColor.copy(alpha = 0.85f) else TextTertiary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }

                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(18.dp))

            // ── 4. Main Authentication Card ──────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(18.dp, RoundedCornerShape(28.dp), spotColor = animatedAccentColor.copy(alpha = 0.15f))
                    .clip(RoundedCornerShape(28.dp))
                    .background(CosmicNavy.copy(alpha = 0.98f))
                    .border(1.2.dp, GlassBorder, RoundedCornerShape(28.dp))
                    .padding(22.dp),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    // Card Sub-Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(animatedAccentColor.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Shield,
                                    contentDescription = null,
                                    tint = animatedAccentColor,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = "AUTENTIKASI",
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                color = TextTertiary,
                                letterSpacing = 1.2.sp,
                            )
                        }

                        // Role badge pill
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(animatedAccentColor.copy(alpha = 0.12f))
                                .border(1.dp, animatedAccentColor.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp),
                        ) {
                            Text(
                                text = currentTab.title.uppercase(),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = animatedAccentColor,
                            )
                        }
                    }

                    Spacer(Modifier.height(18.dp))

                    // Username / Identity Field
                    OutlinedTextField(
                        value = state.username,
                        onValueChange = viewModel::onUsernameChanged,
                        label = {
                            Text(
                                text = currentTab.inputLabel,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        placeholder = {
                            Text(
                                text = currentTab.inputPlaceholder,
                                fontSize = 12.sp,
                                color = TextTertiary,
                            )
                        },
                        leadingIcon = {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(animatedAccentColor.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = currentTab.icon,
                                    contentDescription = null,
                                    tint = animatedAccentColor,
                                    modifier = Modifier.size(19.dp)
                                )
                            }
                        },
                        trailingIcon = {
                            if (state.username.isNotEmpty()) {
                                IconButton(onClick = { viewModel.onUsernameChanged("") }) {
                                    Icon(
                                        imageVector = Icons.Default.Clear,
                                        contentDescription = "Hapus",
                                        tint = TextTertiary,
                                        modifier = Modifier.size(18.dp),
                                    )
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = if (state.selectedRoleTab == 1) KeyboardType.Text else KeyboardType.Email,
                            imeAction = ImeAction.Next,
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CosmicSurface,
                            unfocusedContainerColor = CosmicSurface,
                            focusedBorderColor = animatedAccentColor,
                            unfocusedBorderColor = GlassBorder,
                            focusedLabelColor = animatedAccentColor,
                            unfocusedLabelColor = TextTertiary,
                            cursorColor = animatedAccentColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextSecondary,
                        ),
                    )

                    // Contextual Hint Banner
                    if (currentTab.hintExample.isNotEmpty()) {
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(CosmicSurface)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = currentTab.hintBadge,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = animatedAccentColor,
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "• ${currentTab.hintExample}",
                                fontSize = 10.sp,
                                color = TextTertiary,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    // Password Field
                    OutlinedTextField(
                        value = state.password,
                        onValueChange = viewModel::onPasswordChanged,
                        label = {
                            Text(
                                "Kata Sandi",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        placeholder = {
                            Text(
                                "Masukkan kata sandi akun Anda",
                                fontSize = 12.sp,
                                color = TextTertiary
                            )
                        },
                        leadingIcon = {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(animatedAccentColor.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = animatedAccentColor,
                                    modifier = Modifier.size(19.dp)
                                )
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                viewModel.login()
                            }
                        ),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (passwordVisible) "Sembunyikan" else "Tampilkan",
                                    tint = if (passwordVisible) animatedAccentColor else TextTertiary,
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CosmicSurface,
                            unfocusedContainerColor = CosmicSurface,
                            focusedBorderColor = animatedAccentColor,
                            unfocusedBorderColor = GlassBorder,
                            focusedLabelColor = animatedAccentColor,
                            unfocusedLabelColor = TextTertiary,
                            cursorColor = animatedAccentColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextSecondary,
                        ),
                    )

                    Spacer(Modifier.height(12.dp))

                    // Remember Me & Help Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { viewModel.onRememberMeChanged(!state.rememberMe) }
                                .padding(vertical = 4.dp, horizontal = 2.dp),
                        ) {
                            Checkbox(
                                checked = state.rememberMe,
                                onCheckedChange = viewModel::onRememberMeChanged,
                                colors = CheckboxDefaults.colors(
                                    checkedColor = animatedAccentColor,
                                    uncheckedColor = TextTertiary,
                                ),
                                modifier = Modifier.size(20.dp),
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = "Ingat Akun",
                                fontSize = 12.sp,
                                color = TextSecondary,
                                fontWeight = FontWeight.Medium,
                            )
                        }

                        TextButton(
                            onClick = { showHelpDialog = true },
                            modifier = Modifier.height(34.dp),
                        ) {
                            Text(
                                text = "Lupa Kata Sandi?",
                                fontSize = 12.sp,
                                color = animatedAccentColor,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }

                    // Error is now shown as a floating toast overlay (see bottom of outer Box)

                    Spacer(Modifier.height(20.dp))

                    // ── 5. Login Action CTA Button ────────────────────────────
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            viewModel.login()
                        },
                        enabled = !state.isLoading,
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent,
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .shadow(
                                elevation = if (state.isLoading) 0.dp else 12.dp,
                                shape = RoundedCornerShape(18.dp),
                                spotColor = animatedAccentColor.copy(alpha = 0.5f)
                            )
                            .clip(RoundedCornerShape(18.dp))
                            .background(
                                if (state.isLoading) {
                                    Brush.horizontalGradient(
                                        listOf(
                                            animatedAccentColor.copy(alpha = 0.6f),
                                            currentTab.secondaryColor.copy(alpha = 0.4f)
                                        )
                                    )
                                } else {
                                    Brush.horizontalGradient(
                                        listOf(
                                            animatedAccentColor,
                                            currentTab.secondaryColor
                                        )
                                    )
                                }
                            ),
                    ) {
                        AnimatedContent(
                            targetState = state.isLoading,
                            transitionSpec = { fadeIn() togetherWith fadeOut() },
                            label = "buttonContent"
                        ) { loading ->
                            if (loading) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                ) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        strokeWidth = 2.5.dp,
                                        modifier = Modifier.size(20.dp),
                                    )
                                    Spacer(Modifier.width(10.dp))
                                    Text(
                                        text = "Memverifikasi Kredensial...",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                    )
                                }
                            } else {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                ) {
                                    Text(
                                        text = "Masuk",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        letterSpacing = 0.3.sp,
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp),
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // ── Divider: "ATAU MASUK PRAKTIS" ────────────────────────
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(1.dp)
                                .background(GlassBorder)
                        )
                        Text(
                            text = "ATAU MASUK PRAKTIS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextTertiary,
                            modifier = Modifier.padding(horizontal = 10.dp),
                            letterSpacing = 1.sp
                        )
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(1.dp)
                                .background(GlassBorder)
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    // ── QR Code Option Action Button ─────────────────────────
                    Surface(
                        onClick = { viewModel.openQrScanner() },
                        shape = RoundedCornerShape(18.dp),
                        color = CosmicSurface,
                        border = androidx.compose.foundation.BorderStroke(1.2.dp, animatedAccentColor.copy(alpha = 0.5f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(animatedAccentColor.copy(alpha = 0.16f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.QrCodeScanner,
                                    contentDescription = null,
                                    tint = animatedAccentColor,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(Modifier.width(10.dp))
                            Text(
                                text = "Pindai QR Code",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                    }
                }
            }


            Spacer(Modifier.height(24.dp))

            // ── 6. Trust & Security Footer ───────────────────────────────────
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "© 2026 ${state.schoolName ?: "SCHOOL OS"} • v2.0",
                    color = TextTertiary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    letterSpacing = 0.4.sp,
                )
            }
        }
    }

        // ── Floating Error Toast Overlay ─────────────────────────────────────
        AnimatedVisibility(
            visible = state.error != null,
            enter = fadeIn(tween(300)) + slideInVertically(
                animationSpec = tween(350, easing = FastOutSlowInEasing),
                initialOffsetY = { it }
            ),
            exit = fadeOut(tween(250)) + slideOutVertically(
                animationSpec = tween(300, easing = FastOutSlowInEasing),
                targetOffsetY = { it }
            ),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
                .fillMaxWidth()
        ) {
            state.error?.let { errorMsg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(
                            elevation = 24.dp,
                            shape = RoundedCornerShape(18.dp),
                            spotColor = NeonError.copy(alpha = 0.4f)
                        )
                        .clip(RoundedCornerShape(18.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(CosmicNavy, CosmicSurface2)
                            )
                        )
                        .border(1.dp, NeonError.copy(alpha = 0.50f), RoundedCornerShape(18.dp))
                        .padding(horizontal = 16.dp, vertical = 13.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(NeonError.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = NeonError,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                        Text(
                            text = errorMsg,
                            color = TextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f),
                            lineHeight = 18.sp,
                        )
                        IconButton(
                            onClick = { viewModel.clearError() },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Clear,
                                contentDescription = "Tutup",
                                tint = TextTertiary,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }
            }
        }

        // ── 7. Help & Support Dialog ─────────────────────────────────────────
        if (showHelpDialog) {
            AlertDialog(
                onDismissRequest = { showHelpDialog = false },
                icon = {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(animatedAccentColor.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.HelpOutline,
                            contentDescription = null,
                            tint = animatedAccentColor,
                            modifier = Modifier.size(28.dp),
                        )
                    }
                },
                title = {
                    Text(
                        text = "Panduan Masuk Akun",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = TextPrimary,
                        textAlign = TextAlign.Center,
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Silakan gunakan format kredensial resmi sesuai peran Anda:",
                            fontSize = 13.sp,
                            color = TextSecondary,
                        )

                        // Role guide card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(CosmicSurface)
                                .border(1.dp, GlassBorder, RoundedCornerShape(14.dp))
                                .padding(12.dp),
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.School,
                                        null,
                                        tint = StudentNeon,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        "Siswa: 10 Digit NISN atau Email Siswa",
                                        fontSize = 12.sp,
                                        color = StudentNeon,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.MenuBook,
                                        null,
                                        tint = TeacherNeon,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        "Guru: NIP, NUPTK, atau Email PTK",
                                        fontSize = 12.sp,
                                        color = TeacherNeon,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.People, null, tint = ParentNeon, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        "Orang Tua: No. WhatsApp / HP Terdaftar",
                                        fontSize = 12.sp,
                                        color = ParentNeon,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(animatedAccentColor.copy(alpha = 0.08f))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "💡 Lupa Kata Sandi? Silakan hubungi Operator / Admin IT Sekolah Anda untuk reset kata sandi instan.",
                                fontSize = 11.sp,
                                color = TextSecondary,
                                lineHeight = 16.sp,
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { showHelpDialog = false },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = animatedAccentColor)
                    ) {
                        Text("Saya Mengerti", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                },
                containerColor = CosmicNavy,
                shape = RoundedCornerShape(22.dp),
            )
        }


        // ── 8. QR Scanner Modal Bottom Sheet ─────────────────────────────────
        if (state.showQrScanner) {
            QrScannerModalBottomSheet(
                onDismissRequest = viewModel::closeQrScanner,
                onQrCodeDetected = viewModel::loginWithQr
            )
        }
    }
}
