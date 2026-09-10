package com.schoolos.android.core.chat

import android.content.Context
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.network.ApiClient
import com.schoolos.android.core.network.NetworkMonitor
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import timber.log.Timber
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

enum class InquiryType {
    MATERIAL,
    ASSIGNMENT,
    GENERAL
}

enum class InquiryStatus {
    WAITING_REPLY,
    ANSWERED
}

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val threadId: String,
    val senderId: String,
    val senderName: String,
    val senderRole: String, // "TEACHER" or "STUDENT"
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isFromTeacher: Boolean = false,
)

data class ChatThread(
    val id: String = UUID.randomUUID().toString(),
    val studentId: String,
    val studentName: String,
    val studentClass: String,
    val teacherId: String = "teacher-default",
    val teacherName: String = "Guru Pengampu",
    val subjectName: String = "Umum",
    val inquiryType: InquiryType = InquiryType.MATERIAL,
    val referenceTitle: String,
    val referenceId: String? = null,
    val messages: List<ChatMessage> = emptyList(),
    val status: InquiryStatus = InquiryStatus.WAITING_REPLY,
    val lastUpdated: Long = System.currentTimeMillis(),
) {
    val lastMessage: ChatMessage? get() = messages.lastOrNull()
    val isAwaitingReply: Boolean get() = status == InquiryStatus.WAITING_REPLY
}

