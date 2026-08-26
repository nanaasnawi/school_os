package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.Quiz
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.model.QuizQuestion

interface QuizRepository {
    suspend fun getQuizzes(classId: String): Result<List<Quiz>>
    suspend fun getQuiz(id: String): Result<Quiz>
    suspend fun createQuiz(
        title: String,
        description: String?,
        classId: String,
        timeLimitMinutes: Int?,
        passingScore: Int,
        maxScore: Int
    ): Result<Quiz>
    suspend fun getQuestions(quizId: String): Result<List<QuizQuestion>>
    suspend fun addQuestion(
        quizId: String,
        questionText: String,
        questionType: String,
        points: Int,
        imageUrl: String?,
        choices: List<ChoiceInput>
    ): Result<QuizQuestion>
    suspend fun startAttempt(quizId: String): Result<QuizAttempt>
    suspend fun submitAttempt(quizId: String, attemptId: String, answers: List<AnswerInput>): Result<QuizAttempt>
}

data class ChoiceInput(
    val choiceText: String,
    val orderIndex: Int
)

data class AnswerInput(
    val questionId: String,
    val chosenChoiceId: String?,
    val textAnswer: String?,
)
