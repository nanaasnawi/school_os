package com.schoolos.android.feature.learning

import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.AccentNeonPurple
import com.schoolos.android.domain.model.MaterialType
import com.schoolos.android.domain.repository.LearningMaterialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MaterialItem(
    val id: String,
    val title: String,
    val type: String, // PDF, VIDEO, MODULE, ARTICLE
    val size: String,
    val subject: String,
    val color: Color,
    val isCompleted: Boolean = false,
    val completedCount: Long = 0L,
    val readTimeMinutes: Int = 8,
    val description: String? = null,
)

data class LearningUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedCategory: String = "Semua",
    val materials: List<MaterialItem> = emptyList(),
    val totalCompleted: Int = 0,
    val totalMaterials: Int = 0,
    val userRole: String = "student",
)

@HiltViewModel
class LearningViewModel @Inject constructor(
    private val repository: LearningMaterialRepository,
    private val authManager: com.schoolos.android.core.auth.AuthManager,
) : ViewModel() {

    private val _state = MutableStateFlow(LearningUiState())
    val state = _state.asStateFlow()

    private var allMaterials: List<MaterialItem> = emptyList()

    val selectedMaterial = MutableStateFlow<com.schoolos.android.domain.model.LearningMaterial?>(null)

    init {
        viewModelScope.launch {
            authManager.authState.collect { auth ->
                _state.value = _state.value.copy(userRole = auth.role ?: "student")
            }
        }
        loadMaterials()
    }

    fun loadMaterials() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.getMaterials()
                .onSuccess { list ->
                    val mapped = list.mapIndexed { idx, m ->
                        val color = when (idx % 4) {
                            0 -> NeonBlue
                            1 -> TeacherNeon
                            2 -> AccentNeonPurple
                            else -> StudentNeon
                        }
                        val typeLabel = when (m.materialType) {
                            MaterialType.VIDEO -> "VIDEO"
                            MaterialType.DOCUMENT -> "PDF"
                            MaterialType.IMAGE -> "IMAGE"
                            MaterialType.ARTICLE -> "ARTICLE"
                        }
                        MaterialItem(
                            id = m.id,
                            title = m.title,
                            type = typeLabel,
                            size = m.size ?: "PDF Digital",
                            subject = m.subject,
                            color = color,
                            isCompleted = m.isCompleted,
                            completedCount = m.completedCount,
                            readTimeMinutes = if (typeLabel == "VIDEO") 12 else 8,
                            description = m.description,
                        )
                    }
                    allMaterials = mapped
                    filterMaterials(_state.value.searchQuery, _state.value.selectedCategory)
                }
                .onFailure { err ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = err.message ?: "Gagal memuat modul pembelajaran."
                    )
                }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        filterMaterials(query, _state.value.selectedCategory)
    }

    fun onCategorySelected(category: String) {
        _state.value = _state.value.copy(selectedCategory = category)
        filterMaterials(_state.value.searchQuery, category)
    }

    fun loadMaterialDetail(id: String) {
        viewModelScope.launch {
            repository.getMaterialById(id)
                .onSuccess { selectedMaterial.value = it }
                .onFailure { selectedMaterial.value = null }
        }
    }

    fun toggleMaterialCompletion(id: String) {
        viewModelScope.launch {
            val currentMat = selectedMaterial.value
            val currentCompleted = currentMat?.isCompleted ?: allMaterials.find { it.id == id }?.isCompleted ?: false
            val newCompleted = !currentCompleted

            // Optimistic update
            if (currentMat != null && currentMat.id == id) {
                selectedMaterial.value = currentMat.copy(isCompleted = newCompleted)
            }
            allMaterials = allMaterials.map {
                if (it.id == id) it.copy(isCompleted = newCompleted) else it
            }
            filterMaterials(_state.value.searchQuery, _state.value.selectedCategory)

            // Network sync
            repository.toggleMaterialCompletion(id)
                .onSuccess { serverIsCompleted ->
                    if (selectedMaterial.value?.id == id) {
                        selectedMaterial.value = selectedMaterial.value?.copy(isCompleted = serverIsCompleted)
                    }
                    allMaterials = allMaterials.map {
                        if (it.id == id) it.copy(isCompleted = serverIsCompleted) else it
                    }
                    filterMaterials(_state.value.searchQuery, _state.value.selectedCategory)
                }
                .onFailure {
                    // Revert on error
                    if (selectedMaterial.value?.id == id) {
                        selectedMaterial.value = currentMat?.copy(isCompleted = currentCompleted)
                    }
                    allMaterials = allMaterials.map {
                        if (it.id == id) it.copy(isCompleted = currentCompleted) else it
                    }
                    filterMaterials(_state.value.searchQuery, _state.value.selectedCategory)
                }
        }
    }

    private fun filterMaterials(query: String, category: String) {
        var filtered = allMaterials

        if (query.isNotBlank()) {
            filtered = filtered.filter {
                it.title.contains(query, ignoreCase = true) ||
                it.subject.contains(query, ignoreCase = true)
            }
        }

        when (category) {
            "Selesai" -> filtered = filtered.filter { it.isCompleted }
            "Belum Selesai" -> filtered = filtered.filter { !it.isCompleted }
            "Semua" -> {}
            else -> {
                filtered = filtered.filter {
                    it.subject.contains(category, ignoreCase = true)
                }
            }
        }

        val completedCount = allMaterials.count { it.isCompleted }
        _state.value = _state.value.copy(
            isLoading = false,
            materials = filtered,
            totalCompleted = completedCount,
            totalMaterials = allMaterials.size
        )
    }
}
