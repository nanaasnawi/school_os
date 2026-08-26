package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.database.dao.AssignmentDao
import com.schoolos.android.core.database.mapper.toDomain as entityToDomain
import com.schoolos.android.core.database.mapper.toEntity
import com.schoolos.android.core.network.NetworkMonitor
import com.schoolos.android.data.mapper.toDomain as dtoToDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.data.remote.dto.SubmitAssignmentRequest
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission
import com.schoolos.android.domain.repository.AssignmentRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AssignmentRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
    private val assignmentDao: AssignmentDao,
    private val networkMonitor: NetworkMonitor,
) : AssignmentRepository {

    override suspend fun getAssignments(classId: String): Result<List<Assignment>> = runCatching {
        val isOnline = try { networkMonitor.isOnline.first() } catch (_: Exception) { true }
        if (isOnline) {
            val response = api.getAssignments(classId)
            val assignments = response.data?.map { it.dtoToDomain() }
                ?: throw Exception(response.error?.message ?: "Gagal memuat daftar tugas dari server API.")
            assignmentDao.clearAll()
            assignmentDao.insertAll(assignments.map { it.toEntity() })
            assignments
        } else {
            val cached = try { with(assignmentDao.getAssignments()) { first() } } catch (_: Exception) { emptyList() }
            cached.map { it.entityToDomain() }
        }
    }

    fun getCachedAssignments(): Flow<List<Assignment>> {
        return assignmentDao.getAssignments().map { list -> list.map { it.entityToDomain() } }
    }

    override suspend fun getAssignment(id: String): Result<Assignment> = runCatching {
        val response = api.getAssignment(id)
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Tugas tidak ditemukan.")
    }

    override suspend fun createAssignment(
        title: String,
        description: String?,
        instructions: String?,
        maxScore: Int,
        dueAt: String?,
        classId: String,
        assignmentType: String
    ): Result<Assignment> = runCatching {
        throw UnsupportedOperationException("Pembuatan tugas hanya dapat dilakukan melalui Konsol Web Administrator / Guru.")
    }

    override suspend fun submitAssignment(
        assignmentId: String,
        content: String?,
        fileUrl: String?,
    ): Result<AssignmentSubmission> = runCatching {
        val studentId = authManager.getStudentId() ?: throw Exception("Sesi pengguna tidak valid. Silakan login kembali.")
        val response = api.submitAssignment(
            assignmentId,
            SubmitAssignmentRequest(studentId = studentId, content = content, fileUrl = fileUrl),
        )
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Gagal mengirimkan tugas ke server.")
    }

    override suspend fun getSubmissions(assignmentId: String): Result<List<AssignmentSubmission>> = runCatching {
        val response = api.getSubmissions(assignmentId)
        response.data?.map { it.dtoToDomain() } ?: emptyList()
    }
}
