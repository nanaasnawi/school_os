package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.LearningSessionDto
import com.schoolos.android.data.remote.dto.SessionAttendanceDto
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.SessionAttendance

fun LearningSessionDto.toDomain() = LearningSession(
    id = id,
    lessonId = lessonId,
    classId = classId,
    teacherId = teacherId,
    scheduledAt = scheduledAt,
    startedAt = startedAt,
    endedAt = endedAt,
    status = status,
    notes = notes,
)

fun SessionAttendanceDto.toDomain() = SessionAttendance(
    id = id,
    sessionId = sessionId,
    studentId = studentId,
    status = status,
    checkedInAt = checkedInAt,
    notes = notes,
)
