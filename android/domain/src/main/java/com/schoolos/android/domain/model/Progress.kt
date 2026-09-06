package com.schoolos.android.domain.model

data class Progress(
    val id: String,
    val overallProgress: Double,
    val lessonCompleted: Int,
    val lessonTotal: Int,
    val assignmentCompleted: Int,
    val assignmentTotal: Int,
    val quizCompleted: Int,
    val quizTotal: Int,
    val sessionAttended: Int,
    val sessionTotal: Int,
    val subjectName: String,
    val calculatedAt: String,
    val teacherNotes: String? = null,
    val teacherName: String? = null,
    val className: String? = null,
    val academicStatus: String? = null,
)
