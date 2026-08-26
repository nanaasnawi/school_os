package com.schoolos.android.core.designsystem

import androidx.compose.runtime.compositionLocalOf

/**
 * CompositionLocals for app-wide theme state.
 * Defined in core module so any feature module can access them.
 */
val LocalThemeToggle  = compositionLocalOf<() -> Unit> { {} }
val LocalIsDarkTheme  = compositionLocalOf { false }
