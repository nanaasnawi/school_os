package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.AssignmentDto
import com.schoolos.android.data.remote.dto.SubmissionDto
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission

fun AssignmentDto.toDomain() = Assignment(
    id = id,
    title = title,
    description = description,
    instructions = instructions,
    maxScore = maxScore,
    dueAt = dueAt,
    assignmentType = assignmentType,
    status = status,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun SubmissionDto.toDomain() = AssignmentSubmission(
    id = id,
    assignmentId = assignmentId,
    studentId = studentId,
    content = content,
    fileUrl = fileUrl,
    submittedAt = submittedAt,
    status = status,
    score = score,
    feedback = feedback,
    gradedAt = gradedAt,
    gradedBy = gradedBy,
)
