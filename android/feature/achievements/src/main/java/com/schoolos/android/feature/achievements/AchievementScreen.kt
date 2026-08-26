package com.schoolos.android.feature.achievements

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CustomBackButton
import com.schoolos.android.core.designsystem.EmptyState
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.GlassCard
import com.schoolos.android.core.designsystem.LoadingState
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.PullRefreshContainer
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import com.schoolos.android.domain.model.Achievement

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AchievementScreen(
    onBack: () -> Unit = {},
    viewModel: AchievementViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val role = state.userRole.lowercase()
    val isParent = role == "parent" || role == "guardian" || role == "ortu" || role == "wali"

    Scaffold(containerColor = CosmicBlack) { padding ->
        PullRefreshContainer(
            isRefreshing = state.isRefreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            when {
                state.isLoading -> LoadingState()
                state.error != null -> {
                    com.schoolos.android.core.designsystem.ErrorState(message = state.error!!)
                }
                state.achievements.isEmpty() -> EmptyState("Belum ada pencapaian.", Icons.Default.EmojiEvents)
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    // ── REFACTORED NON-OVERLAPPING LIST HEADER ─────────────
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 0.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CustomBackButton(onClick = onBack)
                            }
                        }
                    }

                    item {
                        CompactAchievementHero(
                            earned = state.achievements.count { it.earnedAt != null }, 
                            total = state.achievements.size,
                            isParent = isParent
                        )
                    }
                    
                    item {
                        Text(
                            if (isParent) "Koleksi Lencana Ahmad" else "Koleksi Lencana Saya", 
                            fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextPrimary, modifier = Modifier.padding(start = 4.dp)
                        )
                    }

                    items(state.achievements, key = { it.id }) { achievement ->
                        CompactAchievementCard(achievement)
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactAchievementHero(earned: Int, total: Int, isParent: Boolean = false) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(NeonWarning, StudentNeon)))
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (isParent) "PENCAPAIAN AHMAD" else "TOTAL LENCANA SAYA", 
                    color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp
                )
                Spacer(Modifier.height(4.dp))
                Text("$earned / $total Diraih", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
            }
            Text("🏆", fontSize = 42.sp)
        }
    }
}

@Composable
private fun CompactAchievementCard(achievement: Achievement) {
    val isEarned = achievement.earnedAt != null

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (isEarned) Color.White else Color.White.copy(alpha = 0.6f))
            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(if (isEarned) NeonWarning.copy(alpha = 0.08f) else CosmicBlack)
                    .border(1.dp, if (isEarned) NeonWarning.copy(alpha = 0.2f) else GlassBorder, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    achievement.icon.ifEmpty { if (isEarned) "🏆" else "🔒" },
                    fontSize = 24.sp
                )
            }
            
            Spacer(Modifier.width(14.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    achievement.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = if (isEarned) TextPrimary else TextTertiary,
                )
                if (achievement.description.isNotBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        achievement.description,
                        fontSize = 11.sp,
                        color = TextTertiary,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}
