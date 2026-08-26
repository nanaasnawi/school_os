package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GradeEntryDto(
    val id: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("class_id") val classId: String,
    @SerialName("subject_id") val subjectId: String,
    @SerialName("component_name") val componentName: String,
    @SerialName("source_type") val sourceType: String,
    @SerialName("raw_score") val rawScore: Double? = null,
    @SerialName("max_raw_score") val maxRawScore: Double? = null,
    @SerialName("weighted_score") val weightedScore: Double? = null,
    @SerialName("weight_percentage") val weightPercentage: Double? = null,
    @SerialName("calculated_at") val calculatedAt: String,
)
