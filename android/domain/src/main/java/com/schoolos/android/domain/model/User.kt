package com.schoolos.android.domain.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val avatarUrl: String? = null,
)
