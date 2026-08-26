package com.schoolos.android.domain.model

data class LearningSession(
    val id: String,
    val lessonId: String,
    val classId: String,
    val teacherId: String,
    val scheduledAt: String?,
    val startedAt: String?,
    val endedAt: String?,
    val status: String,
    val notes: String?,
)

data class SessionAttendance(
    val id: String,
    val sessionId: String,
    val studentId: String,
    val status: String,
    val checkedInAt: String?,
    val notes: String?,
)
