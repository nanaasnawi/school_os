package com.schoolos.android.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "learning_materials")
data class LearningMaterialEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val materialType: String,
    val contentBody: String?,
    val mediaUrl: String?,
    val thumbnailUrl: String?,
    val subject: String,
    val size: String?,
    val isCompleted: Boolean,
    val completedCount: Long,
    val cachedAt: Long = System.currentTimeMillis(),
)
