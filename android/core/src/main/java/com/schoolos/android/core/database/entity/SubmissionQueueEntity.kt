package com.schoolos.android.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "submission_queue")
data class SubmissionQueueEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val assignmentId: String,
    val studentId: String,
    val content: String?,
    val fileUrl: String?,
    val status: String = "PENDING", // PENDING, SYNCING, SYNCED, FAILED
    val retryCount: Int = 0,
    val lastError: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
)
