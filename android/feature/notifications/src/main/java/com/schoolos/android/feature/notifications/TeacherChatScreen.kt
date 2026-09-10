package com.schoolos.android.feature.notifications

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.chat.ChatManager
import com.schoolos.android.core.chat.ChatThread
import com.schoolos.android.core.chat.InquiryStatus
import com.schoolos.android.core.chat.InquiryType
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

enum class ChatFilter {
    ALL,
    WAITING,
    MATERIAL,
    ASSIGNMENT,
    ANSWERED
}

@Composable
fun TeacherChatScreen(
    chatManager: ChatManager,
    onOpenThread: (threadId: String, studentName: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val threads by chatManager.threads.collectAsState()
    val isLoading by chatManager.isLoading.collectAsState()
    val isOnline by chatManager.isOnline.collectAsState()

    var selectedFilter by remember { mutableStateOf(ChatFilter.ALL) }
    var searchQuery by remember { mutableStateOf("") }
    val focusManager = LocalFocusManager.current

    val waitingCount = threads.count { it.status == InquiryStatus.WAITING_REPLY }
    val answeredCount = threads.count { it.status == InquiryStatus.ANSWERED }
    val materialCount = threads.count { it.inquiryType == InquiryType.MATERIAL }
    val assignmentCount = threads.count { it.inquiryType == InquiryType.ASSIGNMENT }
    val uniqueStudents = threads.map { it.studentId }.distinct().size

    val filteredThreads = threads.filter { thread ->
        val matchesFilter = when (selectedFilter) {
            ChatFilter.ALL -> true
            ChatFilter.WAITING -> thread.status == InquiryStatus.WAITING_REPLY
            ChatFilter.MATERIAL -> thread.inquiryType == InquiryType.MATERIAL
            ChatFilter.ASSIGNMENT -> thread.inquiryType == InquiryType.ASSIGNMENT
            ChatFilter.ANSWERED -> thread.status == InquiryStatus.ANSWERED
        }
        val matchesSearch = searchQuery.isBlank() ||
                thread.studentName.contains(searchQuery, ignoreCase = true) ||
                thread.referenceTitle.contains(searchQuery, ignoreCase = true) ||
                thread.studentClass.contains(searchQuery, ignoreCase = true) ||
                thread.subjectName.contains(searchQuery, ignoreCase = true) ||
                (thread.lastMessage?.content?.contains(searchQuery, ignoreCase = true) == true)

        matchesFilter && matchesSearch
    }

    // Refresh spin animation
    val infiniteTransition = rememberInfiniteTransition(label = "refreshRotation")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(CosmicBlack)
            .statusBarsPadding()
    ) {
        // ── Hero Header ──────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(TeacherNeon.copy(alpha = 0.09f), CosmicBlack)
                    )
                )
        ) {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                // Title row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    Brush.linearGradient(
                                        listOf(
                                            TeacherNeon.copy(alpha = 0.25f),
                                            NeonBlue.copy(alpha = 0.2f)
                                        )
                                    )
                                )
                                .border(1.5.dp, TeacherNeon.copy(alpha = 0.4f), RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Forum,
                                contentDescription = null,
                                tint = TeacherNeon,
                                modifier = Modifier.size(26.dp)
                            )
                        }

                        Spacer(Modifier.width(14.dp))

                        Column {
                            Text(
                                text = "TANYA JAWAB SISWA",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = TeacherNeon,
                                letterSpacing = 1.5.sp
                            )
                            Text(
                                text = "Bimbingan Materi & Tugas",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = TextPrimary,
                                letterSpacing = (-0.4).sp
                            )
                        }
                    }

                    // Refresh + offline indicator
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (!isOnline) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFEF4444).copy(alpha = 0.15f))
                                    .border(
                                        1.dp,
                                        Color(0xFFEF4444).copy(alpha = 0.4f),
                                        RoundedCornerShape(20.dp)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFFEF4444))
                                    )
                                    Spacer(Modifier.width(5.dp))
                                    Text(
                                        text = "Offline",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFFEF4444)
                                    )
                                }
                            }
                        }

                        IconButton(
                            onClick = { chatManager.refresh() },
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(CosmicNavy)
                                .border(1.dp, GlassBorder, CircleShape)
                        ) {
                            Icon(
                                Icons.Default.Refresh,
                                contentDescription = "Muat Ulang",
                                tint = TextSecondary,
                                modifier = Modifier
                                    .size(18.dp)
                                    .rotate(if (isLoading) rotation else 0f)
                            )
                        }
                    }
                }

                // Offline network banner
                AnimatedVisibility(visible = !isOnline) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFEF4444).copy(alpha = 0.1f))
                            .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.WarningAmber,
                                contentDescription = null,
                                tint = Color(0xFFEF4444),
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = "Tidak terhubung ke internet. Menampilkan data tersimpan.",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // ── KPI Cards ──────────────────────────────────────────
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ModernKpiCard(
                        title = "Total Diskusi",
                        value = threads.size.toString(),
                        subtitle = "Semua topik",
                        accentColor = NeonBlue,
                        icon = Icons.Default.Forum,
                        isSelected = selectedFilter == ChatFilter.ALL,
                        onClick = { selectedFilter = ChatFilter.ALL },
                        modifier = Modifier.weight(1f)
                    )
                    ModernKpiCard(
                        title = "Perlu Dijawab",
                        value = waitingCount.toString(),
                        subtitle = if (waitingCount > 0) "Segera respon" else "Semua tuntas",
                        accentColor = if (waitingCount > 0) Color(0xFFF59E0B) else NeonSuccess,
                        icon = Icons.Default.WarningAmber,
                        isAlert = waitingCount > 0,
                        isSelected = selectedFilter == ChatFilter.WAITING,
                        onClick = { selectedFilter = ChatFilter.WAITING },
                        modifier = Modifier.weight(1f)
                    )
                    ModernKpiCard(
                        title = "Siswa Aktif",
                        value = uniqueStudents.toString(),
                        subtitle = "Bertanya aktif",
                        accentColor = StudentNeon,
                        icon = Icons.Default.People,
                        isSelected = false,
                        onClick = { },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(Modifier.height(16.dp))

                // Search
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "Cari nama siswa, atau topik...",
                            fontSize = 12.sp,
                            color = TextTertiary
                        )
                    },
                    leadingIcon = {
                        Icon(
                            Icons.Default.Search,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(19.dp)
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotBlank()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(
                                    Icons.Default.Clear,
                                    contentDescription = "Hapus",
                                    tint = TextSecondary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(18.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = CosmicNavy,
                        unfocusedContainerColor = CosmicNavy,
                        focusedBorderColor = TeacherNeon.copy(alpha = 0.7f),
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                    ),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() })
                )

                Spacer(Modifier.height(12.dp))

                // ── Filter Pills ───────────────────────────────────────────────
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(end = 8.dp)
                ) {
                    item {
                        ModernFilterChip(
                            label = "Semua",
                            count = threads.size,
                            isSelected = selectedFilter == ChatFilter.ALL,
                            activeColor = TeacherNeon,
                            onClick = { selectedFilter = ChatFilter.ALL }
                        )
                    }
                    item {
                        ModernFilterChip(
                            label = "⚠️ Perlu Dijawab",
                            count = waitingCount,
                            isSelected = selectedFilter == ChatFilter.WAITING,
                            activeColor = Color(0xFFF59E0B),
                            onClick = { selectedFilter = ChatFilter.WAITING }
                        )
                    }
                    item {
                        ModernFilterChip(
                            label = "📚 Materi Ajar",
                            count = materialCount,
                            isSelected = selectedFilter == ChatFilter.MATERIAL,
                            activeColor = NeonBlue,
                            onClick = { selectedFilter = ChatFilter.MATERIAL }
                        )
                    }
                    item {
                        ModernFilterChip(
                            label = "📝 Tugas",
                            count = assignmentCount,
                            isSelected = selectedFilter == ChatFilter.ASSIGNMENT,
                            activeColor = StudentNeon,
                            onClick = { selectedFilter = ChatFilter.ASSIGNMENT }
                        )
                    }
                    item {
                        ModernFilterChip(
                            label = "✓ Selesai",
                            count = answeredCount,
                            isSelected = selectedFilter == ChatFilter.ANSWERED,
                            activeColor = NeonSuccess,
                            onClick = { selectedFilter = ChatFilter.ANSWERED }
                        )
                    }
                }
            }
        }

        // ── Thread List or Empty State ──────────────────────────────
        if (isLoading && threads.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(
                        color = TeacherNeon,
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(36.dp)
                    )
                    Text(
                        text = "Memuat data pertanyaan...",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                }
            }
        } else if (filteredThreads.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(76.dp)
                            .clip(CircleShape)
                            .background(CosmicNavy)
                            .border(1.5.dp, GlassBorder, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.QuestionAnswer,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(38.dp)
                        )
                    }
                    Text(
                        text = if (searchQuery.isNotBlank()) "Pencarian Tidak Ditemukan" else "Belum Ada Pertanyaan",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = if (searchQuery.isNotBlank())
                            "Tidak ada pesan diskusi yang sesuai dengan \"$searchQuery\"."
                        else
                            "Pertanyaan dari siswa mengenai materi pelajaran atau tugas akan muncul di sini.",
                        fontSize = 12.sp,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Surface(
                        onClick = {
                            searchQuery = ""
                            selectedFilter = ChatFilter.ALL
                            chatManager.refresh()
                        },
                        shape = RoundedCornerShape(12.dp),
                        color = CosmicNavy,
                        border = androidx.compose.foundation.BorderStroke(1.dp, TeacherNeon.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Refresh, null, tint = TeacherNeon, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "Muat Ulang",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = TeacherNeon
                            )
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredThreads, key = { it.id }) { thread ->
                    ModernThreadCard(
                        thread = thread,
                        onClick = { onOpenThread(thread.id, thread.studentName) }
                    )
                }
                item {
                    Spacer(Modifier.height(88.dp))
                }
            }
        }
    }
}

