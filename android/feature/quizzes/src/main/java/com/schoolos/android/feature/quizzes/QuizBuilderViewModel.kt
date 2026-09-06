package com.schoolos.android.feature.quizzes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.schoolos.android.domain.model.AcademicClass
import com.schoolos.android.domain.model.AcademicSubject
import com.schoolos.android.domain.repository.AcademicRepository
import com.schoolos.android.domain.repository.ChoiceInput
import com.schoolos.android.domain.repository.QuizRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuestionSummary(
    val number: Int,
    val text: String,
    val type: String, // "MULTIPLE_CHOICE" or "ESSAY"
    val points: Int,
    val choicesCount: Int
)

data class QuizBuilderUiState(
    val isLoading: Boolean = false,
    val quizCreated: Boolean = false,
    val createdQuizId: String? = null,
    val createdQuizTitle: String = "",
    val error: String? = null,
    val currentStep: Int = 1, // 1: Info, 2: Questions
    val questionsList: List<QuestionSummary> = emptyList(),
    val totalPoints: Int = 0,
    val availableClasses: List<AcademicClass> = emptyList(),
    val availableSubjects: List<AcademicSubject> = emptyList(),
    val isLoadingAcademicData: Boolean = false,
)

@HiltViewModel
class QuizBuilderViewModel @Inject constructor(
    private val repository: QuizRepository,
    private val academicRepository: AcademicRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(QuizBuilderUiState())
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

    fun createQuiz(
        title: String,
        description: String,
        timeLimit: Int?,
        passingScore: Int,
        maxScore: Int,
        classId: String?,
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.createQuiz(
                title = title,
                description = description,
                classId = classId ?: "",
                timeLimitMinutes = timeLimit,
                passingScore = passingScore,
                maxScore = maxScore
            ).onSuccess { quiz ->
                _state.value = _state.value.copy(
                    isLoading = false,
                    quizCreated = true,
                    createdQuizId = quiz.id,
                    createdQuizTitle = title,
                    currentStep = 2
                )
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to create quiz")
            }
        }
    }

    fun addQuestion(
        questionText: String,
        questionType: String = "MULTIPLE_CHOICE", // "MULTIPLE_CHOICE" or "ESSAY"
        choices: List<String> = emptyList(),
        correctIndex: Int = 0,
        points: Int = 10,
        onSuccessCallback: () -> Unit = {}
    ) {
        val quizId = _state.value.createdQuizId ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val choiceInputs = if (questionType == "MULTIPLE_CHOICE") {
                choices.mapIndexed { index, text ->
                    ChoiceInput(
                        choiceText = text,
                        orderIndex = index + 1,
                        isCorrect = (index == correctIndex)
                    )
                }
            } else {
                emptyList()
            }
            repository.addQuestion(
                quizId = quizId,
                questionText = questionText,
                questionType = if (questionType == "MULTIPLE_CHOICE") "multiple_choice" else "essay",
                points = points,
                imageUrl = null,
                choices = choiceInputs
            ).onSuccess {
                val newSummary = QuestionSummary(
                    number = _state.value.questionsList.size + 1,
                    text = questionText,
                    type = questionType,
                    points = points,
                    choicesCount = if (questionType == "MULTIPLE_CHOICE") choices.size else 0
                )
                val updatedList = _state.value.questionsList + newSummary
                val newTotalPoints = updatedList.sumOf { it.points }
                _state.value = _state.value.copy(
                    isLoading = false,
                    questionsList = updatedList,
                    totalPoints = newTotalPoints
                )
                onSuccessCallback()
            }.onFailure { e ->
                _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Gagal menambahkan butir soal kuis.")
            }
        }
    }
}
