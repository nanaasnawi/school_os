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

    // Current User Profile (authenticated)
    @GET("auth/me")
    suspend fun getCurrentUser(): ApiResponse<UserDto>

    // Academic (Classes & Subjects)
    @GET("academic/classes")
    suspend fun getClasses(
        @Query("academic_year_id") academicYearId: String? = null,
        @Query("page") page: Int? = null,
        @Query("page_size") pageSize: Int? = null,
    ): ApiResponse<List<ClassDto>>

    @GET("academic/subjects")
    suspend fun getSubjects(): ApiResponse<List<SubjectDto>>

    @GET("academic/classes/students")
    suspend fun getClassStudents(
        @Query("class_name") className: String? = null,
        @Query("class_id") classId: String? = null,
        @Query("search") search: String? = null,
    ): ApiResponse<List<ClassStudentDto>>

    // Materials
    @GET("learning/materials")
    suspend fun getMaterials(
        @Query("class_id") classId: String? = null,
        @Query("class_name") className: String? = null,
    ): ApiResponse<List<MaterialDto>>

    @Multipart
    @POST("learning/materials/upload")
    suspend fun uploadMaterialFile(
        @Part file: okhttp3.MultipartBody.Part,
    ): ApiResponse<FileUploadResponse>

    // Assignments
    @GET("learning/assignments")
    suspend fun getAssignments(@Query("class_id") classId: String? = null): ApiResponse<List<AssignmentDto>>

    @GET("learning/assignments/{id}")
    suspend fun getAssignment(@Path("id") id: String): ApiResponse<AssignmentDto>

    @POST("learning/assignments/{id}/submit")
    suspend fun submitAssignment(
        @Path("id") id: String,
        @Body request: SubmitAssignmentRequest,
    ): ApiResponse<SubmissionDto>

    @GET("learning/assignments/{id}/submissions")
    suspend fun getSubmissions(@Path("id") id: String): ApiResponse<List<SubmissionDto>>

    @POST("learning/assignments/{id}/submissions/{subId}/grade")
    suspend fun gradeSubmission(
        @Path("id") assignmentId: String,
        @Path("subId") submissionId: String,
        @Body request: GradeSubmissionRequest,
    ): ApiResponse<SubmissionDto>

    // Quizzes
    @GET("learning/quizzes")
    suspend fun getQuizzes(@Query("class_id") classId: String): ApiResponse<List<QuizDto>>

    @GET("learning/quizzes/{id}")
    suspend fun getQuiz(@Path("id") id: String): ApiResponse<QuizDto>

    @GET("learning/quizzes/{id}/questions")
    suspend fun getQuizQuestions(@Path("id") id: String): ApiResponse<List<QuizQuestionDto>>

    @POST("learning/quizzes/{id}/questions")
    suspend fun addQuizQuestion(
        @Path("id") id: String,
        @Body request: CreateQuizQuestionRequestDto,
    ): ApiResponse<QuizQuestionDto>

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
    suspend fun getSessions(@Query("class_id") classId: String? = null): ApiResponse<List<LearningSessionDto>>

    @GET("learning/sessions/{id}")
    suspend fun getSession(@Path("id") id: String): ApiResponse<LearningSessionDto>

    @GET("learning/sessions/{id}/attendance")
    suspend fun getSessionAttendance(@Path("id") id: String): ApiResponse<List<SessionAttendanceDto>>

    // Materials
    @GET("learning/materials")
    suspend fun getMaterials(): ApiResponse<List<com.schoolos.android.data.remote.dto.MaterialDto>>

    @GET("learning/materials/{id}")
    suspend fun getMaterial(@Path("id") id: String): ApiResponse<com.schoolos.android.data.remote.dto.MaterialDto>

    @POST("learning/materials/{id}/toggle-complete")
    suspend fun toggleMaterialComplete(
        @Path("id") id: String
    ): ApiResponse<com.schoolos.android.data.remote.dto.MaterialCompletionToggleDto>

    // Grades
    @GET("learning/assessment/gradebook")
    suspend fun getGradebook(
        @Query("class_id") classId: String? = null,
        @Query("subject_id") subjectId: String? = null,
    ): ApiResponse<List<GradeEntryDto>>

    // Progress
    @GET("learning/progress/me")
    suspend fun getMyProgress(): ApiResponse<ProgressDto>

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
    suspend fun getNotifications(@Query("page") page: Int = 1): ApiResponse<com.schoolos.android.data.remote.dto.PaginatedNotificationResponse>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): ApiResponse<UnreadCountResponse>

    @POST("learning/assignments")
    suspend fun createAssignment(@Body request: CreateAssignmentRequestDto): ApiResponse<AssignmentDto>

    @POST("learning/quizzes")
    suspend fun createQuiz(@Body request: CreateQuizRequestDto): ApiResponse<QuizDto>

    @POST("learning/materials")
    suspend fun createMaterial(@Body request: CreateMaterialRequestDto): ApiResponse<com.schoolos.android.data.remote.dto.MaterialDto>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): ApiResponse<Unit>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(): ApiResponse<Unit>
}

