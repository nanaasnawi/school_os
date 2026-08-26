package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LearningSessionDto(
    val id: String,
    @SerialName("lesson_id") val lessonId: String,
    @SerialName("class_id") val classId: String,
    @SerialName("teacher_id") val teacherId: String,
    @SerialName("scheduled_at") val scheduledAt: String? = null,
    @SerialName("started_at") val startedAt: String? = null,
    @SerialName("ended_at") val endedAt: String? = null,
    val status: String,
    val notes: String? = null,
)

@Serializable
data class SessionAttendanceDto(
    val id: String,
    @SerialName("session_id") val sessionId: String,
    @SerialName("student_id") val studentId: String,
    val status: String,
    @SerialName("checked_in_at") val checkedInAt: String? = null,
    val notes: String? = null,
)
