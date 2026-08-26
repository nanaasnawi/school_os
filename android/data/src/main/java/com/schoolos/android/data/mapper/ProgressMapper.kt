package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.ProgressDto
import com.schoolos.android.domain.model.Progress

fun ProgressDto.toDomain() = Progress(
    id = id,
    overallProgress = overallProgress,
    lessonCompleted = lessonCompleted,
    lessonTotal = lessonTotal,
    assignmentCompleted = assignmentCompleted,
    assignmentTotal = assignmentTotal,
    quizCompleted = quizCompleted,
    quizTotal = quizTotal,
    sessionAttended = sessionAttended,
    sessionTotal = sessionTotal,
    subjectName = subjectName,
    calculatedAt = calculatedAt,
)
