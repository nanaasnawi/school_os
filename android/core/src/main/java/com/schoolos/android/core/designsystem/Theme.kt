package com.schoolos.android.core.designsystem

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

// ─── Modern Vibrant Educational Light Theme — Color System ──────────────────

// Base Light & Dark Theme Colors
val NeonBlue       = Color(0xFF2563EB) // Primary accent (Royal Blue)
val NeonBlueLight  = Color(0xFF3B82F6)
val NeonBlueDark   = Color(0xFF1D4ED8)
val NeonBlueBg     = Color(0xFFDBEAFE) // Light blue container

// Student accent — Rich Vibrant Violet
val StudentPrimary    = Color(0xFF7C3AED)
val StudentLight      = Color(0xFF8B5CF6)
val StudentContainer  = Color(0xFFEDE9FE)
val StudentNeon       = Color(0xFF7C3AED)

// Teacher accent — Rich Emerald Green
val TeacherPrimary    = Color(0xFF059669)
val TeacherLight      = Color(0xFF10B981)
val TeacherContainer  = Color(0xFFD1FAE5)
val TeacherNeon       = Color(0xFF059669)

// Parent accent — Warm Rose Coral
val ParentPrimary     = Color(0xFFE11D48)
val ParentLight       = Color(0xFFF43F5E)
val ParentContainer   = Color(0xFFFFE4E6)
val ParentNeon        = Color(0xFFE11D48)

// Accent palette — Vibrant Educational
val AccentElectricBlue  = Color(0xFF2563EB)
val AccentNeonGreen     = Color(0xFF10B981)
val AccentNeonAmber     = Color(0xFFF59E0B)
val AccentNeonCoral     = Color(0xFFEF4444)
val AccentNeonPurple    = Color(0xFF8B5CF6)
val AccentNeonCyan      = Color(0xFF06B6D4)
val AccentNeonPink      = Color(0xFFEC4899)

// Semantic Colors
val NeonSuccess  = Color(0xFF10B981)
val NeonWarning  = Color(0xFFF59E0B)
val NeonError    = Color(0xFFEF4444)
val NeonInfo     = Color(0xFF2563EB)

// Semantic backgrounds (solid soft containers)
val SuccessBg   = Color(0xFFD1FAE5)
val WarningBg   = Color(0xFFFEF3C7)
val ErrorBg     = Color(0xFFFFE4E6)
val InfoBg      = Color(0xFFDBEAFE)

// Legacy aliases
val PrimaryBlue       = NeonBlue
val PrimaryBlueLight  = NeonBlueLight
val SoftBlueBg        = NeonBlueBg

val AccentPurple      = StudentNeon
val AccentEmerald     = NeonSuccess
val AccentAmber       = NeonWarning
val AccentRose        = NeonError
val AccentBlue        = AccentElectricBlue
val AccentOrange      = Color(0xFFF97316)

val SuccessGreen = NeonSuccess
val WarningAmber = NeonWarning
val ErrorRed     = NeonError
val InfoBlue     = NeonInfo

// ─── Reactive Theme Color Tokens (SOLID NON-GLASS FOR MAXIMUM CLARITY) ──────
val TextPrimary: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFFF8FAFC) else Color(0xFF0F172A)

val TextSecondary: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFFCBD5E1) else Color(0xFF334155)

val TextTertiary: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF94A3B8) else Color(0xFF64748B)

val TextDisabled: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF64748B) else Color(0xFF94A3B8)

// Solid Page Background
val CosmicBlack: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF0A0E1A) else Color(0xFFF1F5F9)

// Solid Container Background
val CosmicDark: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF151D35) else Color(0xFFE2E8F0)

// SOLID Pure White Card Background (No Semi-Transparency/Glass!)
val CosmicNavy: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF1E293B) else Color(0xFFFFFFFF)

// Solid Surface Background
val CosmicSurface: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF1E293B) else Color(0xFFFFFFFF)

val CosmicSurface2: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF27354A) else Color(0xFFEEF2FF)

val CosmicSurface3: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF334155) else Color(0xFFCBD5E1)

// Solid Clean Borders
val GlassBorder: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF334155) else Color(0xFFE2E8F0)

val GlassBorder2: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0xFF475569) else Color(0xFFCBD5E1)

val GlassOverlay: Color
    @Composable get() = if (LocalIsDarkTheme.current) Color(0x40000000) else Color(0x0F000000)

val Slate950: Color @Composable get() = TextPrimary
val Slate900: Color @Composable get() = TextPrimary
val Slate800: Color @Composable get() = TextSecondary
val Slate700: Color @Composable get() = TextSecondary
val Slate600: Color @Composable get() = TextTertiary
val Slate500: Color @Composable get() = TextTertiary
val Slate400: Color @Composable get() = TextDisabled
val Slate200: Color @Composable get() = GlassBorder2
val Slate100: Color @Composable get() = GlassBorder
val Slate50: Color  @Composable get() = CosmicDark

