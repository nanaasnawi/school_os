package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MaterialCompletionToggleDto(
    @SerialName("material_id") val materialId: String,
    @SerialName("is_completed") val isCompleted: Boolean,
    val message: String? = null,
)
