package com.schoolos.android.domain.model

data class ClassStudent(
    val id: String,
    val fullName: String,
    val nisn: String,
    val gender: String? = null,
    val status: String = "ACTIVE",
    val noHp: String? = null,
    val email: String? = null,
    val classId: String,
    val className: String,
)
