package com.schoolos.android.domain.model

data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val earnedAt: String?,
)
