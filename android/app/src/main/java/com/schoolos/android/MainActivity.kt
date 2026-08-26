package com.schoolos.android

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.designsystem.LocalIsDarkTheme
import com.schoolos.android.core.designsystem.LocalThemeToggle
import com.schoolos.android.core.designsystem.SchoolOsTheme
import com.schoolos.android.navigation.NavGraph
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var authManager: AuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Load saved theme preference (default = LIGHT)
        val prefs = getSharedPreferences("school_os_prefs", Context.MODE_PRIVATE)

        setContent {
            var isDarkTheme by remember {
                mutableStateOf(prefs.getBoolean("dark_theme", false))
            }

            val toggleTheme: () -> Unit = {
                isDarkTheme = !isDarkTheme
                prefs.edit().putBoolean("dark_theme", isDarkTheme).apply()
            }

            CompositionLocalProvider(
                LocalThemeToggle provides toggleTheme,
                LocalIsDarkTheme  provides isDarkTheme,
            ) {
                SchoolOsTheme(darkTheme = isDarkTheme) {
                    Surface(modifier = Modifier.fillMaxSize()) {
                        NavGraph(authManager = authManager)
                    }
                }
            }
        }
    }
}
