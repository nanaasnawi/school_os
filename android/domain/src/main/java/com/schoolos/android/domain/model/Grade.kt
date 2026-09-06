package com.schoolos.android.domain.model

data class GradeEntry(
    val id: String,
    val studentId: String,
    val classId: String,
    val subjectId: String,
    val componentName: String,
    val sourceType: String,
    val rawScore: Double?,
    val maxRawScore: Double?,
    val weightedScore: Double?,
    val weightPercentage: Double?,
    val calculatedAt: String,
)

data class SubjectGradeSummary(
    val subjectId: String,
    val subjectName: String,
    val finalScore: Double,
    val letterGrade: String,
    val completionPercentage: Double,
    val lastCalculated: String,
    val componentCount: Int,
    val gradedComponentCount: Int,
)

data class SubjectGradeDetail(
    val summary: SubjectGradeSummary,
    val components: List<GradeEntry>,
    val weightBreakdown: List<WeightComponent>,
)

data class WeightComponent(
    val name: String,
    val weightPercentage: Double,
    val score: Double?,
    val maxScore: Double?,
)

fun List<GradeEntry>.toSubjectSummary(subjectId: String, subjectName: String): SubjectGradeSummary {
    val entries = this.filter { it.subjectId == subjectId }
    val graded = entries.filter { it.rawScore != null || it.weightedScore != null }
    
    val calculatedWeightedSum = graded.sumOf { e ->
        when {
            e.weightedScore != null && e.weightedScore > 0 -> e.weightedScore
            e.rawScore != null && e.maxRawScore != null && e.maxRawScore > 0 -> 
                (e.rawScore / e.maxRawScore) * (e.weightPercentage ?: 25.0)
            else -> 0.0
        }
    }
    
    val finalScore = if (calculatedWeightedSum > 0) calculatedWeightedSum 
    else if (graded.isNotEmpty()) {
        graded.mapNotNull { it.rawScore }.average().takeIf { !it.isNaN() } ?: 0.0
    } else 0.0

    val letter = when {
        finalScore >= 85 -> "A"
        finalScore >= 75 -> "B"
        finalScore >= 65 -> "C"
        finalScore >= 55 -> "D"
        finalScore > 0 -> "E"
        else -> "-"
    }
    val completion = if (entries.isEmpty()) 0.0 else (graded.size.toDouble() / entries.size) * 100.0
    return SubjectGradeSummary(
        subjectId = subjectId,
        subjectName = subjectName,
        finalScore = finalScore,
        letterGrade = letter,
        completionPercentage = completion,
        lastCalculated = graded.maxOfOrNull { it.calculatedAt }.orEmpty(),
        componentCount = entries.size,
        gradedComponentCount = graded.size,
    )
}
