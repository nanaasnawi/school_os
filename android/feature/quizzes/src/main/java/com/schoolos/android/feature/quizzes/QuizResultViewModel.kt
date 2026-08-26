package com.schoolos.android.feature.quizzes

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.QuizAttempt
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuizResultUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val attempt: QuizAttempt? = null,
)

@HiltViewModel
class QuizResultViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: QuizRepository,
) : ViewModel() {

    private val attemptId: String = savedStateHandle["attemptId"] ?: ""
    // For now we store the quizId as a nav arg too
    private val quizId: String = savedStateHandle["quizId"] ?: ""

    private val _state = MutableStateFlow(QuizResultUiState())
    val state = _state.asStateFlow()

    init {
        loadResult()
    }

    private fun loadResult() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            // Sprint B+: get attempt detail from dedicated endpoint
            // For now we refetch the quiz and display what we know
            repository.getQuiz(quizId)
                .onSuccess { quiz ->
                    // Attempt data was passed through navigation; in production fetch from API
                    _state.value = _state.value.copy(isLoading = false)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message)
                }
        }
    }
}
