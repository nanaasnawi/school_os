package com.schoolos.android.data.repository

import com.schoolos.android.data.mapper.toDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance
import com.schoolos.android.domain.repository.SessionRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
) : SessionRepository {

    override suspend fun getSessions(classId: String): Result<List<LearningSession>> = runCatching {
        val response = api.getSessions(classId)
        response.data?.map { it.toDomain() }
            ?: throw Exception(response.error?.message ?: "Gagal memuat sesi pembelajaran dari server API.")
    }

    override suspend fun getSession(id: String): Result<LearningSession> = runCatching {
        val response = api.getSession(id)
        response.data?.toDomain()
            ?: throw Exception(response.error?.message ?: "Sesi pembelajaran tidak ditemukan.")
    }

    override suspend fun getAttendance(sessionId: String): Result<List<SessionAttendance>> = runCatching {
        val response = api.getSessionAttendance(sessionId)
        response.data?.map { it.toDomain() }
            ?: throw Exception(response.error?.message ?: "Gagal memuat presensi sesi.")
    }
}
