package com.schoolos.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class QuizDto(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("time_limit_minutes") val timeLimitMinutes: Int? = null,
    @SerialName("passing_score") val passingScore: Int = 0,
    @SerialName("max_score") val maxScore: Int = 0,
    @SerialName("questions_count") val questionsCount: Int = 0,
    val status: String = "draft",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class QuizAttemptDto(
    val id: String,
    @SerialName("quiz_id") val quizId: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("started_at") val startedAt: String,
    @SerialName("completed_at") val completedAt: String? = null,
    val score: Int? = null,
    @SerialName("total_points") val totalPoints: Int = 0,
    val status: String = "in_progress",
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class QuizQuestionDto(
    val id: String,
    @SerialName("question_text") val questionText: String,
    @SerialName("question_type") val questionType: String = "multiple_choice",
    val points: Int = 1,
    @SerialName("order_index") val orderIndex: Int = 0,
    @SerialName("image_url") val imageUrl: String? = null,
    val choices: List<QuizChoiceDto> = emptyList(),
)

@Serializable
data class QuizChoiceDto(
    val id: String,
    @SerialName("choice_text") val choiceText: String,
    @SerialName("order_index") val orderIndex: Int = 0,
)

@Serializable
data class SubmitAttemptRequest(
    val answers: List<SubmitAnswerRequest>,
)

@Serializable
data class SubmitAnswerRequest(
    @SerialName("question_id") val questionId: String,
    @SerialName("chosen_choice_id") val chosenChoiceId: String? = null,
    @SerialName("text_answer") val textAnswer: String? = null,
)
