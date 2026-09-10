package com.schoolos.android.data.repository

import com.schoolos.android.core.database.dao.LearningMaterialDao
import com.schoolos.android.core.database.entity.LearningMaterialEntity
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.domain.model.LearningMaterial
import com.schoolos.android.domain.model.MaterialType
import com.schoolos.android.domain.repository.LearningMaterialRepository
import timber.log.Timber
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LearningMaterialRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val materialDao: LearningMaterialDao,
) : LearningMaterialRepository {

    override suspend fun getMaterials(): Result<List<LearningMaterial>> = runCatching {
        try {
            val response = api.getMaterials()
            val materials = response.data?.map { dto ->
                val type = when (dto.materialType?.lowercase() ?: dto.contentType?.lowercase()) {
                    "video" -> MaterialType.VIDEO
                    "pdf", "document" -> MaterialType.DOCUMENT
                    "image" -> MaterialType.IMAGE
                    else -> MaterialType.ARTICLE
                }
                val parts = (dto.description ?: "").split(" • ")
                val subject = if (parts.isNotEmpty() && parts[0].isNotBlank()) parts[0] else (dto.subjectName ?: "Umum")
                val rawUrl = dto.externalUrl ?: dto.youtubeUrl ?: dto.storageKey

                LearningMaterial(
                    id = dto.id,
                    title = dto.title.ifBlank { dto.chapterTitle ?: "Modul Pembelajaran" },
                    description = dto.description,
                    materialType = type,
                    contentBody = dto.description,
                    mediaUrl = rawUrl,
                    thumbnailUrl = dto.imagePreviewUrl ?: (if (type == MaterialType.IMAGE) rawUrl else null),
                    subject = subject,
                    size = dto.storageKey ?: dto.pdfFileName ?: "PDF Digital",
                    isCompleted = dto.isCompleted ?: false,
                    completedCount = dto.completedCount ?: 0L,
                )
            } ?: emptyList()

            if (materials.isNotEmpty()) {
                val entities = materials.map { m ->
                    LearningMaterialEntity(
                        id = m.id,
                        title = m.title,
                        description = m.description,
                        materialType = m.materialType.name,
                        contentBody = m.contentBody,
                        mediaUrl = m.mediaUrl,
                        thumbnailUrl = m.thumbnailUrl,
                        subject = m.subject,
                        size = m.size,
                        isCompleted = m.isCompleted,
                        completedCount = m.completedCount,
                    )
                }
                materialDao.clearAll()
                materialDao.insertAll(entities)
            }
            return@runCatching materials
        } catch (e: Exception) {
            Timber.w(e, "Remote fetch materials failed, fallback to local Room database cache")
        }

        // Fallback to offline Room database cache
        val cached = materialDao.getMaterialsList()
        cached.map { entity ->
            val type = try { MaterialType.valueOf(entity.materialType) } catch (_: Exception) { MaterialType.ARTICLE }
            LearningMaterial(
                id = entity.id,
                title = entity.title,
                description = entity.description,
                materialType = type,
                contentBody = entity.contentBody,
                mediaUrl = entity.mediaUrl,
                thumbnailUrl = entity.thumbnailUrl,
                subject = entity.subject,
                size = entity.size,
                isCompleted = entity.isCompleted,
                completedCount = entity.completedCount,
            )
        }
    }

    override suspend fun getMaterialById(id: String): Result<LearningMaterial> = runCatching {
        try {
            val response = api.getMaterial(id)
            val dto = response.data ?: throw Exception(response.error?.message ?: "Materi tidak ditemukan.")
            val type = when (dto.materialType?.lowercase() ?: dto.contentType?.lowercase()) {
                "video" -> MaterialType.VIDEO
                "pdf", "document" -> MaterialType.DOCUMENT
                "image" -> MaterialType.IMAGE
                else -> MaterialType.ARTICLE
            }
            val parts = (dto.description ?: "").split(" • ")
            val subject = if (parts.isNotEmpty() && parts[0].isNotBlank()) parts[0] else (dto.subjectName ?: "Umum")
            val rawUrl = dto.externalUrl ?: dto.youtubeUrl ?: dto.storageKey

            val domain = LearningMaterial(
                id = dto.id,
                title = dto.title.ifBlank { dto.chapterTitle ?: "Modul Pembelajaran" },
                description = dto.description,
                materialType = type,
                contentBody = dto.description,
                mediaUrl = rawUrl,
                thumbnailUrl = dto.imagePreviewUrl ?: (if (type == MaterialType.IMAGE) rawUrl else null),
                subject = subject,
                size = dto.storageKey ?: dto.pdfFileName ?: "PDF Digital",
                isCompleted = dto.isCompleted ?: false,
                completedCount = dto.completedCount ?: 0L,
            )

            materialDao.insert(
                LearningMaterialEntity(
                    id = domain.id,
                    title = domain.title,
                    description = domain.description,
                    materialType = domain.materialType.name,
                    contentBody = domain.contentBody,
                    mediaUrl = domain.mediaUrl,
                    thumbnailUrl = domain.thumbnailUrl,
                    subject = domain.subject,
                    size = domain.size,
                    isCompleted = domain.isCompleted,
                    completedCount = domain.completedCount,
                )
            )

            return@runCatching domain
        } catch (e: Exception) {
            Timber.w(e, "Remote fetch material $id failed, looking up in Room cache")
        }

        val cached = materialDao.getMaterialById(id)
            ?: throw Exception("Materi tidak ditemukan di cache lokal perangkat.")

        val type = try { MaterialType.valueOf(cached.materialType) } catch (_: Exception) { MaterialType.ARTICLE }
        LearningMaterial(
            id = cached.id,
            title = cached.title,
            description = cached.description,
            materialType = type,
            contentBody = cached.contentBody,
            mediaUrl = cached.mediaUrl,
            thumbnailUrl = cached.thumbnailUrl,
            subject = cached.subject,
            size = cached.size,
            isCompleted = cached.isCompleted,
            completedCount = cached.completedCount,
        )
    }

    override suspend fun createMaterial(
        title: String,
        description: String?,
        materialType: MaterialType,
        contentBody: String?,
        mediaUrl: String?,
        subject: String,
        classId: String?
    ): Result<LearningMaterial> = runCatching {
        val typeStr = when (materialType) {
            MaterialType.VIDEO -> "video"
            MaterialType.DOCUMENT -> "document"
            MaterialType.IMAGE -> "image"
            MaterialType.ARTICLE -> "article"
        }
        val fullDesc = if (!description.isNullOrBlank()) "$subject • $description" else "$subject • $title"
        val request = com.schoolos.android.data.remote.CreateMaterialRequestDto(
            materialType = typeStr,
            title = title,
            description = fullDesc,
            storageKey = "Modul Digital",
            externalUrl = mediaUrl,
            orderIndex = 0,
            visibility = "published",
            classId = classId?.ifBlank { null }
        )
        val response = api.createMaterial(request)
        val dto = response.data ?: throw Exception(response.error?.message ?: "Gagal membuat materi ajar.")
        LearningMaterial(
            id = dto.id,
            title = dto.title.ifBlank { title },
            description = dto.description,
            materialType = materialType,
            contentBody = contentBody ?: dto.description,
            mediaUrl = dto.externalUrl ?: mediaUrl,
            thumbnailUrl = dto.imagePreviewUrl,
            subject = subject,
            size = dto.storageKey ?: "Modul Digital"
        )
    }

    override suspend fun uploadMaterialFile(
        bytes: ByteArray,
        fileName: String,
        mimeType: String
    ): Result<String> = runCatching {
        val mediaType = mimeType.toMediaTypeOrNull()
        val requestBody = bytes.toRequestBody(mediaType)
        val part = okhttp3.MultipartBody.Part.createFormData("file", fileName, requestBody)
        val response = api.uploadMaterialFile(part)
        response.data?.url ?: throw Exception(response.error?.message ?: "Gagal mengunggah file.")
    }

    override suspend fun toggleMaterialCompletion(id: String): Result<Boolean> = runCatching {
        val response = api.toggleMaterialComplete(id)
        val data = response.data ?: throw Exception(response.error?.message ?: "Gagal memperbarui status selesai modul.")
        data.isCompleted
    }
}
