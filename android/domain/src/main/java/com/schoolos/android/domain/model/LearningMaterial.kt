package com.schoolos.android.domain.model

data class LearningMaterial(
    val id: String,
    val title: String,
    val description: String?,
    val materialType: MaterialType,
    val contentBody: String? = null,
    val mediaUrl: String? = null,
    val thumbnailUrl: String? = null,
    val subject: String,
    val size: String? = null,
    val isCompleted: Boolean = false,
    val completedCount: Long = 0L
)

enum class MaterialType {
    VIDEO, DOCUMENT, ARTICLE, IMAGE
}
