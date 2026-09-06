package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ClassDto(
    val id: String,
    val name: String,
    @SerialName("academic_year_id") val academicYearId: String? = null,
    @SerialName("grade_level_id") val gradeLevelId: String? = null,
    @SerialName("homeroom_teacher_id") val homeroomTeacherId: String? = null,
)

@Serializable
data class SubjectDto(
    val id: String,
    val name: String,
    val code: String? = null,
)
