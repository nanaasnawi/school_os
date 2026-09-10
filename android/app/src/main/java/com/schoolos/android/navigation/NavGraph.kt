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
import com.schoolos.android.feature.home.RombelStudentsScreen
import com.schoolos.android.feature.learning.LearningMaterialDetailScreen
import com.schoolos.android.feature.learning.LearningMaterialListScreen
import com.schoolos.android.feature.notifications.BroadcastCenterScreen
import com.schoolos.android.feature.notifications.NotificationListScreen
import com.schoolos.android.feature.profile.AboutAppScreen
import com.schoolos.android.feature.profile.NotificationSettingsScreen
import com.schoolos.android.feature.profile.ProfileScreen
import com.schoolos.android.feature.profile.SchoolHelpContactScreen
import com.schoolos.android.feature.profile.SecuritySettingsScreen
import com.schoolos.android.feature.progress.ProgressScreen
import com.schoolos.android.feature.quizzes.QuizAttemptScreen
import com.schoolos.android.feature.quizzes.QuizBuilderScreen
import com.schoolos.android.feature.quizzes.QuizDetailScreen
import com.schoolos.android.feature.quizzes.QuizListScreen
import com.schoolos.android.feature.quizzes.QuizResultScreen
import com.schoolos.android.feature.sessions.SessionDetailScreen
import com.schoolos.android.feature.sessions.TodayScreen
import androidx.compose.runtime.collectAsState
import com.schoolos.android.core.network.MaintenanceManager
import com.schoolos.android.feature.assignments.AssignmentCreatorScreen
import com.schoolos.android.feature.auth.MaintenanceScreen
import com.schoolos.android.feature.learning.MaterialCreatorScreen
import com.schoolos.android.core.chat.ChatManager
import com.schoolos.android.core.chat.InquiryType
import com.schoolos.android.feature.notifications.ChatDetailScreen
import com.schoolos.android.feature.notifications.TeacherChatScreen
import kotlinx.coroutines.launch

