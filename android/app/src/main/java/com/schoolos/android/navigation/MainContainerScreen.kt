package com.schoolos.android.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Grade
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.auth.AuthState
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassOverlay
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.core.navigation.Screen

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val badgeCount: Int = 0,
)

@Composable
fun MainContainerScreen(
    authManager: AuthManager,
    navController: NavHostController,
    content: @Composable (PaddingValues) -> Unit,
) {
    val authState by authManager.authState.collectAsState(initial = AuthState())
    val role = (authState.role ?: "student").lowercase()

    val isTeacher = role == "teacher" || role == "guru"
    val isParent  = role == "parent" || role == "guardian" || role == "ortu" || role == "wali"

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Role-based accent colors
    val activeNeon = when {
        isTeacher -> TeacherNeon
        isParent  -> ParentNeon
        else      -> StudentNeon
    }

    // Role-based nav items
    val navItems: List<BottomNavItem> = when {
        isTeacher -> listOf(
            BottomNavItem(Screen.Home.route,          "Beranda",  Icons.Default.Home),
            BottomNavItem(Screen.Sessions.route,      "Kelas",    Icons.Default.People),
            BottomNavItem(Screen.Assignments.route,   "Tugas",    Icons.AutoMirrored.Filled.Assignment),
            BottomNavItem(Screen.Notifications.route, "Pesan",    Icons.AutoMirrored.Filled.Message),
            BottomNavItem(Screen.Profile.route,       "Akun",     Icons.Default.Person),
        )
        isParent -> listOf(
            BottomNavItem(Screen.Home.route,          "Beranda",  Icons.Default.Home),
            BottomNavItem(Screen.Progress.route,      "Anak",     Icons.Default.ChildCare),
            BottomNavItem(Screen.Notifications.route, "Pesan",    Icons.AutoMirrored.Filled.Message),
            BottomNavItem(Screen.Profile.route,       "Profil",   Icons.Default.Person),
        )
        else -> listOf(
            BottomNavItem(Screen.Home.route,          "Beranda",  Icons.Default.Home),
            BottomNavItem(Screen.Sessions.route,      "Jadwal",   Icons.Default.CalendarMonth),
            BottomNavItem(Screen.Assignments.route,   "Tugas",    Icons.AutoMirrored.Filled.Assignment),
            BottomNavItem(Screen.Grades.route,        "Nilai",    Icons.Default.Grade),
            BottomNavItem(Screen.Profile.route,       "Akun",     Icons.Default.Person),
        )
    }

    // Determine if we should show the bottom bar
    val topLevelRoutes = navItems.map { it.route }.toSet()
    val hideBottomBar = currentRoute == null || currentRoute !in topLevelRoutes

    Scaffold(
        containerColor = CosmicBlack,
        bottomBar = {
            AnimatedVisibility(
                visible = !hideBottomBar,
                enter = slideInVertically(tween(220, easing = FastOutSlowInEasing)) { it } + fadeIn(tween(220)),
                exit  = slideOutVertically(tween(180)) { it } + fadeOut(tween(180)),
            ) {
                // Floating Pill Navigation Container (Light Style)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 12.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(32.dp))
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, RoundedCornerShape(32.dp))
                            .shadow(12.dp, RoundedCornerShape(32.dp), spotColor = GlassOverlay, ambientColor = GlassOverlay)
                            .padding(horizontal = 6.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        navItems.forEach { item ->
                            val selected = currentRoute == item.route
                            PillNavItem(
                                item = item,
                                selected = selected,
                                activeColor = activeNeon,
                                modifier = Modifier.weight(1f),
                                onClick = {
                                    if (currentRoute != item.route) {
                                        navController.navigate(item.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                },
                            )
                        }
                    }
                }
            }
        },
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            content(innerPadding)
        }
    }
}

@Composable
private fun PillNavItem(
    item: BottomNavItem,
    selected: Boolean,
    activeColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val iconSize by animateDpAsState(
        targetValue = if (selected) 20.dp else 19.dp,
        animationSpec = tween(200),
        label = "iconSize",
    )

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        if (item.badgeCount > 0) {
            BadgedBox(
                badge = {
                    Badge(containerColor = NeonError) {
                        Text("${item.badgeCount}", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                    }
                }
            ) {
                NavIcon(item, selected, activeColor, iconSize)
            }
        } else {
            NavIcon(item, selected, activeColor, iconSize)
        }

        if (selected) {
            Spacer(Modifier.height(3.dp))
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(activeColor)
            )
        } else {
            Spacer(Modifier.height(7.dp))
        }
    }
}

@Composable
private fun NavIcon(
    item: BottomNavItem,
    selected: Boolean,
    activeColor: Color,
    iconSize: androidx.compose.ui.unit.Dp,
) {
    val circleSize = 38.dp
    if (selected) {
        Box(
            modifier = Modifier
                .size(circleSize)
                .clip(CircleShape)
                .background(activeColor.copy(alpha = 0.16f))
                .border(1.dp, activeColor.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                item.icon,
                contentDescription = item.label,
                tint = activeColor,
                modifier = Modifier.size(iconSize),
            )
        }
    } else {
        Box(
            modifier = Modifier.size(circleSize),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                item.icon,
                contentDescription = item.label,
                tint = TextTertiary,
                modifier = Modifier.size(iconSize),
            )
        }
    }
}
