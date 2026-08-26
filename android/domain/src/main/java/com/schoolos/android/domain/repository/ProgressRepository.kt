package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.Progress

interface ProgressRepository {
    suspend fun getProgress(classId: String): Result<Progress>
}
