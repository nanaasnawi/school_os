package com.schoolos.android.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.schoolos.android.core.database.dao.AssignmentDao
import com.schoolos.android.core.database.dao.NotificationDao
import com.schoolos.android.core.database.dao.QuizDao
import com.schoolos.android.core.database.entity.AssignmentEntity
import com.schoolos.android.core.database.entity.NotificationEntity
import com.schoolos.android.core.database.entity.QuizEntity

@Database(
    entities = [NotificationEntity::class, AssignmentEntity::class, QuizEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun notificationDao(): NotificationDao
    abstract fun assignmentDao(): AssignmentDao
    abstract fun quizDao(): QuizDao
}
