package com.schoolos.android.feature.home

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.ClassStudent
import com.schoolos.android.domain.repository.AcademicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

data class RombelStudentsUiState(
    val className: String = "",
    val students: List<ClassStudent> = emptyList(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val searchQuery: String = "",
) {
    val filteredStudents: List<ClassStudent>
        get() = if (searchQuery.isBlank()) students
        else students.filter {
            it.fullName.contains(searchQuery, ignoreCase = true) ||
                    it.nisn.contains(searchQuery, ignoreCase = true)
        }

    val totalCount: Int get() = students.size
    val maleCount: Int get() = students.count { it.gender?.trim()?.uppercase() == "L" }
    val femaleCount: Int get() = students.count { it.gender?.trim()?.uppercase() == "P" }
}

@HiltViewModel
class RombelStudentsViewModel @Inject constructor(
    private val academicRepository: AcademicRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val navClassName: String = savedStateHandle.get<String>("className") ?: ""

    private val _uiState = MutableStateFlow(RombelStudentsUiState(className = navClassName))
    val uiState = _uiState.asStateFlow()

    init {
        if (navClassName.isNotBlank()) {
            loadStudents(navClassName)
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun loadStudents(classNameOverride: String? = null) {
        val targetClass = (classNameOverride ?: _uiState.value.className).trim()
        if (targetClass.isBlank()) return

        _uiState.update { it.copy(className = targetClass, isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            academicRepository.getClassStudents(targetClass)
                .onSuccess { studentList ->
                    _uiState.update {
                        it.copy(
                            students = studentList,
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                }
                .onFailure { error ->
                    Timber.e(error, "Error loading class students for $targetClass")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Gagal memuat daftar murid rombel"
                        )
                    }
                }
        }
    }
}
