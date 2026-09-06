package com.schoolos.android.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.schoolos.android.core.database.dao.AssignmentDao
import com.schoolos.android.core.database.dao.LearningMaterialDao
import com.schoolos.android.core.database.dao.NotificationDao
import com.schoolos.android.core.database.dao.QuizDao
import com.schoolos.android.core.database.dao.SubmissionQueueDao
import com.schoolos.android.core.database.entity.AssignmentEntity
import com.schoolos.android.core.database.entity.LearningMaterialEntity
import com.schoolos.android.core.database.entity.NotificationEntity
import com.schoolos.android.core.database.entity.QuizEntity
import com.schoolos.android.core.database.entity.SubmissionQueueEntity

@Database(
    entities = [
        NotificationEntity::class,
        AssignmentEntity::class,
        QuizEntity::class,
        LearningMaterialEntity::class,
        SubmissionQueueEntity::class,
    ],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun notificationDao(): NotificationDao
    abstract fun assignmentDao(): AssignmentDao
    abstract fun quizDao(): QuizDao
    abstract fun learningMaterialDao(): LearningMaterialDao
    abstract fun submissionQueueDao(): SubmissionQueueDao
}
