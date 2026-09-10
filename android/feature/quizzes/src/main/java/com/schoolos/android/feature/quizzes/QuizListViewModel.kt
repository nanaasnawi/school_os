package com.schoolos.android.feature.quizzes

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.Quiz
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuizListUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val userRole: String = "student",
    val quizzes: List<Quiz> = emptyList(),
    val subjectFilter: String? = null,
)

@HiltViewModel
class QuizListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: QuizRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(QuizListUiState())
    val state = _state.asStateFlow()

    private val classId = ""

    /** Optional subject filter passed via navigation (e.g. from a session detail). */
    private var subjectFilter: String? = savedStateHandle.get<String>("subjectId")?.takeIf { it.isNotBlank() }

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(userRole = auth.role ?: "student")
            }
        }
        load()
    }

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true)
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getQuizzes(classId)
                .onSuccess { quizzes ->
                    val filtered = subjectFilter?.let { filter -> quizzes.filter { q -> matchesSubject(q.subjectName, filter) } } ?: quizzes
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        quizzes = filtered.sortedByDescending { it.createdAt },
                        subjectFilter = subjectFilter,
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = e.message ?: "Failed to load quizzes",
                    )
                }
        }
    }

    /** Tolerant subject matching: exact, or bidirectional contains (case-insensitive). */
    private fun matchesSubject(itemSubject: String?, filter: String): Boolean {
        if (itemSubject.isNullOrBlank()) return false
        val a = itemSubject.trim()
        val b = filter.trim()
        return a.equals(b, ignoreCase = true) || a.contains(b, ignoreCase = true) || b.contains(a, ignoreCase = true)
    }

    fun clearSubjectFilter() {
        subjectFilter = null
        _state.value = _state.value.copy(subjectFilter = null)
        refresh()
    }
}
