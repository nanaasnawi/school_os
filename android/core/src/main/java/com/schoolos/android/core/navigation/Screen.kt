package com.schoolos.android.core.navigation

import android.net.Uri

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Home : Screen("home")
    data object Learning : Screen("learning")
    data object LearningBySubject : Screen("learning/subject/{subjectId}") {
        fun createRoute(subjectId: String) = "learning/subject/${Uri.encode(subjectId)}"
    }
    data object LearningDetail : Screen("learning/{id}") {
        fun createRoute(id: String) = "learning/$id"
    }
    data object Assignments : Screen("assignments")
    data object AssignmentsBySubject : Screen("assignments/subject/{subjectId}") {
        fun createRoute(subjectId: String) = "assignments/subject/${Uri.encode(subjectId)}"
    }
    data object AssignmentDetail : Screen("assignments/{id}") {
        fun createRoute(id: String) = "assignments/$id"
    }
    data object Quizzes : Screen("quizzes")
    data object QuizzesBySubject : Screen("quizzes/subject/{subjectId}") {
        fun createRoute(subjectId: String) = "quizzes/subject/${Uri.encode(subjectId)}"
    }
    data object QuizDetail : Screen("quizzes/{id}") {
        fun createRoute(id: String) = "quizzes/$id"
    }
    data object QuizAttempt : Screen("quizzes/{quizId}/attempt/{attemptId}") {
        fun createRoute(quizId: String, attemptId: String) = "quizzes/$quizId/attempt/$attemptId"
    }
    data object QuizResult : Screen("quizzes/{quizId}/result/{attemptId}") {
        fun createRoute(quizId: String, attemptId: String) = "quizzes/$quizId/result/$attemptId"
    }
    data object Sessions : Screen("sessions")
    data object SessionDetail : Screen("sessions/{id}") {
        fun createRoute(id: String) = "sessions/$id"
    }
    data object Grades : Screen("grades")
    data object GradeDetail : Screen("grades/{subjectId}/{subjectName}") {
        fun createRoute(subjectId: String, subjectName: String) = "grades/$subjectId/${Uri.encode(subjectName)}"
    }
    data object Progress : Screen("progress")
    data object Achievements : Screen("achievements")
    data object Notifications : Screen("notifications")
    data object Chat : Screen("chat")
    data object ChatDetail : Screen("chat/{recipientId}/{recipientName}") {
        fun createRoute(recipientId: String, recipientName: String) =
            "chat/${Uri.encode(recipientId)}/${Uri.encode(recipientName)}"
    }
    data object Profile : Screen("profile")
    data object RombelStudents : Screen("rombel/{className}/students") {
        fun createRoute(className: String) = "rombel/${Uri.encode(className)}/students"
    }
    
    // Management Routes (Teacher)
    data object AssignmentCreator : Screen("management/assignments/new")
    data object QuizBuilder : Screen("management/quizzes/new")
    data object MaterialCreator : Screen("management/materials/new")
    data object BroadcastCenter : Screen("management/broadcast")

    // Profile sub-routes
    data object ProfileSecurity : Screen("profile/security")
    data object ProfileNotifications : Screen("profile/notifications")
    data object ProfileHelp : Screen("profile/help")
    data object ProfileAbout : Screen("profile/about")

    // System Maintenance Route
    data object Maintenance : Screen("maintenance")
}

