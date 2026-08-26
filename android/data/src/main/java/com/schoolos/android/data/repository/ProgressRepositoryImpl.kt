package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.data.mapper.toDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.Progress
import com.schoolos.android.domain.repository.ProgressRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgressRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
) : ProgressRepository {

    override suspend fun getProgress(classId: String): Result<Progress> = runCatching {
        val studentId = authManager.getStudentId() ?: throw Exception("Sesi pengguna tidak valid.")
        val response = api.getProgress(studentId, classId, "")
        response.data?.toDomain()
            ?: throw Exception(response.error?.message ?: "Gagal memuat statistik progres belajar dari server API.")
    }
}
