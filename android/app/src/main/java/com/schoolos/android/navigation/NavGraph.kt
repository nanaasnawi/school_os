package com.schoolos.android.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.navigation.NotificationDeepLink
import com.schoolos.android.core.navigation.Screen
import com.schoolos.android.feature.achievements.AchievementScreen
import com.schoolos.android.feature.assignments.AssignmentDetailScreen
import com.schoolos.android.feature.assignments.AssignmentListScreen
import com.schoolos.android.feature.auth.LoginScreen
import com.schoolos.android.feature.grades.GradeDetailScreen
import com.schoolos.android.feature.grades.GradebookListScreen
import com.schoolos.android.feature.home.HomeScreen
import com.schoolos.android.feature.learning.LearningMaterialDetailScreen
import com.schoolos.android.feature.learning.LearningMaterialListScreen
import com.schoolos.android.feature.notifications.BroadcastCenterScreen
import com.schoolos.android.feature.notifications.NotificationListScreen
import com.schoolos.android.feature.profile.ProfileScreen
import com.schoolos.android.feature.progress.ProgressScreen
import com.schoolos.android.feature.quizzes.QuizAttemptScreen
import com.schoolos.android.feature.quizzes.QuizBuilderScreen
import com.schoolos.android.feature.quizzes.QuizDetailScreen
import com.schoolos.android.feature.quizzes.QuizListScreen
import com.schoolos.android.feature.quizzes.QuizResultScreen
import com.schoolos.android.feature.sessions.SessionDetailScreen
import com.schoolos.android.feature.sessions.TodayScreen
import com.schoolos.android.feature.assignments.AssignmentCreatorScreen
import kotlinx.coroutines.launch

