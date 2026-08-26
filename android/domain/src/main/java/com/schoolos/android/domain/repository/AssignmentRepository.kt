package com.schoolos.android.domain.repository

import com.schoolos.android.domain.model.Assignment
import com.schoolos.android.domain.model.AssignmentSubmission

interface AssignmentRepository {
    suspend fun getAssignments(classId: String): Result<List<Assignment>>
    suspend fun getAssignment(id: String): Result<Assignment>
    suspend fun createAssignment(
        title: String,
        description: String?,
        instructions: String?,
        maxScore: Int,
        dueAt: String?,
        classId: String,
        assignmentType: String
    ): Result<Assignment>
    suspend fun submitAssignment(assignmentId: String, content: String?, fileUrl: String?): Result<AssignmentSubmission>
    suspend fun getSubmissions(assignmentId: String): Result<List<AssignmentSubmission>>
}
