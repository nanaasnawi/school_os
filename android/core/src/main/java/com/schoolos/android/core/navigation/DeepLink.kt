package com.schoolos.android.core.navigation

import android.net.Uri
import androidx.navigation.NavController

object NotificationDeepLink {

    fun navigate(referenceType: String?, referenceId: String?, navController: NavController) {
        val route = resolve(referenceType, referenceId) ?: return
        navController.navigate(route)
    }

    private fun resolve(referenceType: String?, referenceId: String?): String? {
        if (referenceType == null) return null

        return when {
            referenceType.contains("assignment.published") ||
            referenceType.contains("assignment.submitted") ||
            referenceType.contains("assignment.grade") -> {
                if (referenceId != null) Screen.AssignmentDetail.createRoute(referenceId)
                else Screen.Assignments.route
            }
            referenceType.contains("quiz.published") ||
            referenceType.contains("quiz.attempt") ||
            referenceType.contains("quiz.graded") -> {
                if (referenceId != null) Screen.QuizDetail.createRoute(referenceId)
                else Screen.Quizzes.route
            }
            referenceType.contains("session.lesson") -> {
                if (referenceId != null) Screen.SessionDetail.createRoute(referenceId)
                else Screen.Sessions.route
            }
            referenceType.contains("assessment.grade") ||
            referenceType.contains("grade.released") ||
            referenceType.contains("grade_calculated") -> {
                if (referenceId != null) Screen.GradeDetail.createRoute(referenceId, Uri.encode("Grades"))
                else Screen.Grades.route
            }
            referenceType.contains("progress") -> Screen.Progress.route
            referenceType.contains("achievement") -> Screen.Achievements.route
            else -> null
        }
    }
}