@Composable
private fun ModernKpiCard(
    title: String,
    value: String,
    subtitle: String,
    accentColor: Color,
    icon: ImageVector,
    isSelected: Boolean,
    isAlert: Boolean = false,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (isSelected) accentColor.copy(alpha = 0.12f) else CosmicNavy)
            .border(
                1.5.dp,
                if (isSelected) accentColor.copy(alpha = 0.6f) else GlassBorder,
                RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(15.dp)
                    )
                }

                if (isAlert) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF59E0B))
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = value,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = accentColor,
                letterSpacing = (-0.5).sp
            )

            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = subtitle,
                fontSize = 9.sp,
                color = TextTertiary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ModernFilterChip(
    label: String,
    count: Int,
    isSelected: Boolean,
    activeColor: Color,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) activeColor.copy(alpha = 0.16f) else CosmicNavy)
            .border(
                1.dp,
                if (isSelected) activeColor.copy(alpha = 0.65f) else GlassBorder,
                RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) activeColor else TextSecondary
            )
            Spacer(Modifier.width(5.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSelected) activeColor.copy(alpha = 0.25f) else CosmicSurface)
                    .padding(horizontal = 6.dp, vertical = 1.dp)
            ) {
                Text(
                    text = count.toString(),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    color = if (isSelected) activeColor else TextTertiary
                )
            }
        }
    }
}

