package com.schoolos.android.data.repository

import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject
import com.schoolos.android.domain.model.ClassStudent
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

    override suspend fun getClassStudents(className: String): Result<List<ClassStudent>> = runCatching {
        val response = api.getClassStudents(className = className.trim())
        if (!response.success) {
            throw Exception(response.error?.message ?: "Gagal memuat daftar murid")
        }
        (response.data ?: emptyList()).map { dto ->
            ClassStudent(
                id = dto.id.toString(),
                fullName = dto.fullName,
                nisn = dto.nisn,
                gender = dto.gender,
                status = dto.status,
                noHp = dto.noHp,
                email = dto.email,
                classId = dto.classId.toString(),
                className = dto.className,
            )
        }
    }
}
