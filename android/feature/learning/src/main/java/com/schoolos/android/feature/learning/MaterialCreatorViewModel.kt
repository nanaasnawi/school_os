package com.schoolos.android.feature.learning

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject
import com.schoolos.android.domain.model.MaterialType
import com.schoolos.android.domain.repository.AcademicRepository
import com.schoolos.android.domain.repository.LearningMaterialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MaterialCreatorUiState(
    val isLoading: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,
    val availableClasses: List<AcademicClass> = emptyList(),
    val availableSubjects: List<AcademicSubject> = emptyList(),
    val isLoadingAcademicData: Boolean = false,
)

@HiltViewModel
class MaterialCreatorViewModel @Inject constructor(
    private val repository: LearningMaterialRepository,
    private val academicRepository: AcademicRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(MaterialCreatorUiState())
    val state = _state.asStateFlow()

    init {
        loadAcademicData()
    }

    fun loadAcademicData() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoadingAcademicData = true)
            val classesResult = academicRepository.getClasses()
            val subjectsResult = academicRepository.getSubjects()

            _state.value = _state.value.copy(
                isLoadingAcademicData = false,
                availableClasses = classesResult.getOrDefault(emptyList()),
                availableSubjects = subjectsResult.getOrDefault(emptyList()),
            )
        }
    }

    fun createMaterial(
        title: String,
        description: String?,
        materialType: MaterialType,
        contentBody: String?,
        mediaUrl: String?,
        subject: String,
        classId: String?,
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.createMaterial(
                title = title,
                description = description,
                materialType = materialType,
                contentBody = contentBody,
                mediaUrl = mediaUrl,
                subject = subject,
                classId = classId,
            ).onSuccess {
                _state.value = _state.value.copy(isLoading = false, success = true)
            }.onFailure { err ->
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = err.message ?: "Gagal membuat materi ajar."
                )
            }
        }
    }

    fun resetState() {
        _state.value = _state.value.copy(
            isLoading = false,
            success = false,
            error = null,
        )
    }
}
