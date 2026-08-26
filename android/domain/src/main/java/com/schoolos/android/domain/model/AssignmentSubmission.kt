package com.schoolos.android.domain.model

data class AssignmentSubmission(
    val id: String,
    val assignmentId: String,
    val studentId: String,
    val content: String?,
    val fileUrl: String?,
    val submittedAt: String,
    val status: String,
    val score: Int?,
    val feedback: String?,
    val gradedAt: String?,
    val gradedBy: String?,
)