@kotlinx.serialization.Serializable
data class GradeSubmissionRequest(
    val score: Int,
    val feedback: String? = null,
)

@kotlinx.serialization.Serializable
data class UnreadCountResponse(val count: Int)

@kotlinx.serialization.Serializable
data class StartAttemptRequest(
    @kotlinx.serialization.SerialName("student_id") val studentId: String,
)

@kotlinx.serialization.Serializable
data class CreateAssignmentRequestDto(
    @kotlinx.serialization.SerialName("lesson_id") val lessonId: String,
    val title: String,
    val description: String? = null,
    val instructions: String? = null,
    @kotlinx.serialization.SerialName("max_score") val maxScore: Int? = 100,
    @kotlinx.serialization.SerialName("due_at") val dueAt: String? = null,
    @kotlinx.serialization.SerialName("assignment_type") val assignmentType: String = "individual",
    @kotlinx.serialization.SerialName("class_id") val classId: String? = null,
)

@kotlinx.serialization.Serializable
data class CreateQuizRequestDto(
    @kotlinx.serialization.SerialName("lesson_id") val lessonId: String,
    val title: String,
    val description: String? = null,
    @kotlinx.serialization.SerialName("duration_minutes") val durationMinutes: Int? = 30,
    @kotlinx.serialization.SerialName("passing_score") val passingScore: Int = 70,
    @kotlinx.serialization.SerialName("max_attempts") val maxAttempts: Int = 1,
    @kotlinx.serialization.SerialName("class_id") val classId: String? = null,
)

@kotlinx.serialization.Serializable
data class CreateMaterialRequestDto(
    @kotlinx.serialization.SerialName("lesson_id") val lessonId: String? = null,
    @kotlinx.serialization.SerialName("material_type") val materialType: String,
    val title: String,
    val description: String? = null,
    @kotlinx.serialization.SerialName("storage_key") val storageKey: String? = null,
    @kotlinx.serialization.SerialName("external_url") val externalUrl: String? = null,
    @kotlinx.serialization.SerialName("order_index") val orderIndex: Int = 0,
    val visibility: String = "published",
    @kotlinx.serialization.SerialName("class_id") val classId: String? = null,
)

@kotlinx.serialization.Serializable
data class CreateQuizQuestionRequestDto(
    @kotlinx.serialization.SerialName("question_text") val questionText: String,
    @kotlinx.serialization.SerialName("question_type") val questionType: String = "multiple_choice",
    val points: Int = 10,
    @kotlinx.serialization.SerialName("order_index") val orderIndex: Int = 1,
    @kotlinx.serialization.SerialName("image_url") val imageUrl: String? = null,
    val choices: List<CreateQuizOptionRequestDto> = emptyList(),
)

@kotlinx.serialization.Serializable
data class CreateQuizOptionRequestDto(
    @kotlinx.serialization.SerialName("choice_text") val choiceText: String,
    @kotlinx.serialization.SerialName("is_correct") val isCorrect: Boolean = false,
    @kotlinx.serialization.SerialName("order_index") val orderIndex: Int = 1,
)

@kotlinx.serialization.Serializable
data class FileUploadResponse(
    val url: String,
)
