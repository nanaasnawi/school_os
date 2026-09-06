package com.schoolos.android.data.repository

import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject
import com.schoolos.android.domain.repository.AcademicRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AcademicRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
) : AcademicRepository {

    override suspend fun getClasses(): Result<List<AcademicClass>> = runCatching {
        val response = api.getClasses(pageSize = 100)
        (response.data ?: emptyList()).map { dto ->
            AcademicClass(
                id = dto.id,
                name = dto.name,
                gradeLevelId = dto.gradeLevelId,
            )
        }
    }

    override suspend fun getSubjects(): Result<List<AcademicSubject>> = runCatching {
        val response = api.getSubjects()
        (response.data ?: emptyList()).map { dto ->
            AcademicSubject(
                id = dto.id,
                name = dto.name,
                code = dto.code,
            )
        }
    }
}
