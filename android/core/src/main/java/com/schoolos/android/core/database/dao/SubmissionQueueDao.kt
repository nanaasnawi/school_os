package com.schoolos.android.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.schoolos.android.core.database.entity.SubmissionQueueEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SubmissionQueueDao {
    @Query("SELECT * FROM submission_queue WHERE status = 'PENDING' OR status = 'FAILED' ORDER BY createdAt ASC")
    suspend fun getPendingSubmissions(): List<SubmissionQueueEntity>

    @Query("SELECT COUNT(*) FROM submission_queue WHERE status = 'PENDING' OR status = 'FAILED'")
    fun observePendingCount(): Flow<Int>

    @Query("SELECT * FROM submission_queue ORDER BY createdAt DESC")
    fun getAllSubmissions(): Flow<List<SubmissionQueueEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: SubmissionQueueEntity)

    @Query("UPDATE submission_queue SET status = :status, lastError = :error WHERE id = :id")
    suspend fun updateStatus(id: String, status: String, error: String? = null)

    @Query("UPDATE submission_queue SET retryCount = retryCount + 1, lastError = :error WHERE id = :id")
    suspend fun incrementRetry(id: String, error: String)

    @Query("DELETE FROM submission_queue WHERE id = :id")
    suspend fun delete(id: String)

    @Query("DELETE FROM submission_queue WHERE status = 'SYNCED'")
    suspend fun clearSynced()
}
