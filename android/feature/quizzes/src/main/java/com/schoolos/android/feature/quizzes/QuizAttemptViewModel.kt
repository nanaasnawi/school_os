package com.schoolos.android.feature.quizzes

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.model.QuizQuestion
import com.schoolos.android.domain.repository.AnswerInput
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuizAttemptUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val questions: List<QuizQuestion> = emptyList(),
    val currentIndex: Int = 0,
    val answers: MutableMap<String, String?> = mutableMapOf(),
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val submitError: String? = null,
    val resultAttempt: QuizAttempt? = null,
) {
    val currentQuestion: QuizQuestion? get() = questions.getOrNull(currentIndex)
    val progress: Float get() = if (questions.isEmpty()) 0f else (currentIndex + 1).toFloat() / questions.size
    val isLastQuestion: Boolean get() = currentIndex == questions.lastIndex
    val answeredCount: Int get() = answers.count { it.value != null }
}

@HiltViewModel
class QuizAttemptViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: QuizRepository,
) : ViewModel() {

    private val quizId: String = savedStateHandle["quizId"] ?: ""
    private val attemptId: String = savedStateHandle["attemptId"] ?: ""

    private val _state = MutableStateFlow(QuizAttemptUiState())
    val state = _state.asStateFlow()

    init {
        loadQuestions()
    }

    private fun loadQuestions() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getQuestions(quizId)
                .onSuccess { questions ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        questions = questions.sortedBy { it.orderIndex },
                        answers = mutableMapOf<String, String?>().apply {
                            questions.forEach { put(it.id, null) }
                        },
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to load questions")
                }
        }
    }

    fun selectAnswer(questionId: String, choiceId: String) {
        val updated = _state.value.answers.toMutableMap()
        updated[questionId] = choiceId
        _state.value = _state.value.copy(answers = updated)
    }

    fun setEssayAnswer(questionId: String, text: String) {
        val updated = _state.value.answers.toMutableMap()
        updated[questionId] = text
        _state.value = _state.value.copy(answers = updated)
    }

    fun nextQuestion() {
        val idx = _state.value.currentIndex
        if (idx < _state.value.questions.lastIndex) {
            _state.value = _state.value.copy(currentIndex = idx + 1)
        }
    }

    fun previousQuestion() {
        val idx = _state.value.currentIndex
        if (idx > 0) {
            _state.value = _state.value.copy(currentIndex = idx - 1)
        }
    }

    fun goToQuestion(index: Int) {
        if (index in _state.value.questions.indices) {
            _state.value = _state.value.copy(currentIndex = index)
        }
    }

    fun submit() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSubmitting = true, submitError = null)
            val answerInputs = _state.value.answers.map { (qId, value) ->
                AnswerInput(
                    questionId = qId,
                    chosenChoiceId = if (value?.startsWith("choice_") == true) value.removePrefix("choice_") else null,
                    textAnswer = if (value?.startsWith("choice_") == false) value else null,
                )
            }
            repository.submitAttempt(quizId, attemptId, answerInputs)
                .onSuccess { attempt ->
                    _state.value = _state.value.copy(isSubmitting = false, submitSuccess = true, resultAttempt = attempt)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isSubmitting = false, submitError = e.message ?: "Failed to submit")
                }
        }
    }
}
