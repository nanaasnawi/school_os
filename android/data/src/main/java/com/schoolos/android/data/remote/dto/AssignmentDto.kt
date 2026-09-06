package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AssignmentDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val instructions: String? = null,
    @SerialName("max_score") val maxScore: Int = 100,
    @SerialName("due_at") val dueAt: String? = null,
    @SerialName("assignment_type") val assignmentType: String = "individual",
    val status: String = "draft",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("class_id") val classId: String? = null,
    @SerialName("class_name") val className: String? = null,
    @SerialName("subject_name") val subjectName: String? = null,
    @SerialName("teacher_name") val teacherName: String? = null,
)
