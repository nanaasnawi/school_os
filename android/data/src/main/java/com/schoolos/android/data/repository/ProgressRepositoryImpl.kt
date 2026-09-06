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
        val childId = authManager.getChildId()
        val studentId = if (!childId.isNullOrBlank()) childId else (authManager.getStudentId() ?: "default-student")
        val childName = authManager.getChildName() ?: "Denis Kusuma"

        try {
            val response = api.getMyProgress()
            val dto = response.data
            if (dto != null) {
                val domain = dto.toDomain()
                return@runCatching domain.copy(
                    id = if (domain.id.isNotBlank()) domain.id else studentId,
                    subjectName = if (domain.subjectName.isNotBlank()) domain.subjectName else childName,
                    calculatedAt = if (domain.calculatedAt.isNotBlank()) domain.calculatedAt else "Hari ini",
                )
            }
        } catch (e: Exception) {
            android.util.Log.w("ProgressRepo", "Failed to fetch live progress from server: ${e.message}")
        }

        Progress(
            id = studentId,
            overallProgress = 0.0,
            lessonCompleted = 0,
            lessonTotal = 0,
            assignmentCompleted = 0,
            assignmentTotal = 0,
            quizCompleted = 0,
            quizTotal = 0,
            sessionAttended = 0,
            sessionTotal = 0,
            subjectName = childName,
            calculatedAt = "Hari ini",
        )
    }
}
