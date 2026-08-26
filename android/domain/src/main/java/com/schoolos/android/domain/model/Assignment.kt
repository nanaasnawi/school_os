package com.schoolos.android.domain.model

data class Assignment(
    val id: String,
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
    val materials: List<LearningMaterial> = emptyList(),
)
