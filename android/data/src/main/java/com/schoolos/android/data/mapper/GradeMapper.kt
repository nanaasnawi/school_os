package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.GradeEntryDto
import com.schoolos.android.domain.model.GradeEntry

fun GradeEntryDto.toDomain() = GradeEntry(
    id = id,
    studentId = studentId,
    classId = classId,
    subjectId = subjectId,
    componentName = componentName,
    sourceType = sourceType,
    rawScore = rawScore,
    maxRawScore = maxRawScore,
    weightedScore = weightedScore,
    weightPercentage = weightPercentage,
    calculatedAt = calculatedAt,
)
