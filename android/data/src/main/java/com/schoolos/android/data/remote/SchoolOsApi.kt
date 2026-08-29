package com.schoolos.android.data.remote

import com.schoolos.android.data.remote.dto.*
import retrofit2.http.*

interface SchoolOsApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>

    @POST("auth/qr-login")
    suspend fun loginWithQr(@Body request: QrLoginRequest): ApiResponse<LoginResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): ApiResponse<RefreshTokenResponse>


    // Public school info — no token required, used on login screen
    @GET("schools/info")
    suspend fun getSchoolPublicInfo(
        @Query("npsn") npsn: String? = null,
    ): ApiResponse<SchoolPublicInfoResponse>

    // School Profile (authenticated)
    @GET("schools/profile")
    suspend fun getSchoolProfile(): ApiResponse<SchoolProfileResponse>

    // Materials
    @GET("learning/materials")
    suspend fun getMaterials(
        @Query("class_id") classId: String? = null,
        @Query("class_name") className: String? = null,
    ): ApiResponse<List<MaterialDto>>

    // Assignments
    @GET("learning/assignments")
    suspend fun getAssignments(@Query("class_id") classId: String): ApiResponse<List<AssignmentDto>>

    @GET("learning/assignments/{id}")
    suspend fun getAssignment(@Path("id") id: String): ApiResponse<AssignmentDto>

    @POST("learning/assignments/{id}/submit")
    suspend fun submitAssignment(
        @Path("id") id: String,
        @Body request: SubmitAssignmentRequest,
    ): ApiResponse<SubmissionDto>

    @GET("learning/assignments/{id}/submissions")
    suspend fun getSubmissions(@Path("id") id: String): ApiResponse<List<SubmissionDto>>

    // Quizzes
    @GET("learning/quizzes")
    suspend fun getQuizzes(@Query("class_id") classId: String): ApiResponse<List<QuizDto>>

    @GET("learning/quizzes/{id}")
    suspend fun getQuiz(@Path("id") id: String): ApiResponse<QuizDto>

    @GET("learning/quizzes/{id}/questions")
    suspend fun getQuizQuestions(@Path("id") id: String): ApiResponse<List<QuizQuestionDto>>

    @POST("learning/quizzes/{id}/attempts")
    suspend fun startAttempt(
        @Path("id") id: String,
        @Body request: StartAttemptRequest,
    ): ApiResponse<QuizAttemptDto>

    @POST("learning/quizzes/{id}/attempts/{attempt_id}/submit")
    suspend fun submitAttempt(
        @Path("id") quizId: String,
        @Path("attempt_id") attemptId: String,
        @Body request: SubmitAttemptRequest,
    ): ApiResponse<QuizAttemptDto>

    // Sessions
    @GET("learning/sessions")
    suspend fun getSessions(@Query("class_id") classId: String): ApiResponse<List<LearningSessionDto>>

    @GET("learning/sessions/{id}")
    suspend fun getSession(@Path("id") id: String): ApiResponse<LearningSessionDto>

    @GET("learning/sessions/{id}/attendance")
    suspend fun getSessionAttendance(@Path("id") id: String): ApiResponse<List<SessionAttendanceDto>>

    // Grades
    @GET("learning/assessment/gradebook")
    suspend fun getGradebook(
        @Query("class_id") classId: String,
        @Query("subject_id") subjectId: String? = null,
    ): ApiResponse<List<GradeEntryDto>>

    // Progress
    @GET("learning/progress/{student_id}/{class_id}/{subject_id}")
    suspend fun getProgress(
        @Path("student_id") studentId: String,
        @Path("class_id") classId: String,
        @Path("subject_id") subjectId: String,
    ): ApiResponse<ProgressDto>

    // Achievements
    @GET("learning/achievements/student/{student_id}")
    suspend fun getStudentAchievements(@Path("student_id") studentId: String): ApiResponse<List<AchievementDto>>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(@Query("page") page: Int = 1): ApiResponse<List<NotificationDto>>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): ApiResponse<UnreadCountResponse>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): ApiResponse<Unit>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(): ApiResponse<Unit>
}

@kotlinx.serialization.Serializable
data class UnreadCountResponse(val count: Int)

@kotlinx.serialization.Serializable
data class StartAttemptRequest(
    @kotlinx.serialization.SerialName("student_id") val studentId: String,
)
