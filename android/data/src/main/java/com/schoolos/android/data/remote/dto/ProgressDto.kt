package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProgressDto(
    val id: String = "",
    @SerialName("overall_progress") val overallProgress: Double = 0.0,
    @SerialName("lesson_completed") val lessonCompleted: Int = 0,
    @SerialName("lesson_total") val lessonTotal: Int = 0,
    @SerialName("assignment_completed") val assignmentCompleted: Int = 0,
    @SerialName("assignment_total") val assignmentTotal: Int = 0,
    @SerialName("quiz_completed") val quizCompleted: Int = 0,
    @SerialName("quiz_total") val quizTotal: Int = 0,
    @SerialName("session_attended") val sessionAttended: Int = 0,
    @SerialName("session_total") val sessionTotal: Int = 0,
    @SerialName("subject_name") val subjectName: String = "Semua Mata Pelajaran",
    @SerialName("calculated_at") val calculatedAt: String = "",
    @SerialName("teacher_notes") val teacherNotes: String? = null,
    @SerialName("teacher_name") val teacherName: String? = null,
    @SerialName("class_name") val className: String? = null,
    @SerialName("academic_status") val academicStatus: String? = null,
)
