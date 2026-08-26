package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.NotificationDto
import com.schoolos.android.domain.model.Notification

fun NotificationDto.toDomain() = Notification(
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
