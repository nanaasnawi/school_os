package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.GradeEntry

interface GradeRepository {
    suspend fun getGradebook(classId: String, subjectId: String? = null): Result<List<GradeEntry>>
}
