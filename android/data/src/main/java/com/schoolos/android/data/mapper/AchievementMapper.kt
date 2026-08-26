package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.AchievementDto
import com.schoolos.android.domain.model.Achievement

fun AchievementDto.toDomain() = Achievement(
    id = id,
    title = title,
    description = description,
    icon = icon,
    earnedAt = earnedAt,
)
