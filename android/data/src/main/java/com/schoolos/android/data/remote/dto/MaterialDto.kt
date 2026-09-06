package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MaterialDto(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("material_type") val materialType: String? = null,
    @SerialName("storage_key") val storageKey: String? = null,
    @SerialName("external_url") val externalUrl: String? = null,
    @SerialName("order_index") val orderIndex: Int? = null,
    val visibility: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("class_name") val className: String? = null,
    @SerialName("subject_name") val subjectName: String? = null,
    @SerialName("teacher_name") val teacherName: String? = null,
    @SerialName("chapter_title") val chapterTitle: String? = null,
    @SerialName("content_type") val contentType: String? = null,
    @SerialName("youtube_url") val youtubeUrl: String? = null,
    @SerialName("pdf_file_name") val pdfFileName: String? = null,
    @SerialName("image_preview_url") val imagePreviewUrl: String? = null,
    @SerialName("published_at") val publishedAt: String? = null,
    @SerialName("is_completed") val isCompleted: Boolean? = null,
    @SerialName("completed_count") val completedCount: Long? = null,
)
