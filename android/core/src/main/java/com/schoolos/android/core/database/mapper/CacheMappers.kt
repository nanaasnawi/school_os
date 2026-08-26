package com.schoolos.android.core.database.mapper

import com.schoolos.android.core.database.entity.AssignmentEntity
import com.schoolos.android.core.database.entity.NotificationEntity
import com.schoolos.android.core.database.entity.QuizEntity
import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.Notification
import com.schoolos.android.domain.model.Quiz

fun Assignment.toEntity() = AssignmentEntity(
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

fun AssignmentEntity.toDomain() = Assignment(
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

fun Quiz.toEntity() = QuizEntity(
    id = id,
    title = title,
    description = description,
    timeLimitMinutes = timeLimitMinutes,
    passingScore = passingScore,
    maxScore = maxScore,
    questionsCount = questionsCount,
    status = status,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun QuizEntity.toDomain() = Quiz(
    id = id,
    title = title,
    description = description,
    timeLimitMinutes = timeLimitMinutes,
    passingScore = passingScore,
    maxScore = maxScore,
    questionsCount = questionsCount,
    status = status,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun Notification.toEntity(userId: String) = NotificationEntity(
    id = id,
    userId = userId,
    title = title,
    body = body,
    notificationType = notificationType,
    channel = channel,
    referenceType = referenceType,
    referenceId = referenceId,
    isRead = isRead,
    readAt = readAt,
    createdAt = createdAt,
)

fun NotificationEntity.toDomain() = Notification(
    id = id,
    userId = userId,
    title = title,
    body = body,
    notificationType = notificationType,
    channel = channel,
    referenceType = referenceType,
    referenceId = referenceId,
    isRead = isRead,
    readAt = readAt,
    createdAt = createdAt,
)
