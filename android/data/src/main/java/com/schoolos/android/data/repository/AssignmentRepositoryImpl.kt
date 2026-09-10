package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.database.dao.AssignmentDao
import com.schoolos.android.core.database.mapper.toDomain as entityToDomain
import com.schoolos.android.core.database.mapper.toEntity
import com.schoolos.android.core.network.NetworkMonitor
import com.schoolos.android.core.sync.OfflineSubmissionSyncManager
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
    private val syncManager: OfflineSubmissionSyncManager,
) : AssignmentRepository {

    init {
        syncManager.registerSubmitAction { aId, sId, cnt, fUrl ->
            try {
                val res = api.submitAssignment(
                    aId,
                    SubmitAssignmentRequest(studentId = sId, content = cnt, fileUrl = fUrl),
                )
                res.data != null
            } catch (_: Exception) {
                false
            }
        }
    }

    override suspend fun getAssignments(classId: String): Result<List<Assignment>> = runCatching {
        try {
            val queryClassId = classId.ifBlank { null }
            val response = api.getAssignments(queryClassId)
            val assignments = response.data?.map { it.dtoToDomain() }
            if (assignments != null) {
                assignmentDao.clearAll()
                assignmentDao.insertAll(assignments.map { it.toEntity() })
                return@runCatching assignments
            }
        } catch (e: Exception) {
            android.util.Log.w("AssignmentRepo", "Remote fetch failed, falling back to cache: ${e.message}")
        }
        val cached = try { assignmentDao.getAssignments().first() } catch (_: Exception) { emptyList() }
        cached.map { it.entityToDomain() }
    }

    fun getCachedAssignments(): Flow<List<Assignment>> {
        return assignmentDao.getAssignments().map { list -> list.map { it.entityToDomain() } }
    }

    override suspend fun getAssignment(id: String): Result<Assignment> = runCatching {
        try {
            val response = api.getAssignment(id)
            val domain = response.data?.dtoToDomain()
            if (domain != null) {
                assignmentDao.insert(domain.toEntity())
                return@runCatching domain
            }
        } catch (e: Exception) {
            android.util.Log.w("AssignmentRepo", "Remote fetch assignment failed, checking cache: ${e.message}")
        }
        val cached = assignmentDao.getAssignmentById(id)
        cached?.entityToDomain() ?: throw Exception("Tugas tidak ditemukan atau perangkat sedang offline.")
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
        val targetClassId = classId.ifBlank { null }
        val lessonId = java.util.UUID.randomUUID().toString()
        val request = com.schoolos.android.data.remote.CreateAssignmentRequestDto(
            lessonId = lessonId,
            title = title,
            description = description,
            instructions = instructions,
            maxScore = maxScore,
            dueAt = dueAt,
            assignmentType = assignmentType,
            classId = targetClassId
        )
        val response = api.createAssignment(request)
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Gagal membuat tugas.")
    }

    override suspend fun submitAssignment(
        assignmentId: String,
        content: String?,
        fileUrl: String?,
    ): Result<AssignmentSubmission> = runCatching {
        val studentId = authManager.getStudentId() ?: throw Exception("Sesi pengguna tidak valid. Silakan login kembali.")
        try {
            val response = api.submitAssignment(
                assignmentId,
                SubmitAssignmentRequest(studentId = studentId, content = content, fileUrl = fileUrl),
            )
            val domain = response.data?.dtoToDomain()
            if (domain != null) return@runCatching domain
        } catch (e: Exception) {
            android.util.Log.w("AssignmentRepo", "Network submit failed, queueing offline: ${e.message}")
            val queueId = syncManager.queueSubmission(
                assignmentId = assignmentId,
                studentId = studentId,
                content = content,
                fileUrl = fileUrl,
            )
            return@runCatching AssignmentSubmission(
                id = queueId,
                assignmentId = assignmentId,
                studentId = studentId,
                content = content,
                fileUrl = fileUrl,
                submittedAt = java.time.Instant.now().toString(),
                status = "PENDING_OFFLINE",
                score = null,
                feedback = null,
                gradedAt = null,
                gradedBy = null,
            )
        }
        throw Exception("Gagal mengirimkan tugas ke server.")
    }

    override suspend fun getSubmissions(assignmentId: String): Result<List<AssignmentSubmission>> = runCatching {
        val response = api.getSubmissions(assignmentId)
        response.data?.map { it.dtoToDomain() } ?: emptyList()
    }

    override suspend fun gradeSubmission(
        assignmentId: String,
        submissionId: String,
        score: Int,
        feedback: String?,
    ): Result<AssignmentSubmission> = runCatching {
        val response = api.gradeSubmission(
            assignmentId,
            submissionId,
            com.schoolos.android.data.remote.GradeSubmissionRequest(score = score, feedback = feedback),
        )
        response.data?.dtoToDomain() ?: throw Exception("Gagal menyimpan nilai: respons kosong dari server.")
    }
}
