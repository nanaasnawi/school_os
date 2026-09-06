package com.schoolos.android.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.auth.AuthState
import com.schoolos.android.domain.model.LearningSession
import com.schoolos.android.domain.model.Progress
import com.schoolos.android.domain.model.SubjectGradeSummary
import com.schoolos.android.domain.model.toSubjectSummary
import com.schoolos.android.domain.repository.AcademicRepository
import com.schoolos.android.domain.repository.AchievementRepository
import com.schoolos.android.domain.repository.AssignmentRepository
import com.schoolos.android.domain.repository.AuthRepository
import com.schoolos.android.domain.repository.GradeRepository
import com.schoolos.android.domain.repository.NotificationRepository
import com.schoolos.android.domain.repository.ProgressRepository
import com.schoolos.android.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.Locale
import javax.inject.Inject

data class HomeUiState(
    val userName: String = "",
    val userRole: String = "student",
    val userEmail: String = "",
    val schoolName: String = "",
    val unreadCount: Int = 0,
    val gradeAverage: String = "-",
    val gradeStatus: String = "Belum ada data nilai",
    val gradeTrendPoints: List<Float> = emptyList(),
    val topGradeSubjects: List<SubjectGradeSummary> = emptyList(),
    val studentProgress: Progress? = null,
    val progressPercentage: Float = 0f,
    val assignmentsCount: String = "0",
    val xpCount: String = "0",
    val badgeCount: String = "0",
    val teacherScheduleCount: String = "0",
    val teacherAttendanceRate: String = "-",
    val teacherPendingCount: String = "0",
    val teacherMaterialsCount: String = "0",
    val activeSessionSubject: String = "-",
    val activeSessionClass: String = "-",
    val homeroomClass: String = "",
    val todaySessions: List<LearningSession> = emptyList(),
    val nextSessionSubject: String = "-",
    val nextSessionRoom: String = "-",
    val nextSessionTime: String = "-",
    val nextSessionIsLive: Boolean = false,
    val childName: String = "",
    val childId: String = "",
    val parentAttendanceRate: String = "-",
    val parentPresentDays: String = "-",
    val parentPermitDays: String = "-",
    val parentAbsentDays: String = "-",
    val parentAssignmentsCount: String = "0",
    val isRefreshing: Boolean = false,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val authManager: AuthManager,
    private val notificationRepository: NotificationRepository,
    private val gradeRepository: GradeRepository,
    private val progressRepository: ProgressRepository,
    private val academicRepository: AcademicRepository,
    private val assignmentRepository: AssignmentRepository,
    private val achievementRepository: AchievementRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state = _state.asStateFlow()

    private var currentAuth: AuthState = AuthState()

    init {
        observeAuthState()
        startPeriodicSync()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                currentAuth = auth
                val name = if (!auth.name.isNullOrBlank()) auth.name!! else "Pengguna School OS"
                val role = if (!auth.role.isNullOrBlank()) auth.role!! else "student"
                val homeroom = auth.className ?: ""
                val child = auth.childName ?: ""
                val cId = auth.childId ?: ""

                _state.update { current ->
                    current.copy(
                        userName = name,
                        userRole = role,
                        userEmail = auth.email ?: "",
                        schoolName = auth.schoolName ?: "",
                        homeroomClass = homeroom,
                        childName = child,
                        childId = cId,
                    )
                }

                syncData(silent = true)
            }
        }
        viewModelScope.launch {
            if (authManager.isLoggedIn) {
                authRepository.getCurrentUser()
            }
        }
    }

    /**
     * Real-time periodic background sync every 15 seconds to ensure sessions,
     * live agenda, and indicators always match the backend PostgreSQL state.
     */
    private fun startPeriodicSync() {
        viewModelScope.launch {
            while (isActive) {
                delay(15_000)
                syncData(silent = true)
            }
        }
    }

    /**
     * Public manual or swipe-to-refresh method called by HomeScreen.
     */
    fun refresh(isPullRefresh: Boolean = false) {
        if (isPullRefresh) {
            _state.update { it.copy(isRefreshing = true) }
        }
        viewModelScope.launch {
            syncData(silent = !isPullRefresh)
            if (isPullRefresh) {
                _state.update { it.copy(isRefreshing = false) }
            }
        }
    }

    private suspend fun syncData(silent: Boolean) {
        val auth = currentAuth
        val isParent = auth.isParent
        val isTeacher = auth.isTeacher
        val isStudent = auth.isStudent
        val homeroom = auth.className ?: ""

        // 1. Real-time Learning Sessions Sync (Filtered to Today's Agenda)
        sessionRepository.getSessions("").onSuccess { sessions ->
            val today = LocalDate.now()
            val todaySessions = sessions.filter { s ->
                // Active sessions are always relevant today
                if (s.status.equals("active", ignoreCase = true)) return@filter true

                val scheduled = s.scheduledAt?.let { parseDate(it) }
                val started = s.startedAt?.let { parseDate(it) }
                scheduled == today || started == today
            }.sortedWith(
                compareBy<LearningSession> {
                    if (it.status.equals("active", ignoreCase = true)) 0 else 1
                }.thenBy { it.scheduledAt ?: it.startedAt ?: "" }
            )

            val activeOrUpcoming = todaySessions.firstOrNull { it.status.equals("active", ignoreCase = true) }
                ?: todaySessions.firstOrNull { it.status.equals("scheduled", ignoreCase = true) }
                ?: todaySessions.firstOrNull()

            val nextSubj = activeOrUpcoming?.let { it.subjectName ?: it.notes?.substringBefore(" • ") ?: "Pelajaran" } ?: "-"
            val nextRm = activeOrUpcoming?.room ?: "-"
            val isLive = activeOrUpcoming?.status.equals("active", ignoreCase = true)
            val timeText = if (isLive) "Sedang Berlangsung" else if (activeOrUpcoming != null) "Hari ini" else "-"

            val activeTeacherSession = sessions.firstOrNull { it.status.equals("active", ignoreCase = true) }
                ?: sessions.firstOrNull()
            val activeSubj = activeTeacherSession?.let { it.subjectName ?: it.notes?.substringBefore(" • ") ?: "-" } ?: "-"
            val activeClass = activeTeacherSession?.classId?.ifBlank { null } ?: if (homeroom.isNotBlank()) homeroom else "-"

            _state.update { current ->
                current.copy(
                    todaySessions = todaySessions,
                    nextSessionSubject = nextSubj,
                    nextSessionRoom = nextRm,
                    nextSessionTime = timeText,
                    nextSessionIsLive = isLive,
                    teacherScheduleCount = sessions.size.toString(),
                    teacherAttendanceRate = if (sessions.isNotEmpty()) "100%" else "0%",
                    activeSessionSubject = activeSubj,
                    activeSessionClass = activeClass,
                )
            }
        }

        // 2. Unread Notifications Count
        notificationRepository.getUnreadCount().onSuccess { count ->
            _state.update { it.copy(unreadCount = count) }
        }

        // 3. Role-specific real-time metrics
        if (isStudent) {
            // Live Grades & Academic Performance
            gradeRepository.getGradebook().onSuccess { entries ->
                val validScores = entries.mapNotNull { it.rawScore ?: it.weightedScore }
                val trendPoints = validScores.map { it.toFloat() }
                val avg = if (validScores.isNotEmpty()) validScores.average() else 0.0
                val avgStr = if (validScores.isNotEmpty()) String.format(Locale.US, "%.1f", avg) else "-"
                val statusStr = when {
                    avg >= 85.0 -> "Melampaui KKM • Predikat A"
                    avg >= 75.0 -> "Tuntas KKM • Predikat B"
                    avg > 0.0 -> "Perlu Remedial • Predikat C"
                    else -> "Belum ada data nilai"
                }

                val subjectMap = academicRepository.getSubjects().getOrDefault(emptyList()).associate { it.id to it.name }
                val subjectIds = entries.map { it.subjectId }.distinct()
                val summaries = subjectIds.mapNotNull { id ->
                    val realName = subjectMap[id] ?: return@mapNotNull null
                    entries.toSubjectSummary(id, realName)
                }.sortedByDescending { it.finalScore }

                _state.update { current ->
                    current.copy(
                        gradeAverage = avgStr,
                        gradeStatus = statusStr,
                        gradeTrendPoints = trendPoints,
                        topGradeSubjects = summaries,
                    )
                }
            }

            // Live Learning Progress
            progressRepository.getProgress("").onSuccess { progress ->
                val pct = (progress.overallProgress / 100.0).toFloat().coerceIn(0f, 1f)
                _state.update { current ->
                    current.copy(
                        studentProgress = progress,
                        progressPercentage = pct,
                    )
                }
            }

            assignmentRepository.getAssignments(classId = "").onSuccess { assignments ->
                _state.update { it.copy(assignmentsCount = assignments.size.toString()) }
            }

            achievementRepository.getAchievements().onSuccess { achievements ->
                val earned = achievements.filter { !it.earnedAt.isNullOrBlank() }
                val badges = earned.size
                val xp = badges * 50
                _state.update { current ->
                    current.copy(
                        badgeCount = badges.toString(),
                        xpCount = xp.toString(),
                    )
                }
            }
        } else if (isTeacher) {
            assignmentRepository.getAssignments(classId = "").onSuccess { assignments ->
                val count = assignments.size
                _state.update { it.copy(teacherPendingCount = count.toString(), teacherMaterialsCount = count.toString()) }
            }
        } else if (isParent) {
            assignmentRepository.getAssignments(classId = "").onSuccess { assignments ->
                _state.update { current ->
                    current.copy(
                        parentAssignmentsCount = assignments.size.toString(),
                        assignmentsCount = assignments.size.toString()
                    )
                }
            }
        }
    }

    private fun parseDate(iso: String): LocalDate? {
        return try {
            ZonedDateTime.parse(iso).toLocalDate()
        } catch (_: Exception) {
            try {
                Instant.parse(iso).atZone(ZoneId.systemDefault()).toLocalDate()
            } catch (_: Exception) {
                try {
                    LocalDate.parse(iso.substringBefore("T"))
                } catch (_: Exception) { null }
            }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}
