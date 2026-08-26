package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.data.mapper.toDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.Achievement
import com.schoolos.android.domain.repository.AchievementRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AchievementRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
) : AchievementRepository {

    override suspend fun getAchievements(): Result<List<Achievement>> = runCatching {
        val studentId = authManager.getStudentId() ?: throw Exception("Sesi pengguna tidak valid.")
        val response = api.getStudentAchievements(studentId)
        response.data?.map { it.toDomain() }
            ?: throw Exception(response.error?.message ?: "Gagal memuat lencana pencapaian dari server API.")
    }
}
