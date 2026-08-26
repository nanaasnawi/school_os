package com.schoolos.android.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class AchievementDto(
    val id: String,
    val title: String,
    val description: String = "",
    val icon: String = "🏆",
    val earnedAt: String? = null,
)
