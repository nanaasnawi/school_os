package com.schoolos.android.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "assignments")
data class AssignmentEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val instructions: String?,
    val maxScore: Int,
    val dueAt: String?,
    val assignmentType: String,
    val status: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)