@Composable
private fun ModernThreadCard(
    thread: ChatThread,
    onClick: () -> Unit,
) {
    val isWaiting = thread.status == InquiryStatus.WAITING_REPLY
    val isMat = thread.inquiryType == InquiryType.MATERIAL
    val tagColor = if (isMat) NeonBlue else StudentNeon
    val borderBrush = if (isWaiting)
        Brush.linearGradient(listOf(Color(0xFFF59E0B).copy(alpha = 0.6f), CosmicNavy))
    else
        Brush.linearGradient(listOf(GlassBorder, GlassBorder))

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(width = 1.dp, brush = borderBrush, shape = RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
    ) {
        Column {
            // ─ Urgent Banner ───────────────────────────────────────────
            if (isWaiting) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color(0xFFF59E0B).copy(alpha = 0.18f),
                                    Color(0xFFF59E0B).copy(alpha = 0.04f)
                                )
                            )
                        )
                        .padding(horizontal = 16.dp, vertical = 7.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFF59E0B))
                        )
                        Spacer(Modifier.width(7.dp))
                        Text(
                            text = "Menunggu Jawaban Guru",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFFF59E0B),
                            letterSpacing = 0.3.sp
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                // ─ Student Info Row ─────────────────────────────────────
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Avatar
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        StudentNeon.copy(alpha = 0.85f),
                                        NeonBlue.copy(alpha = 0.85f)
                                    )
                                )
                            )
                            .border(1.5.dp, Color.White.copy(alpha = 0.25f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = thread.studentName.take(1).uppercase(),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }

                    Spacer(Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = thread.studentName,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
                            )
                            Spacer(Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(StudentNeon.copy(alpha = 0.12f))
                                    .border(1.dp, StudentNeon.copy(alpha = 0.25f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = thread.studentClass,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = StudentNeon
                                )
                            }
                        }
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = thread.subjectName,
                            fontSize = 11.sp,
                            color = TextTertiary,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Status badge (right-aligned)
                    if (!isWaiting) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(NeonSuccess.copy(alpha = 0.12f))
                                .border(1.dp, NeonSuccess.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 9.dp, vertical = 5.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = NeonSuccess,
                                    modifier = Modifier.size(11.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    text = "Terjawab",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NeonSuccess
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                // ─ Reference Tag ───────────────────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(tagColor.copy(alpha = 0.08f))
                        .border(1.dp, tagColor.copy(alpha = 0.22f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 7.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            if (isMat) Icons.AutoMirrored.Filled.MenuBook else Icons.AutoMirrored.Filled.Assignment,
                            contentDescription = null,
                            tint = tagColor,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (isMat) "Materi: " else "Tugas: ",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tagColor
                        )
                        Text(
                            text = thread.referenceTitle,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // ─ Last Message Preview ────────────────────────────────
                val lastMsg = thread.lastMessage
                if (lastMsg != null) {
                    Spacer(Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(CosmicSurface)
                            .border(1.dp, GlassBorder.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "${if (lastMsg.isFromTeacher) "💬 Anda: " else "👤 ${thread.studentName}: "}${lastMsg.content}",
                            fontSize = 12.sp,
                            color = if (isWaiting) TextPrimary else TextSecondary,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 17.sp
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))

                // ─ Footer Row ───────────────────────────────────────────
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.AccessTime,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = formatTimeAgo(thread.lastUpdated),
                            fontSize = 11.sp,
                            color = TextTertiary
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "• ${thread.messages.size} pesan",
                            fontSize = 11.sp,
                            color = TextTertiary
                        )
                    }

                    // CTA Pill Button
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                if (isWaiting) Color(0xFFF59E0B).copy(alpha = 0.15f)
                                else TeacherNeon.copy(alpha = 0.12f)
                            )
                            .border(
                                1.dp,
                                if (isWaiting) Color(0xFFF59E0B).copy(alpha = 0.5f)
                                else TeacherNeon.copy(alpha = 0.4f),
                                RoundedCornerShape(20.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = if (isWaiting) "Balas Sekarang" else "Buka Diskusi",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isWaiting) Color(0xFFF59E0B) else TeacherNeon
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = null,
                                tint = if (isWaiting) Color(0xFFF59E0B) else TeacherNeon,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun formatTimeAgo(timestamp: Long): String {
    val diff = System.currentTimeMillis() - timestamp
    if (diff < 0) return "Baru saja"
    val mins = diff / (60 * 1000)
    if (mins < 1) return "Baru saja"
    if (mins < 60) return "$mins menit lalu"
    val hours = mins / 60
    if (hours < 24) return "$hours jam lalu"
    val days = hours / 24
    if (days < 30) return "$days hari lalu"
    return "${days / 30} bulan lalu"
}
