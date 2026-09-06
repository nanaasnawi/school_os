package com.schoolos.android.core.sync

import com.schoolos.android.core.database.dao.SubmissionQueueDao
import com.schoolos.android.core.database.entity.SubmissionQueueEntity
import com.schoolos.android.core.network.NetworkMonitor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

sealed interface SyncProgressState {
    data object Idle : SyncProgressState
    data class Syncing(val current: Int, val total: Int) : SyncProgressState
    data class Completed(val syncedCount: Int) : SyncProgressState
    data class Error(val message: String) : SyncProgressState
}

@Singleton
class OfflineSubmissionSyncManager @Inject constructor(
    private val submissionQueueDao: SubmissionQueueDao,
    private val networkMonitor: NetworkMonitor,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _syncState = MutableStateFlow<SyncProgressState>(SyncProgressState.Idle)
    val syncState: StateFlow<SyncProgressState> = _syncState.asStateFlow()

    val pendingCount: Flow<Int> = submissionQueueDao.observePendingCount()

    // Callback lambda invoked to send item to remote API server (decoupled from direct API DTO)
    private var submitAction: (suspend (assignmentId: String, studentId: String, content: String?, fileUrl: String?) -> Boolean)? = null

    init {
        scope.launch {
            networkMonitor.isOnline.collectLatest { isOnline ->
                if (isOnline) {
                    syncAllPending()
                }
            }
        }
    }

    fun registerSubmitAction(
        action: suspend (assignmentId: String, studentId: String, content: String?, fileUrl: String?) -> Boolean
    ) {
        this.submitAction = action
    }

    suspend fun queueSubmission(
        assignmentId: String,
        studentId: String,
        content: String?,
        fileUrl: String?,
    ): String {
        val entity = SubmissionQueueEntity(
            assignmentId = assignmentId,
            studentId = studentId,
            content = content,
            fileUrl = fileUrl,
            status = "PENDING",
        )
        submissionQueueDao.insert(entity)
        return entity.id
    }

    suspend fun syncAllPending(): Int {
        val action = submitAction ?: return 0
        val pending = submissionQueueDao.getPendingSubmissions()
        if (pending.isEmpty()) {
            _syncState.value = SyncProgressState.Idle
            return 0
        }

        var synced = 0
        _syncState.value = SyncProgressState.Syncing(0, pending.size)

        for ((index, item) in pending.withIndex()) {
            submissionQueueDao.updateStatus(item.id, "SYNCING")
            _syncState.value = SyncProgressState.Syncing(index + 1, pending.size)

            try {
                val success = action(item.assignmentId, item.studentId, item.content, item.fileUrl)
                if (success) {
                    submissionQueueDao.updateStatus(item.id, "SYNCED")
                    synced++
                } else {
                    submissionQueueDao.incrementRetry(item.id, "Server returned failure")
                    submissionQueueDao.updateStatus(item.id, "FAILED", "Server returned failure")
                }
            } catch (e: Exception) {
                submissionQueueDao.incrementRetry(item.id, e.message ?: "Unknown error")
                submissionQueueDao.updateStatus(item.id, "FAILED", e.message)
            }
        }

        submissionQueueDao.clearSynced()
        _syncState.value = SyncProgressState.Completed(synced)
        return synced
    }
}
