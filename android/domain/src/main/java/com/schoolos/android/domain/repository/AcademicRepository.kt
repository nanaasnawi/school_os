package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject

interface AcademicRepository {
    suspend fun getClasses(): Result<List<AcademicClass>>
    suspend fun getSubjects(): Result<List<AcademicSubject>>
}