// ─── Typography ─────────────────────────────────────────────────────────────
val SchoolOsTypography = Typography(
    displayLarge   = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Black,     fontSize = 57.sp, lineHeight = 64.sp, letterSpacing = (-0.25).sp),
    displayMedium  = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Black,     fontSize = 45.sp, lineHeight = 52.sp),
    displaySmall   = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.ExtraBold, fontSize = 36.sp, lineHeight = 44.sp),
    headlineLarge  = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.ExtraBold, fontSize = 32.sp, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Bold,     fontSize = 28.sp, lineHeight = 36.sp),
    headlineSmall  = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Bold,     fontSize = 24.sp, lineHeight = 32.sp),
    titleLarge     = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Bold,     fontSize = 20.sp, lineHeight = 28.sp),
    titleMedium    = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.SemiBold,  fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
    titleSmall     = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.SemiBold,  fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    bodyLarge      = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Normal,    fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium     = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Normal,    fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall      = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Normal,    fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge     = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Bold,      fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    labelMedium    = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.SemiBold,  fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
    labelSmall     = TextStyle(fontFamily = FontFamily.Default, fontWeight = FontWeight.Medium,    fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
)

// ─── Color Schemes ──────────────────────────────────────────────────────────

// LIGHT (default theme for modern educational app)
private val LightColorScheme = lightColorScheme(
    primary              = NeonBlue,
    onPrimary            = Color.White,
    primaryContainer     = NeonBlueBg,
    onPrimaryContainer   = NeonBlue,
    secondary            = StudentNeon,
    onSecondary          = Color.White,
    secondaryContainer   = StudentContainer,
    onSecondaryContainer = StudentNeon,
    tertiary             = TeacherNeon,
    onTertiary           = Color.White,
    tertiaryContainer    = TeacherContainer,
    onTertiaryContainer  = TeacherNeon,
    background           = Color(0xFFF1F5F9), // Solid porcelain slate background
    onBackground         = Color(0xFF0F172A), // TextPrimary
    surface              = Color(0xFFFFFFFF), // Solid pure white card surface
    onSurface            = Color(0xFF0F172A),
    surfaceVariant       = Color(0xFFE2E8F0),
    onSurfaceVariant     = Color(0xFF334155),
    outline              = Color(0xFFCBD5E1),
    outlineVariant       = Color(0xFFE2E8F0),
    error                = NeonError,
    onError              = Color.White,
    errorContainer       = ErrorBg,
    onErrorContainer     = NeonError,
    scrim                = Color(0x66000000),
)

// DARK (optional dark mode scheme)
private val DarkColorScheme = darkColorScheme(
    primary              = Color(0xFF3B82F6),
    onPrimary            = Color.White,
    primaryContainer     = Color(0xFF1E293B),
    onPrimaryContainer   = Color(0xFF93C5FD),
    secondary            = Color(0xFF8B5CF6),
    onSecondary          = Color.White,
    secondaryContainer   = Color(0xFF2E1065),
    onSecondaryContainer = Color(0xFFDDD6FE),
    tertiary             = Color(0xFF10B981),
    onTertiary           = Color.White,
    tertiaryContainer    = Color(0xFF064E3B),
    onTertiaryContainer  = Color(0xFFA7F3D0),
    background           = Color(0xFF0F172A), // Dark space background
    onBackground         = Color(0xFFF8FAFC), // Pure white / bright text
    surface              = Color(0xFF1E293B), // Dark surface / card background
    onSurface            = Color(0xFFF8FAFC),
    surfaceVariant       = Color(0xFF334155), // Secondary dark surface
    onSurfaceVariant     = Color(0xFF94A3B8), // Secondary text color in dark mode
    outline              = Color(0xFF475569), // Dark mode border
    outlineVariant       = Color(0xFF334155),
    error                = Color(0xFFEF4444),
    onError              = Color.White,
    errorContainer       = Color(0xFF7F1D1D),
    onErrorContainer     = Color(0xFFFECACA),
    scrim                = Color(0xCC000000),
)

// ─── Theme Entry Point ───────────────────────────────────────────────────────
@Composable
fun SchoolOsTheme(
    darkTheme: Boolean = false, // Default to LIGHT mode for educational UX!
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.setDecorFitsSystemWindows(window, false)
            
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    CompositionLocalProvider(
        LocalIsDarkTheme provides darkTheme
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography  = SchoolOsTypography,
            content     = content,
        )
    }
}
