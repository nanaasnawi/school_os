package com.schoolos.android.data.di

import com.schoolos.android.core.network.ApiClient
import com.schoolos.android.data.remote.SchoolOsApi
import com.schoolos.android.data.repository.*
import com.schoolos.android.domain.repository.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideSchoolOsApi(apiClient: ApiClient): SchoolOsApi = apiClient.create()

    @Provides @Singleton fun provideAuthRepository(impl: AuthRepositoryImpl): AuthRepository = impl
    @Provides @Singleton fun provideAssignmentRepository(impl: AssignmentRepositoryImpl): AssignmentRepository = impl
    @Provides @Singleton fun provideQuizRepository(impl: QuizRepositoryImpl): QuizRepository = impl
    @Provides @Singleton fun provideSessionRepository(impl: SessionRepositoryImpl): SessionRepository = impl
    @Provides @Singleton fun provideGradeRepository(impl: GradeRepositoryImpl): GradeRepository = impl
    @Provides @Singleton fun provideProgressRepository(impl: ProgressRepositoryImpl): ProgressRepository = impl
    @Provides @Singleton fun provideAchievementRepository(impl: AchievementRepositoryImpl): AchievementRepository = impl
    @Provides @Singleton fun provideNotificationRepository(impl: NotificationRepositoryImpl): NotificationRepository = impl
}