@Composable
fun NavGraph(
    authManager: AuthManager,
    navController: NavHostController = rememberNavController(),
) {
    var startCheck by remember { mutableStateOf(false) }
    var isLoggedIn by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        isLoggedIn = authManager.isLoggedIn
        startCheck = true
    }

    if (!startCheck) return

    MainContainerScreen(
        authManager = authManager,
        navController = navController,
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Home.route else Screen.Auth.route,
            modifier = androidx.compose.ui.Modifier.padding(innerPadding),
        ) {
            // Auth
            composable(Screen.Auth.route) {
                LoginScreen(onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Auth.route) { this.inclusive = true }
                    }
                })
            }

            // Home
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToSessions = { navController.navigate(Screen.Sessions.route) },
                    onNavigateToAssignments = { navController.navigate(Screen.Assignments.route) },
                    onNavigateToQuizzes = { navController.navigate(Screen.Quizzes.route) },
                    onNavigateToNotifications = { navController.navigate(Screen.Notifications.route) },
                    onNavigateToGrades = { navController.navigate(Screen.Grades.route) },
                    onNavigateToProgress = { navController.navigate(Screen.Progress.route) },
                    onNavigateToAchievements = { navController.navigate(Screen.Achievements.route) },
                    onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                    onNavigateToLearning = { navController.navigate(Screen.Learning.route) },
                    onNavigateToAssignmentCreator = { navController.navigate(Screen.AssignmentCreator.route) },
                    onNavigateToQuizBuilder = { navController.navigate(Screen.QuizBuilder.route) },
                    onNavigateToBroadcastCenter = { navController.navigate(Screen.BroadcastCenter.route) }
                )
            }

            // Learning Materials
            composable(Screen.Learning.route) {
                LearningMaterialListScreen(
                    onBack = { navController.popBackStack() },
                    onMaterialClick = { id -> navController.navigate(Screen.LearningDetail.createRoute(id)) }
                )
            }
            composable(
                route = Screen.LearningDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { backStackEntry ->
                val materialId = backStackEntry.arguments?.getString("id") ?: ""
                LearningMaterialDetailScreen(
                    materialId = materialId,
                    onBack = { navController.popBackStack() }
                )
            }

            // Sessions
            composable(Screen.Sessions.route) {
                TodayScreen(
                    onSessionClick = { id -> navController.navigate(Screen.SessionDetail.createRoute(id)) },
                )
            }
            composable(
                route = Screen.SessionDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                SessionDetailScreen(
                    onBack = { navController.popBackStack() },
                    onOpenAssignments = { navController.navigate(Screen.Assignments.route) },
                    onOpenQuizzes = { navController.navigate(Screen.Quizzes.route) },
                    onOpenMaterials = { navController.navigate(Screen.Learning.route) }
                )
            }

            // Assignments
            composable(Screen.Assignments.route) {
                AssignmentListScreen(
                    onAssignmentClick = { id -> navController.navigate(Screen.AssignmentDetail.createRoute(id)) },
                )
            }
            composable(
                route = Screen.AssignmentDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                AssignmentDetailScreen(
                    onBack = { navController.popBackStack() },
                    onOpenMaterial = { id -> navController.navigate(Screen.LearningDetail.createRoute(id)) }
                )
            }

            // Quizzes
            composable(Screen.Quizzes.route) {
                QuizListScreen(
                    onBack = { navController.popBackStack() },
                    onQuizClick = { id -> navController.navigate(Screen.QuizDetail.createRoute(id)) },
                )
            }
            composable(
                route = Screen.QuizDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { backStackEntry ->
                val quizId = backStackEntry.arguments?.getString("id") ?: ""
                QuizDetailScreen(
                    onBack = { navController.popBackStack() },
                    onAttemptStarted = { attemptId ->
                        navController.navigate(Screen.QuizAttempt.createRoute(quizId, attemptId))
                    },
                )
            }
            composable(
                route = Screen.QuizAttempt.route,
                arguments = listOf(
                    navArgument("quizId") { type = NavType.StringType },
                    navArgument("attemptId") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val quizId = backStackEntry.arguments?.getString("quizId") ?: ""
                QuizAttemptScreen(
                    onBack = { navController.popBackStack() },
                    onSubmitted = { attemptId ->
                        navController.navigate(Screen.QuizResult.createRoute(quizId, attemptId)) {
                            popUpTo(Screen.Quizzes.route)
                        }
                    },
                )
            }
            composable(
                route = Screen.QuizResult.route,
                arguments = listOf(
                    navArgument("quizId") { type = NavType.StringType },
                    navArgument("attemptId") { type = NavType.StringType },
                ),
            ) {
                QuizResultScreen(onBack = { navController.popBackStack(Screen.Home.route, false) })
            }

            // Gradebook
            composable(Screen.Grades.route) {
                GradebookListScreen(
                    onSubjectClick = { subjectId, subjectName ->
                        navController.navigate(Screen.GradeDetail.createRoute(subjectId, subjectName))
                    },
                )
            }
            composable(
                route = Screen.GradeDetail.route,
                arguments = listOf(
                    navArgument("subjectId") { type = NavType.StringType },
                    navArgument("subjectName") { type = NavType.StringType },
                ),
            ) {
                GradeDetailScreen(onBack = { navController.popBackStack() })
            }

            // Notifications
            composable(Screen.Notifications.route) {
                NotificationListScreen(
                    onNotificationClick = { notification ->
                        NotificationDeepLink.navigate(notification.referenceType, notification.referenceId, navController)
                    },
                )
            }

            // Progress
            composable(Screen.Progress.route) {
                ProgressScreen()
            }

            // Achievements
            composable(Screen.Achievements.route) {
                AchievementScreen(onBack = { navController.popBackStack() })
            }

            // Profile
            composable(Screen.Profile.route) {
                ProfileScreen(
                    onLogout = {
                        scope.launch {
                            authManager.clearSession()
                            navController.navigate(Screen.Auth.route) {
                                popUpTo(0) { this.inclusive = true }
                            }
                        }
                    },
                )
            }

            // Management
            composable(Screen.AssignmentCreator.route) {
                AssignmentCreatorScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }
            composable(Screen.QuizBuilder.route) {
                QuizBuilderScreen(
                    onBack = { navController.popBackStack() },
                    onFinish = { navController.popBackStack() }
                )
            }
            composable(Screen.BroadcastCenter.route) {
                BroadcastCenterScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }
        }
    }
}
