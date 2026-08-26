package com.schoolos.android.data.repository

import com.schoolos.android.core.auth.AuthManager
import com.schoolos.android.core.database.dao.QuizDao
import com.schoolos.android.core.database.mapper.toDomain
import com.schoolos.android.core.database.mapper.toEntity
import com.schoolos.android.core.network.NetworkMonitor
import com.schoolos.android.data.mapper.toDomain as dtoToDomain
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.data.remote.StartAttemptRequest
import com.schoolos.android.data.remote.dto.SubmitAnswerRequest
import com.schoolos.android.data.remote.dto.SubmitAttemptRequest
import com.schoolos.android.domain.model.Quiz
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.model.QuizQuestion
import com.schoolos.android.domain.repository.AnswerInput
import com.schoolos.android.domain.repository.ChoiceInput
import com.schoolos.android.domain.repository.QuizRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class QuizRepositoryImpl @Inject constructor(
    private val api: SchoolOsApi,
    private val authManager: AuthManager,
    private val quizDao: QuizDao,
    private val networkMonitor: NetworkMonitor,
) : QuizRepository {

    override suspend fun getQuizzes(classId: String): Result<List<Quiz>> = runCatching {
        val isOnline = try { networkMonitor.isOnline.first() } catch (_: Exception) { true }
        if (isOnline) {
            val response = api.getQuizzes(classId)
            val quizzes = response.data?.map { it.dtoToDomain() }
                ?: throw Exception(response.error?.message ?: "Gagal memuat kuis dari server API.")
            quizDao.clearAll()
            quizDao.insertAll(quizzes.map { it.toEntity() })
            quizzes
        } else {
            val cached = try { with(quizDao.getQuizzes()) { first() } } catch (_: Exception) { emptyList() }
            cached.map { it.toDomain() }
        }
    }

    fun getCachedQuizzes(): Flow<List<Quiz>> {
        return quizDao.getQuizzes().map { list -> list.map { it.toDomain() } }
    }

    override suspend fun getQuiz(id: String): Result<Quiz> = runCatching {
        val response = api.getQuiz(id)
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Kuis tidak ditemukan.")
    }

    override suspend fun createQuiz(
        title: String,
        description: String?,
        classId: String,
        timeLimitMinutes: Int?,
        passingScore: Int,
        maxScore: Int
    ): Result<Quiz> = runCatching {
        throw UnsupportedOperationException("Pembuatan kuis CBT hanya dapat dilakukan via Konsol Web Administrator / Guru.")
    }

    override suspend fun getQuestions(quizId: String): Result<List<QuizQuestion>> = runCatching {
        val response = api.getQuizQuestions(quizId)
        response.data?.map { it.dtoToDomain() } ?: throw Exception(response.error?.message ?: "Gagal memuat soal kuis.")
    }

    override suspend fun addQuestion(
        quizId: String,
        questionText: String,
        questionType: String,
        points: Int,
        imageUrl: String?,
        choices: List<ChoiceInput>
    ): Result<QuizQuestion> = runCatching {
        throw UnsupportedOperationException("Penambahan soal kuis hanya dapat dilakukan via Konsol Web Administrator.")
    }

    override suspend fun startAttempt(quizId: String): Result<QuizAttempt> = runCatching {
        val studentId = authManager.getStudentId() ?: throw Exception("Sesi pengguna tidak valid.")
        val response = api.startAttempt(quizId, StartAttemptRequest(studentId = studentId))
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Gagal memulai pengerjaan kuis CBT.")
    }

    override suspend fun submitAttempt(
        quizId: String,
        attemptId: String,
        answers: List<AnswerInput>
    ): Result<QuizAttempt> = runCatching {
        val request = SubmitAttemptRequest(
            answers = answers.map {
                SubmitAnswerRequest(
                    questionId = it.questionId,
                    chosenChoiceId = it.chosenChoiceId,
                    textAnswer = it.textAnswer
                )
            }
        )
        val response = api.submitAttempt(quizId, attemptId, request)
        response.data?.dtoToDomain() ?: throw Exception(response.error?.message ?: "Gagal mengumpulkan jawaban kuis.")
    }
}
