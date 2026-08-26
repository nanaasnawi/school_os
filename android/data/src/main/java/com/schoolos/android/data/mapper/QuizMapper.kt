package com.schoolos.android.data.mapper

import com.schoolos.android.data.remote.dto.QuizAttemptDto
import com.schoolos.android.data.remote.dto.QuizChoiceDto
import com.schoolos.android.data.remote.dto.QuizDto
import com.schoolos.android.data.remote.dto.QuizQuestionDto
import com.schoolos.android.domain.model.Quiz
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.model.QuizChoice
import com.schoolos.android.domain.model.QuizQuestion

fun QuizDto.toDomain() = Quiz(
    id = id,
    title = title,
    description = description,
    timeLimitMinutes = timeLimitMinutes,
    passingScore = passingScore,
    maxScore = maxScore,
    questionsCount = questionsCount,
    status = status,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun QuizAttemptDto.toDomain() = QuizAttempt(
    id = id,
    quizId = quizId,
    studentId = studentId,
    startedAt = startedAt,
    completedAt = completedAt,
    score = score,
    totalPoints = totalPoints,
    status = status,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun QuizQuestionDto.toDomain() = QuizQuestion(
    id = id,
    questionText = questionText,
    questionType = questionType,
    points = points,
    orderIndex = orderIndex,
    imageUrl = imageUrl,
    choices = choices.map { it.toDomain() },
)

fun QuizChoiceDto.toDomain() = QuizChoice(
    id = id,
    choiceText = choiceText,
    orderIndex = orderIndex,
)
