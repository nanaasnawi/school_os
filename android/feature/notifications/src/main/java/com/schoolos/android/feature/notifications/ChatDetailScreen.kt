package com.schoolos.android.feature.notifications

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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.chat.ChatManager
import com.schoolos.android.core.chat.ChatMessage
import com.schoolos.android.core.chat.ChatThread
import com.schoolos.android.core.chat.InquiryStatus
import com.schoolos.android.core.chat.InquiryType
import com.schoolos.android.core.designsystem.CosmicBlack
import com.schoolos.android.core.designsystem.CosmicDark
import com.schoolos.android.core.designsystem.CosmicNavy
import com.schoolos.android.core.designsystem.CosmicSurface
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.StudentNeon
import com.schoolos.android.core.designsystem.TeacherNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ChatDetailScreen(
    threadId: String,
    chatManager: ChatManager,
    onBack: () -> Unit,
    onOpenReference: (type: InquiryType, refId: String?) -> Unit = { _, _ -> },
    isTeacherMode: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val threads by chatManager.threads.collectAsState()
    val thread = threads.find { it.id == threadId }

    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    // Load full message history from real database
    LaunchedEffect(threadId) {
        chatManager.loadThreadDetail(threadId)
    }

    // Scroll to bottom when messages change
    LaunchedEffect(thread?.messages?.size) {
        if ((thread?.messages?.size ?: 0) > 0) {
            listState.animateScrollToItem((thread?.messages?.size ?: 1) - 1)
        }
    }

    val quickTemplates = if (isTeacherMode) {
        listOf(
            "👍 Pertanyaan bagus! Konsep ini sudah tepat.",
            "📖 Coba baca kembali rumus di halaman slide ke-4.",
            "📝 Silakan lanjutkan dan kumpulkan sebelum deadline.",
            "🏫 Besok akan bapak jelaskan lebih detail di kelas."
        )
    } else {
        listOf(
            "Pak, saya masih bingung cara mencari rumusnya.",
            "Apakah boleh memakai metode pengerjaan lain pak?",
            "Terima kasih banyak atas penjelasannya pak! 🙏"
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(CosmicBlack)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        // ── Top App Bar ─────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Kembali",
                    tint = TextPrimary
                )
            }

            Spacer(Modifier.width(4.dp))

            // Recipient Avatar
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        if (isTeacherMode) StudentNeon.copy(alpha = 0.2f)
                        else TeacherNeon.copy(alpha = 0.2f)
                    )
                    .border(
                        1.dp,
                        if (isTeacherMode) StudentNeon.copy(alpha = 0.5f)
                        else TeacherNeon.copy(alpha = 0.5f),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isTeacherMode) (thread?.studentName?.take(1) ?: "S")
                    else (thread?.teacherName?.take(1) ?: "G"),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
            }

            Spacer(Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (isTeacherMode) (thread?.studentName ?: "Siswa")
                        else (thread?.teacherName ?: "Guru"),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (isTeacherMode) (thread?.studentClass ?: "") else "Guru Pengampu",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isTeacherMode) StudentNeon else TeacherNeon
                        )
                    }
                }
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(NeonSuccess)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "Aktif di School OS • Responsif",
                        fontSize = 10.sp,
                        color = TextTertiary
                    )
                }
            }
        }

        // ── Reference Banner (Materi / Tugas Terkait) ─────────────
        if (thread != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(CosmicNavy)
                    .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            if (thread.inquiryType == InquiryType.MATERIAL) Icons.AutoMirrored.Filled.MenuBook
                            else Icons.AutoMirrored.Filled.Assignment,
                            contentDescription = null,
                            tint = if (thread.inquiryType == InquiryType.MATERIAL) NeonBlue else StudentNeon,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text(
                                text = if (thread.inquiryType == InquiryType.MATERIAL) "Membahas Materi Ajar:"
                                else "Membahas Tugas Siswa:",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (thread.inquiryType == InquiryType.MATERIAL) NeonBlue else StudentNeon
                            )
                            Text(
                                text = thread.referenceTitle,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary,
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                            )
                        }
                    }

                    Surface(
                        onClick = { onOpenReference(thread.inquiryType, thread.referenceId) },
                        shape = RoundedCornerShape(8.dp),
                        color = CosmicSurface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Buka", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(Modifier.width(2.dp))
                            Icon(Icons.Default.OpenInNew, null, modifier = Modifier.size(11.dp), tint = TextSecondary)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(4.dp))

        // ── Message Bubbles ──────────────────────────────────────
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val messages = thread?.messages ?: emptyList()
            items(messages, key = { it.id }) { msg ->
                val isMe = if (isTeacherMode) msg.isFromTeacher else !msg.isFromTeacher
                MessageBubble(
                    message = msg,
                    isMe = isMe,
                    senderColor = if (msg.isFromTeacher) TeacherNeon else StudentNeon
                )
            }
        }

        // ── Quick Templates ─────────────────────────────────────
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(quickTemplates) { tmpl ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(CosmicNavy)
                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                        .clickable {
                            inputText = tmpl
                        }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = tmpl,
                        fontSize = 11.sp,
                        color = TextSecondary,
                        maxLines = 1
                    )
                }
            }
        }

        // ── Bottom Input Row ────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        if (isTeacherMode) "Tulis jawaban / bimbingan untuk siswa..."
                        else "Tulis pertanyaan Anda untuk guru...",
                        fontSize = 12.sp,
                        color = TextTertiary
                    )
                },
                maxLines = 4,
                shape = RoundedCornerShape(22.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = CosmicNavy,
                    unfocusedContainerColor = CosmicNavy,
                    focusedBorderColor = if (isTeacherMode) TeacherNeon else StudentNeon,
                    unfocusedBorderColor = GlassBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = {
                    if (inputText.isNotBlank() && thread != null) {
                        val senderRole = if (isTeacherMode) "TEACHER" else "STUDENT"
                        val senderName = if (isTeacherMode) thread.teacherName else thread.studentName
                        val senderId = if (isTeacherMode) thread.teacherId else thread.studentId

                        chatManager.sendMessage(
                            threadId = thread.id,
                            senderId = senderId,
                            senderName = senderName,
                            senderRole = senderRole,
                            content = inputText
                        )
                        inputText = ""
                        focusManager.clearFocus()
                    }
                })
            )

            Spacer(Modifier.width(8.dp))

            IconButton(
                onClick = {
                    if (inputText.isNotBlank() && thread != null) {
                        val senderRole = if (isTeacherMode) "TEACHER" else "STUDENT"
                        val senderName = if (isTeacherMode) thread.teacherName else thread.studentName
                        val senderId = if (isTeacherMode) thread.teacherId else thread.studentId

                        chatManager.sendMessage(
                            threadId = thread.id,
                            senderId = senderId,
                            senderName = senderName,
                            senderRole = senderRole,
                            content = inputText
                        )
                        inputText = ""
                        focusManager.clearFocus()
                    }
                },
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(
                        if (inputText.isNotBlank()) {
                            if (isTeacherMode) TeacherNeon else StudentNeon
                        } else {
                            CosmicNavy
                        }
                    )
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Kirim",
                    tint = if (inputText.isNotBlank()) Color.White else TextTertiary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun MessageBubble(
    message: ChatMessage,
    isMe: Boolean,
    senderColor: Color,
) {
    val align = if (isMe) Alignment.End else Alignment.Start
    val bubbleColor = if (isMe) {
        if (message.isFromTeacher) TeacherNeon.copy(alpha = 0.18f)
        else StudentNeon.copy(alpha = 0.18f)
    } else {
        CosmicNavy
    }
    val borderColor = if (isMe) {
        if (message.isFromTeacher) TeacherNeon.copy(alpha = 0.4f)
        else StudentNeon.copy(alpha = 0.4f)
    } else {
        GlassBorder
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = align
    ) {
        // Sender Name & Role
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (isMe) "Anda" else message.senderName,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = senderColor
            )
            if (message.isFromTeacher) {
                Spacer(Modifier.width(4.dp))
                Icon(Icons.Default.School, null, tint = TeacherNeon, modifier = Modifier.size(11.dp))
                Spacer(Modifier.width(2.dp))
                Text("Guru", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TeacherNeon)
            }
        }

        Spacer(Modifier.height(3.dp))

        // Bubble Content
        Box(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isMe) 16.dp else 4.dp,
                        bottomEnd = if (isMe) 4.dp else 16.dp
                    )
                )
                .background(bubbleColor)
                .border(
                    1.dp,
                    borderColor,
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isMe) 16.dp else 4.dp,
                        bottomEnd = if (isMe) 4.dp else 16.dp
                    )
                )
                .padding(12.dp)
        ) {
            Column {
                Text(
                    text = message.content,
                    fontSize = 13.sp,
                    color = TextPrimary,
                    lineHeight = 18.sp
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(message.timestamp)),
                    fontSize = 9.sp,
                    color = TextTertiary,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}
