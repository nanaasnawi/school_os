package com.schoolos.android.domain.model

data class AcademicClass(
    val id: String,
    val name: String,
    val gradeLevelId: String? = null,
)

data class AcademicSubject(
    val id: String,
    val name: String,
    val code: String? = null,
)
