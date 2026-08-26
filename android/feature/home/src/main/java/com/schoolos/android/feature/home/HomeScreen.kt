package com.schoolos.android.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon

@Composable
fun HomeScreen(
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToSessions: () -> Unit = {},
    onNavigateToAssignments: () -> Unit = {},
    onNavigateToQuizzes: () -> Unit = {},
    onNavigateToGrades: () -> Unit = {},
    onNavigateToProgress: () -> Unit = {},
    onNavigateToAchievements: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToLearning: () -> Unit = {},
    onNavigateToAssignmentCreator: () -> Unit = {},
    onNavigateToQuizBuilder: () -> Unit = {},
    onNavigateToBroadcastCenter: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val role = state.userRole.lowercase()
    val isTeacher = role == "teacher" || role == "guru"
    val isParent  = role == "parent"  || role == "guardian" || role == "ortu" || role == "wali"

    val userName = if (state.userName.isNotBlank()) state.userName
                   else when {
                       isTeacher -> "Bapak Andi Pratama"
                       isParent  -> "Ibu Siti Nurhayati"
                       else      -> "Ahmad"
                   }

    val heroGradient = when {
        isTeacher -> listOf(Color(0xFF059669), Color(0xFF0D9488))
        isParent  -> listOf(Color(0xFFE11D48), Color(0xFFBE185D))
        else      -> listOf(Color(0xFF4F46E5), Color(0xFF7C3AED))
    }

    val (avatarIcon) = when {
        isTeacher -> Pair(Icons.Default.Person, TeacherNeon)
        isParent  -> Pair(Icons.Default.Face, ParentNeon)
        else      -> Pair(Icons.Default.School, StudentNeon)
    }

    Scaffold(containerColor = CosmicBlack) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp, end = 16.dp,
                    top = 0.dp,
                    bottom = padding.calculateBottomPadding() + 0.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                // ── VIBRANT HERO BANNER (Top of Screen) ─────────────────────────
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 0.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .background(
                                Brush.linearGradient(heroGradient)
                            )
                            .shadow(6.dp, RoundedCornerShape(24.dp), spotColor = heroGradient.first().copy(alpha = 0.4f))
                            .padding(20.dp),
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.2f))
                                            .border(2.dp, Color.White.copy(alpha = 0.6f), CircleShape),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Icon(avatarIcon, null, tint = Color.White, modifier = Modifier.size(26.dp))
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Halo, ${userName.split(" ").firstOrNull() ?: userName}! 👋",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 20.sp,
                                            color = Color.White,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                        Spacer(Modifier.height(2.dp))
                                        Text(
                                            text = when {
                                                isTeacher -> "Guru • Matematika 🎯"
                                                isParent  -> "Orang Tua Siswa 👨‍👩‍👧"
                                                else      -> "Siswa • Kelas 7A 🚀"
                                            },
                                            fontSize = 12.sp,
                                            color = Color.White.copy(alpha = 0.88f),
                                            fontWeight = FontWeight.Medium,
                                        )
                                    }
                                }

                                // Notification bell on white chip inside hero
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.2f))
                                        .border(1.dp, Color.White.copy(alpha = 0.4f), CircleShape)
                                        .clickable { onNavigateToNotifications() },
                                    contentAlignment = Alignment.Center,
                                ) {
                                    BadgedBox(
                                        badge = {
                                            val n = if (state.unreadCount > 0) state.unreadCount
                                                    else if (isTeacher) 5 else if (isParent) 2 else 3
                                            Badge(containerColor = NeonError) {
                                                Text("$n", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                        },
                                    ) {
                                        Icon(Icons.Default.Notifications, "Notifikasi", tint = Color.White, modifier = Modifier.size(20.dp))
                                    }
                                }
                            }

                            Spacer(Modifier.height(16.dp))

                            // Date Badge & Quick Summary Pill inside Hero
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.White.copy(alpha = 0.18f))
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.CalendarMonth, null, tint = Color.White, modifier = Modifier.size(13.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text("Rabu, 7 Agustus 2026", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.White)
                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                ) {
                                    Text("Semester Genap", color = heroGradient.first(), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }

                            if (isTeacher || isParent || (!isTeacher && !isParent)) {
                                Spacer(Modifier.height(20.dp))
                                // EXECUTIVE / ACHIEVEMENT SUMMARY STRIP (Integrated into Hero)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White.copy(alpha = 0.15f))
                                        .padding(vertical = 12.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    when {
                                        isTeacher -> {
                                            SummaryMiniItem("JADWAL", "4", onNavigateToSessions)
                                            SummaryDivider()
                                            SummaryMiniItem("HADIR", "92%", onNavigateToSessions)
                                            SummaryDivider()
                                            SummaryMiniItem("PENDING", "12", onNavigateToAssignments)
                                            SummaryDivider()
                                            SummaryMiniItem("MATERI", "5", onNavigateToLearning)
                                        }
                                        isParent -> {
                                            SummaryMiniItem("HADIR", "96%", onNavigateToProgress)
                                            SummaryDivider()
                                            SummaryMiniItem("RAPOR", "88.5", onNavigateToProgress)
                                            SummaryDivider()
                                            SummaryMiniItem("TUGAS", "2", onNavigateToAssignments)
                                            SummaryDivider()
                                            SummaryMiniItem("POIN", "120", onNavigateToAchievements)
                                        }
                                        else -> {
                                            // STUDENT Achievement Summary
                                            SummaryMiniItem("IPK", "88.6", onNavigateToGrades)
                                            SummaryDivider()
                                            SummaryMiniItem("TUGAS", "2", onNavigateToAssignments)
                                            SummaryDivider()
                                            SummaryMiniItem("XP", "450", onNavigateToAchievements)
                                            SummaryDivider()
                                            SummaryMiniItem("BADGE", "12", onNavigateToAchievements)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ── Role-Based Content ───────────────────────────────────────────
                when {
                    isTeacher -> {
                        val isHomeroom = state.userName.lowercase().contains("andi") // Simulate homeroom teacher check
                        teacherContent(
                            onNavigateToSessions     = onNavigateToSessions,
                            onNavigateToAssignments  = onNavigateToAssignments,
                            onNavigateToQuizzes      = onNavigateToQuizzes,
                            onNavigateToGrades       = onNavigateToGrades,
                            onNavigateToNotifications= onNavigateToNotifications,
                            onNavigateToAssignmentCreator = onNavigateToAssignmentCreator,
                            onNavigateToQuizBuilder  = onNavigateToQuizBuilder,
                            onNavigateToBroadcastCenter = onNavigateToBroadcastCenter,
                            isHomeroom = isHomeroom
                        )
                    }
                    isParent -> parentContent(
                        onNavigateToProgress     = onNavigateToProgress,
                        onNavigateToNotifications= onNavigateToNotifications,
                        onNavigateToAssignments  = onNavigateToAssignments,
                        onNavigateToGrades       = onNavigateToGrades,
                        onNavigateToAchievements = onNavigateToAchievements
                    )
                    else -> studentContent(
                        onNavigateToSessions     = onNavigateToSessions,
                        onNavigateToAssignments  = onNavigateToAssignments,
                        onNavigateToQuizzes      = onNavigateToQuizzes,
                        onNavigateToGrades       = onNavigateToGrades,
                        onNavigateToProgress     = onNavigateToProgress,
                        onNavigateToAchievements = onNavigateToAchievements,
                        onNavigateToLearning     = onNavigateToLearning
                    )
                }
            }
        }
    }
}

@Composable
private fun SummaryMiniItem(label: String, value: String, onClick: () -> Unit = {}) {
    Column(
        modifier = Modifier.clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(value, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
        Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
    }
}

@Composable
private fun SummaryDivider() {
    Box(Modifier.width(1.dp).height(18.dp).background(Color.White.copy(alpha = 0.2f)))
}
