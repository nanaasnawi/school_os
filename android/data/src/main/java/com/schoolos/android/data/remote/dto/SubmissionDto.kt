package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SubmissionDto(
    val id: String,
    @SerialName("assignment_id") val assignmentId: String,
    @SerialName("student_id") val studentId: String,
    val content: String? = null,
    @SerialName("file_url") val fileUrl: String? = null,
    @SerialName("submitted_at") val submittedAt: String,
    val status: String = "submitted",
    val score: Int? = null,
    val feedback: String? = null,
    @SerialName("graded_at") val gradedAt: String? = null,
    @SerialName("graded_by") val gradedBy: String? = null,
)

@Serializable
data class SubmitAssignmentRequest(
    @SerialName("student_id") val studentId: String,
    val content: String? = null,
    @SerialName("file_url") val fileUrl: String? = null,
)
