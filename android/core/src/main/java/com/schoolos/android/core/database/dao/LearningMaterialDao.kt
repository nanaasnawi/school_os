package com.schoolos.android.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.schoolos.android.core.database.entity.LearningMaterialEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LearningMaterialDao {
    @Query("SELECT * FROM learning_materials ORDER BY cachedAt DESC")
    fun getMaterials(): Flow<List<LearningMaterialEntity>>

    @Query("SELECT * FROM learning_materials ORDER BY cachedAt DESC")
    suspend fun getMaterialsList(): List<LearningMaterialEntity>

    @Query("SELECT * FROM learning_materials WHERE id = :id LIMIT 1")
    suspend fun getMaterialById(id: String): LearningMaterialEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(material: LearningMaterialEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(materials: List<LearningMaterialEntity>)

    @Query("DELETE FROM learning_materials")
    suspend fun clearAll()
}
