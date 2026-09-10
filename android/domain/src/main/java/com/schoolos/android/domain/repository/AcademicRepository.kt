package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject
import com.schoolos.android.domain.model.ClassStudent

interface AcademicRepository {
    suspend fun getClasses(): Result<List<AcademicClass>>
    suspend fun getSubjects(): Result<List<AcademicSubject>>
    suspend fun getClassStudents(className: String): Result<List<ClassStudent>>
}
