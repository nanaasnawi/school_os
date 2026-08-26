package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance

interface SessionRepository {
    suspend fun getSessions(classId: String): Result<List<LearningSession>>
    suspend fun getSession(id: String): Result<LearningSession>
    suspend fun getAttendance(sessionId: String): Result<List<SessionAttendance>>
}
