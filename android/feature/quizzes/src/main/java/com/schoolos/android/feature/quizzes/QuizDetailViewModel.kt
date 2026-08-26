package com.schoolos.android.feature.quizzes

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.Quiz
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuizDetailUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val quiz: Quiz? = null,
    val isStarting: Boolean = false,
    val attempt: QuizAttempt? = null,
    val startError: String? = null,
)

@HiltViewModel
class QuizDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: QuizRepository,
) : ViewModel() {

    private val quizId: String = savedStateHandle["id"] ?: ""

    private val _state = MutableStateFlow(QuizDetailUiState())
    val state = _state.asStateFlow()

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getQuiz(quizId)
                .onSuccess { quiz -> _state.value = _state.value.copy(isLoading = false, quiz = quiz) }
                .onFailure { e -> _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Quiz not found") }
        }
    }

    fun startAttempt() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isStarting = true, startError = null)
            repository.startAttempt(quizId)
                .onSuccess { attempt -> _state.value = _state.value.copy(isStarting = false, attempt = attempt) }
                .onFailure { e -> _state.value = _state.value.copy(isStarting = false, startError = e.message ?: "Failed to start") }
        }
    }

    fun dismissAttempt() {
        _state.value = _state.value.copy(attempt = null)
    }
}