@Composable
fun NavGraph(
    authManager: AuthManager,
    maintenanceManager: MaintenanceManager,
    chatManager: ChatManager,
    navController: NavHostController = rememberNavController(),
) {
    var startCheck by remember { mutableStateOf(false) }
    var isLoggedIn by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val isMaintenance by maintenanceManager.isMaintenance.collectAsState()

    LaunchedEffect(Unit) {
        isLoggedIn = authManager.isLoggedIn
        startCheck = true
    }

    // Auto-redirect if maintenance activates while user is logged in / using app
    LaunchedEffect(isMaintenance) {
        if (isMaintenance) {
            val currentRoute = navController.currentBackStackEntry?.destination?.route
            if (currentRoute != Screen.Maintenance.route) {
                navController.navigate(Screen.Maintenance.route) {
                    launchSingleTop = true
                }
            }
        }
    }

    val authState by authManager.authState.collectAsState(initial = null)
    LaunchedEffect(authState?.isLoggedIn) {
        if (startCheck && authState != null && !authState!!.isLoggedIn) {
            val currentRoute = navController.currentBackStackEntry?.destination?.route
            if (currentRoute != null && currentRoute != Screen.Auth.route && currentRoute != Screen.Maintenance.route) {
                navController.navigate(Screen.Auth.route) {
                    popUpTo(0) { inclusive = true }
                }
            }
        }
    }

    if (!startCheck) return

    val startRoute = when {
        isMaintenance -> Screen.Maintenance.route
        isLoggedIn -> Screen.Home.route
        else -> Screen.Auth.route
    }

    MainContainerScreen(
        authManager = authManager,
        navController = navController,
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startRoute,
            modifier = androidx.compose.ui.Modifier.padding(
                bottom = innerPadding.calculateBottomPadding()
            ),
        ) {
            // Maintenance Gatekeeper Screen
            composable(Screen.Maintenance.route) {
                MaintenanceScreen(
                    maintenanceManager = maintenanceManager,
                    onMaintenanceResolved = {
                        if (authManager.isLoggedIn) {
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Maintenance.route) { inclusive = true }
                            }
                        } else {
                            navController.navigate(Screen.Auth.route) {
                                popUpTo(Screen.Maintenance.route) { inclusive = true }
                            }
                        }
                    }
                )
            }

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
                    onNavigateToSessionDetail = { sessionId -> navController.navigate(Screen.SessionDetail.createRoute(sessionId)) },
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
                    onNavigateToBroadcastCenter = { navController.navigate(Screen.BroadcastCenter.route) },
                    onNavigateToAssignmentsWithSubject = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.AssignmentsBySubject.createRoute(subject))
                        else navController.navigate(Screen.Assignments.route)
                    },
                    onNavigateToQuizzesWithSubject = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.QuizzesBySubject.createRoute(subject))
                        else navController.navigate(Screen.Quizzes.route)
                    },
                    onNavigateToLearningWithSubject = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.LearningBySubject.createRoute(subject))
                        else navController.navigate(Screen.Learning.route)
                    },
                    onNavigateToRombelStudents = { className ->
                        navController.navigate(Screen.RombelStudents.createRoute(className))
                    }
                )
            }

            // Learning Materials
            composable(Screen.Learning.route) {
                LearningMaterialListScreen(
                    onBack = { navController.popBackStack() },
                    onMaterialClick = { id -> navController.navigate(Screen.LearningDetail.createRoute(id)) },
                    onCreateMaterial = { navController.navigate(Screen.MaterialCreator.route) },
                )
            }
            composable(
                route = Screen.LearningBySubject.route,
                arguments = listOf(navArgument("subjectId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val subjectId = backStackEntry.arguments?.getString("subjectId") ?: ""
                LearningMaterialListScreen(
                    subjectId = subjectId,
                    onBack = { navController.popBackStack() },
                    onMaterialClick = { id -> navController.navigate(Screen.LearningDetail.createRoute(id)) },
                    onCreateMaterial = { navController.navigate(Screen.MaterialCreator.route) },
                )
            }
            composable(
                route = Screen.LearningDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { backStackEntry ->
                val materialId = backStackEntry.arguments?.getString("id") ?: ""
                LearningMaterialDetailScreen(
                    materialId = materialId,
                    onBack = { navController.popBackStack() },
                    onCreateMaterial = { navController.navigate(Screen.MaterialCreator.route) },
                    onAskTeacher = { title, id, subject ->
                        val thread = chatManager.createInquiry(
                            studentId = authState?.userId ?: "std-current",
                            studentName = authState?.name ?: "Siswa",
                            studentClass = authState?.className ?: "Kelas",
                            subjectName = subject.ifBlank { "Materi Ajar" },
                            inquiryType = InquiryType.MATERIAL,
                            referenceTitle = title,
                            referenceId = id,
                            initialQuestion = "Halo Bapak/Ibu guru, saya ingin bertanya mengenai materi '$title' ini karena ada bagian yang belum saya pahami."
                        )
                        navController.navigate(Screen.ChatDetail.createRoute(thread.id, thread.studentName))
                    }
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
                    onOpenAssignments = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.AssignmentsBySubject.createRoute(subject))
                        else navController.navigate(Screen.Assignments.route)
                    },
                    onOpenQuizzes = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.QuizzesBySubject.createRoute(subject))
                        else navController.navigate(Screen.Quizzes.route)
                    },
                    onOpenMaterials = { subject ->
                        if (subject.isNotBlank()) navController.navigate(Screen.LearningBySubject.createRoute(subject))
                        else navController.navigate(Screen.Learning.route)
                    }
                )
            }

            // Assignments
            composable(Screen.Assignments.route) {
                AssignmentListScreen(
                    onAssignmentClick = { id -> navController.navigate(Screen.AssignmentDetail.createRoute(id)) },
                    onCreateAssignment = { navController.navigate(Screen.AssignmentCreator.route) },
                    onCreateQuiz = { navController.navigate(Screen.QuizBuilder.route) },
                )
            }
            composable(
                route = Screen.AssignmentsBySubject.route,
                arguments = listOf(navArgument("subjectId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val subjectId = backStackEntry.arguments?.getString("subjectId") ?: ""
                AssignmentListScreen(
                    subjectId = subjectId,
                    onAssignmentClick = { id -> navController.navigate(Screen.AssignmentDetail.createRoute(id)) },
                    onCreateAssignment = { navController.navigate(Screen.AssignmentCreator.route) },
                    onCreateQuiz = { navController.navigate(Screen.QuizBuilder.route) },
                )
            }
            composable(
                route = Screen.AssignmentDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                AssignmentDetailScreen(
                    onBack = { navController.popBackStack() },
                    onOpenMaterial = { id -> navController.navigate(Screen.LearningDetail.createRoute(id)) },
                    onAskTeacher = { title, id, subject, teacher ->
                        val thread = chatManager.createInquiry(
                            studentId = authState?.userId ?: "std-current",
                            studentName = authState?.name ?: "Siswa",
                            studentClass = authState?.className ?: "Kelas",
                            teacherName = teacher.ifBlank { "Guru Pengampu" },
                            subjectName = subject.ifBlank { "Tugas" },
                            inquiryType = InquiryType.ASSIGNMENT,
                            referenceTitle = title,
                            referenceId = id,
                            initialQuestion = "Halo Bapak/Ibu guru, saya ingin berkonsultasi mengenai tugas '$title' ini karena ada hal yang ingin saya tanyakan."
                        )
                        navController.navigate(Screen.ChatDetail.createRoute(thread.id, thread.studentName))
                    }
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
                route = Screen.QuizzesBySubject.route,
                arguments = listOf(navArgument("subjectId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val subjectId = backStackEntry.arguments?.getString("subjectId") ?: ""
                QuizListScreen(
                    subjectId = subjectId,
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
                    onBack = { navController.popBackStack() },
                    onNotificationClick = { notification ->
                        NotificationDeepLink.navigate(notification.referenceType, notification.referenceId, navController)
                    },
                )
            }

            // Chat & Q&A Consultation (Teacher & Student)
            composable(Screen.Chat.route) {
                TeacherChatScreen(
                    chatManager = chatManager,
                    onOpenThread = { threadId, studentName ->
                        navController.navigate(Screen.ChatDetail.createRoute(threadId, studentName))
                    }
                )
            }
            composable(
                route = Screen.ChatDetail.route,
                arguments = listOf(
                    navArgument("recipientId") { type = NavType.StringType },
                    navArgument("recipientName") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val threadId = backStackEntry.arguments?.getString("recipientId") ?: ""
                ChatDetailScreen(
                    threadId = threadId,
                    chatManager = chatManager,
                    onBack = { navController.popBackStack() },
                    onOpenReference = { type, refId ->
                        if (!refId.isNullOrBlank()) {
                            when (type) {
                                InquiryType.MATERIAL -> navController.navigate(Screen.LearningDetail.createRoute(refId))
                                InquiryType.ASSIGNMENT -> navController.navigate(Screen.AssignmentDetail.createRoute(refId))
                                else -> {}
                            }
                        }
                    },
                    isTeacherMode = authState?.isTeacher ?: true
                )
            }

            // Progress
            composable(Screen.Progress.route) {
                ProgressScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToAssignments = { navController.navigate(Screen.Assignments.route) },
                )
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
                    onNavigateToSecurity = {
                        navController.navigate(Screen.ProfileSecurity.route)
                    },
                    onNavigateToNotifications = {
                        navController.navigate(Screen.ProfileNotifications.route)
                    },
                    onNavigateToHelp = {
                        navController.navigate(Screen.ProfileHelp.route)
                    },
                    onNavigateToAbout = {
                        navController.navigate(Screen.ProfileAbout.route)
                    },
                )
            }
            composable(Screen.ProfileSecurity.route) {
                SecuritySettingsScreen(
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.ProfileNotifications.route) {
                NotificationSettingsScreen(
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.ProfileHelp.route) {
                SchoolHelpContactScreen(
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.ProfileAbout.route) {
                AboutAppScreen(
                    onBack = { navController.popBackStack() }
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
            composable(Screen.MaterialCreator.route) {
                MaterialCreatorScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }
            composable(Screen.BroadcastCenter.route) {
                BroadcastCenterScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // Rombel Students List (Homeroom Teacher View)
            composable(
                route = Screen.RombelStudents.route,
                arguments = listOf(navArgument("className") { type = NavType.StringType }),
            ) { backStackEntry ->
                val className = backStackEntry.arguments?.getString("className") ?: ""
                RombelStudentsScreen(
                    className = className,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
