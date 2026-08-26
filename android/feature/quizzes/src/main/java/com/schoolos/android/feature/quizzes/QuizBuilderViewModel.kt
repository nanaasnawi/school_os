package com.schoolos.android.feature.quizzes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.repository.ChoiceInput
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuizBuilderUiState(
    val isLoading: Boolean = false,
    val quizCreated: Boolean = false,
    val createdQuizId: String? = null,
    val error: String? = null,
    val currentStep: Int = 1 // 1: Info, 2: Questions
)

@HiltViewModel
class QuizBuilderViewModel @Inject constructor(
    private val repository: QuizRepository
) : ViewModel() {

    private val _state = MutableStateFlow(QuizBuilderUiState())
    val state = _state.asStateFlow()

    fun createQuiz(
        title: String,
        description: String,
        timeLimit: Int?,
        passingScore: Int,
        maxScore: Int
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.createQuiz(
                title = title,
                description = description,
                classId = "class_7a",
                timeLimitMinutes = timeLimit,
                passingScore = passingScore,
                maxScore = maxScore
            ).onSuccess { quiz ->
                _state.value = _state.value.copy(isLoading = false, quizCreated = true, createdQuizId = quiz.id, currentStep = 2)
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to create quiz")
            }
        }
    }

    fun addQuestion(
        questionText: String,
        choices: List<String>
    ) {
        val quizId = _state.value.createdQuizId ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.addQuestion(
                quizId = quizId,
                questionText = questionText,
                questionType = "multiple_choice",
                points = 10,
                imageUrl = null,
                choices = choices.mapIndexed { index, text -> ChoiceInput(text, index) }
            ).onSuccess {
                _state.value = _state.value.copy(isLoading = false)
                // In real app, we might add to a local list or navigate
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to add question")
            }
        }
    }
}
