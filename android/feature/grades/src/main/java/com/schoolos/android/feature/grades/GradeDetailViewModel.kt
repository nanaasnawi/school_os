package com.schoolos.android.feature.grades

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.GradeEntry
import com.schoolos.android.domain.model.SubjectGradeDetail
import com.schoolos.android.domain.model.SubjectGradeSummary
import com.schoolos.android.domain.model.WeightComponent
import com.schoolos.android.domain.model.toSubjectSummary
import com.schoolos.android.domain.repository.GradeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GradeDetailUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val userRole: String = "student",
    val detail: SubjectGradeDetail? = null,
)

@HiltViewModel
class GradeDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: GradeRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val subjectId: String = savedStateHandle["subjectId"] ?: ""
    private val subjectName: String = savedStateHandle["subjectName"] ?: ""

    private val _state = MutableStateFlow(GradeDetailUiState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(userRole = auth.role ?: "student")
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getGradebook("", subjectId)
                .onSuccess { entries ->
                    val summary = entries.toSubjectSummary(subjectId, subjectName)
                    val breakdown = entries.map { e ->
                        WeightComponent(
                            name = e.componentName,
                            weightPercentage = e.weightPercentage ?: 0.0,
                            score = e.rawScore,
                            maxScore = e.maxRawScore,
                        )
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        detail = SubjectGradeDetail(summary = summary, components = entries, weightBreakdown = breakdown),
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to load grades")
                }
        }
    }
}