@Singleton
class ChatManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiClient: ApiClient,
    private val networkMonitor: NetworkMonitor,
    private val authManager: AuthManager,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val api: InquiriesApi by lazy { apiClient.create() }

    // Genuine real-time device network connectivity from Android OS
    val isOnline: StateFlow<Boolean> = networkMonitor.isOnline
        .stateIn(scope, SharingStarted.Eagerly, true)

    val isRealtimeConnected: StateFlow<Boolean> get() = isOnline

    private val _threads = MutableStateFlow<List<ChatThread>>(emptyList())
    val threads: StateFlow<List<ChatThread>> = _threads.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        // Initial fetch
        refresh()

        // Automatically sync whenever internet connection is restored
        scope.launch {
            networkMonitor.isOnline.collectLatest { online ->
                if (online) {
                    try {
                        syncFromDatabase()
                    } catch (e: Exception) {
                        Timber.d(e, "Auto-sync on reconnect")
                    }
                }
            }
        }

        // Background polling every 8 seconds when device is online
        scope.launch {
            while (isActive) {
                delay(8000)
                if (isOnline.value) {
                    try {
                        syncFromDatabase()
                    } catch (e: Exception) {
                        Timber.w(e, "Periodic sync tick failed")
                    }
                }
            }
        }
    }

    fun refresh() {
        scope.launch {
            _isLoading.value = true
            try {
                syncFromDatabase()
            } catch (e: Exception) {
                Timber.e(e, "Failed to refresh inquiries")
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun syncFromDatabase() {
        val auth = authManager.authState.firstOrNull()
        val teacherName = if (auth?.isTeacher == true) auth.name else null
        val studentId = if (auth?.isStudent == true && !auth.userId.isNullOrBlank() && auth.userId.length == 36) auth.userId else null

        val response = api.listInquiries(
            teacherName = teacherName,
            studentId = studentId,
        )
        if (response.success && response.data != null) {
            val dbThreads = response.data
            val currentMap = _threads.value.associateBy { it.id }

            val updatedThreads = dbThreads.map { dto ->
                val type = when (dto.inquiryType.uppercase()) {
                    "ASSIGNMENT" -> InquiryType.ASSIGNMENT
                    "GENERAL" -> InquiryType.GENERAL
                    else -> InquiryType.MATERIAL
                }
                val st = if (dto.status.uppercase() == "ANSWERED") InquiryStatus.ANSWERED else InquiryStatus.WAITING_REPLY
                val timestamp = parseIsoTimestamp(dto.lastMessageAt ?: dto.createdAt)

                // Preserve or update messages
                val existing = currentMap[dto.id]
                val messages = if (existing != null && existing.messages.isNotEmpty()) {
                    existing.messages
                } else if (!dto.lastMessageContent.isNullOrBlank()) {
                    listOf(
                        ChatMessage(
                            id = "msg-${dto.id}",
                            threadId = dto.id,
                            senderId = dto.studentId,
                            senderName = dto.studentName,
                            senderRole = "STUDENT",
                            content = dto.lastMessageContent,
                            timestamp = timestamp,
                            isFromTeacher = false,
                        )
                    )
                } else {
                    emptyList()
                }

                ChatThread(
                    id = dto.id,
                    studentId = dto.studentId,
                    studentName = dto.studentName,
                    studentClass = dto.studentClass.ifBlank { "Siswa" },
                    teacherId = dto.teacherId ?: "teacher-default",
                    teacherName = dto.teacherName,
                    subjectName = dto.subjectName,
                    inquiryType = type,
                    referenceTitle = dto.referenceTitle,
                    referenceId = dto.referenceId,
                    messages = messages,
                    status = st,
                    lastUpdated = timestamp,
                )
            }

            _threads.value = updatedThreads
        }
    }

    fun loadThreadDetail(threadId: String) {
        scope.launch {
            try {
                val detailResp = api.getInquiryDetail(threadId)
                if (detailResp.success && detailResp.data != null) {
                    val detail = detailResp.data
                    val msgs = detail.messages.map { m ->
                        ChatMessage(
                            id = m.id,
                            threadId = m.threadId,
                            senderId = m.senderId,
                            senderName = m.senderName,
                            senderRole = m.senderRole,
                            content = m.content,
                            timestamp = parseIsoTimestamp(m.createdAt),
                            isFromTeacher = m.isFromTeacher,
                        )
                    }

                    _threads.value = _threads.value.map { th ->
                        if (th.id == threadId) {
                            th.copy(
                                messages = msgs,
                                status = if (detail.thread.status == "ANSWERED") InquiryStatus.ANSWERED else InquiryStatus.WAITING_REPLY,
                                lastUpdated = parseIsoTimestamp(detail.thread.lastMessageAt ?: detail.thread.createdAt)
                            )
                        } else th
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "Error loading thread detail $threadId")
            }
        }
    }

    fun getThread(threadId: String): ChatThread? {
        loadThreadDetail(threadId)
        return _threads.value.find { it.id == threadId }
    }

    fun sendMessage(
        threadId: String,
        senderId: String,
        senderName: String,
        senderRole: String,
        content: String,
    ): ChatMessage {
        val isTeacher = senderRole.equals("TEACHER", ignoreCase = true)
        val now = System.currentTimeMillis()
        val tempId = "msg-${UUID.randomUUID()}"
        val localMsg = ChatMessage(
            id = tempId,
            threadId = threadId,
            senderId = senderId,
            senderName = senderName,
            senderRole = senderRole,
            content = content.trim(),
            timestamp = now,
            isFromTeacher = isTeacher,
        )

        // Optimistic local state update
        _threads.value = _threads.value.map { thread ->
            if (thread.id == threadId) {
                thread.copy(
                    messages = thread.messages + localMsg,
                    status = if (isTeacher) InquiryStatus.ANSWERED else InquiryStatus.WAITING_REPLY,
                    lastUpdated = now,
                )
            } else {
                thread
            }
        }

        // Persist to real database via backend API
        scope.launch {
            try {
                val req = SendInquiryMessageRequestDto(
                    senderId = senderId,
                    senderName = senderName,
                    senderRole = senderRole,
                    content = content.trim()
                )
                val resp = api.sendMessage(threadId, req)
                if (resp.success && resp.data != null) {
                    // Refresh detail to ensure canonical sync
                    loadThreadDetail(threadId)
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to persist chat message to database")
            }
        }

        return localMsg
    }

    fun createInquiry(
        studentId: String,
        studentName: String,
        studentClass: String,
        teacherName: String = "Guru Pengampu",
        subjectName: String = "Umum",
        inquiryType: InquiryType,
        referenceTitle: String,
        referenceId: String? = null,
        initialQuestion: String,
    ): ChatThread {
        val newThreadId = "thread-${UUID.randomUUID()}"
        val now = System.currentTimeMillis()
        val initialMsg = ChatMessage(
            threadId = newThreadId,
            senderId = studentId,
            senderName = studentName,
            senderRole = "STUDENT",
            content = initialQuestion.trim(),
            timestamp = now,
            isFromTeacher = false,
        )

        val newThread = ChatThread(
            id = newThreadId,
            studentId = studentId,
            studentName = studentName,
            studentClass = studentClass,
            teacherName = teacherName,
            subjectName = subjectName,
            inquiryType = inquiryType,
            referenceTitle = referenceTitle,
            referenceId = referenceId,
            messages = listOf(initialMsg),
            status = InquiryStatus.WAITING_REPLY,
            lastUpdated = now,
        )

        _threads.value = listOf(newThread) + _threads.value

        // Persist to database
        scope.launch {
            try {
                val req = CreateInquiryRequestDto(
                    studentId = if (studentId.contains("-") && studentId.length == 36) studentId else null,
                    studentName = studentName,
                    studentClass = studentClass,
                    teacherName = teacherName,
                    subjectName = subjectName,
                    inquiryType = inquiryType.name,
                    referenceTitle = referenceTitle,
                    referenceId = referenceId,
                    initialMessage = initialQuestion.trim()
                )
                val resp = api.createInquiry(req)
                if (resp.success && resp.data != null) {
                    refresh()
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to persist new inquiry to database")
            }
        }

        return newThread
    }

    private fun parseIsoTimestamp(isoString: String?): Long {
        if (isoString.isNullOrBlank()) return System.currentTimeMillis()
        return try {
            Instant.parse(isoString).toEpochMilli()
        } catch (_: Exception) {
            try {
                java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).parse(isoString)?.time
                    ?: System.currentTimeMillis()
            } catch (_: Exception) {
                System.currentTimeMillis()
            }
        }
    }
}
