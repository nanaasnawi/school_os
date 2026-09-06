package com.schoolos.android.data.repository

import com.schoolos.android.data.mapper.toDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.GradeEntry
import com.schoolos.android.domain.repository.GradeRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GradeRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
) : GradeRepository {

    override suspend fun getGradebook(classId: String?, subjectId: String?): Result<List<GradeEntry>> = runCatching {
        val response = api.getGradebook(classId?.ifBlank { null }, subjectId?.ifBlank { null })
        response.data?.map { it.toDomain() } ?: emptyList()
    }
}
