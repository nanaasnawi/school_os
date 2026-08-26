package com.schoolos.android.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ProgressDto(
    val id: String,
    val overallProgress: Double = 0.0,
    val lessonCompleted: Int = 0,
    val lessonTotal: Int = 0,
    val assignmentCompleted: Int = 0,
    val assignmentTotal: Int = 0,
    val quizCompleted: Int = 0,
    val quizTotal: Int = 0,
    val sessionAttended: Int = 0,
    val sessionTotal: Int = 0,
    val subjectName: String = "",
    val calculatedAt: String,
)
