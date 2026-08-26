package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.Achievement

interface AchievementRepository {
    suspend fun getAchievements(): Result<List<Achievement>>
}
