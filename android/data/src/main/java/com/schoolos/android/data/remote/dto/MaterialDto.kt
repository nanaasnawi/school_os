package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MaterialDto(
    val id: String,
    @SerialName("class_name") val className: String,
    @SerialName("subject_name") val subjectName: String,
    @SerialName("teacher_name") val teacherName: String,
    @SerialName("chapter_title") val chapterTitle: String,
    @SerialName("content_type") val contentType: String,
    val description: String,
    val topics: String? = null,
    @SerialName("youtube_url") val youtubeUrl: String? = null,
    @SerialName("pdf_file_name") val pdfFileName: String? = null,
    @SerialName("image_preview_url") val imagePreviewUrl: String? = null,
    @SerialName("published_at") val publishedAt: String? = null,
)
