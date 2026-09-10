package com.schoolos.android.feature.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Female
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Male
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.schoolos.android.core.designsystem.CosmicBlack
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
import com.schoolos.android.domain.model.ClassStudent

@Composable
fun RombelStudentsScreen(
    className: String? = null,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: RombelStudentsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    val displayClassName = if (!className.isNullOrBlank()) className else uiState.className

    LaunchedEffect(className) {
        if (!className.isNullOrBlank() && className != uiState.className) {
            viewModel.loadStudents(className)
        }
    }

    val students = uiState.students
    val isLoading = uiState.isLoading
    val errorMessage = uiState.errorMessage
    val searchQuery = uiState.searchQuery
    val filteredStudents = uiState.filteredStudents
    val maleCount = uiState.maleCount
    val femaleCount = uiState.femaleCount

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(CosmicBlack)
            .statusBarsPadding()
    ) {
        // ── Hero Header ─────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(TeacherNeon.copy(alpha = 0.08f), CosmicBlack)
                    )
                )
        ) {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                // Nav row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali",
                            tint = TextPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    IconButton(
                        onClick = { viewModel.loadStudents(displayClassName) },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(CosmicNavy)
                            .border(1.dp, GlassBorder, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Muat Ulang",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Title block
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(TeacherNeon.copy(alpha = 0.25f), NeonBlue.copy(alpha = 0.2f))
                                )
                            )
                            .border(1.5.dp, TeacherNeon.copy(alpha = 0.45f), RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            tint = TeacherNeon,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(
                            text = "DAFTAR MURID ROMBEL",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = TeacherNeon,
                            letterSpacing = 1.5.sp
                        )
                        Text(
                            text = "Kelas $displayClassName",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary,
                            letterSpacing = (-0.5).sp
                        )
                        Text(
                            text = "${students.size} siswa terdaftar",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                // KPI row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    RombelKpiCard(
                        title = "Total",
                        value = "${students.size}",
                        subtitle = "Siswa",
                        accentColor = TeacherNeon,
                        icon = Icons.Default.School,
                        modifier = Modifier.weight(1f)
                    )
                    RombelKpiCard(
                        title = "Laki-laki",
                        value = "$maleCount",
                        subtitle = "Siswa",
                        accentColor = NeonBlue,
                        icon = Icons.Default.Male,
                        modifier = Modifier.weight(1f)
                    )
                    RombelKpiCard(
                        title = "Perempuan",
                        value = "$femaleCount",
                        subtitle = "Siswi",
                        accentColor = StudentNeon,
                        icon = Icons.Default.Female,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // ── Search Bar ──────────────────────────────────────────────────
        Box(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text(
                        "Cari nama murid atau NISN...",
                        fontSize = 13.sp,
                        color = TextTertiary
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = TextTertiary,
                        modifier = Modifier.size(18.dp)
                    )
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
        }

        // Section divider label
        if (filteredStudents.isNotEmpty()) {
            Row(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${filteredStudents.size} murid",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextTertiary,
                    letterSpacing = 0.5.sp
                )
                Spacer(Modifier.width(8.dp))
                HorizontalDivider(
                    modifier = Modifier.weight(1f),
                    color = GlassBorder,
                    thickness = 0.5.dp
                )
            }
        }

        // ── Content ─────────────────────────────────────────────────────
        when {
            isLoading && students.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(
                            color = TeacherNeon,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(40.dp)
                        )
                        Text(
                            text = "Memuat data murid...",
                            fontSize = 14.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
            errorMessage != null && students.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFEF4444).copy(alpha = 0.1f))
                                .border(1.5.dp, Color(0xFFEF4444).copy(alpha = 0.3f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.WarningAmber,
                                contentDescription = null,
                                tint = Color(0xFFEF4444),
                                modifier = Modifier.size(36.dp)
                            )
                        }
                        Text(
                            text = "Gagal Memuat Data",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = errorMessage,
                            fontSize = 13.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center,
                            lineHeight = 20.sp
                        )
                        Surface(
                            onClick = { viewModel.loadStudents(displayClassName) },
                            shape = RoundedCornerShape(14.dp),
                            color = TeacherNeon.copy(alpha = 0.15f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, TeacherNeon.copy(alpha = 0.5f))
                        ) {
                            Text(
                                text = "Coba Lagi",
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TeacherNeon
                            )
                        }
                    }
                }
            }
            filteredStudents.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(32.dp),
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
                                imageVector = Icons.Default.People,
                                contentDescription = null,
                                tint = TextTertiary,
                                modifier = Modifier.size(38.dp)
                            )
                        }
                        Text(
                            text = if (searchQuery.isNotBlank()) "Murid Tidak Ditemukan" else "Belum Ada Siswa",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = if (searchQuery.isNotBlank())
                                "Tidak ada siswa dengan nama/NISN \"$searchQuery\"."
                            else
                                "Belum ada murid terdaftar di rombel $displayClassName.",
                            fontSize = 13.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center,
                            lineHeight = 20.sp
                        )
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .navigationBarsPadding(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(filteredStudents, key = { _, s -> s.id }) { index, student ->
                        var visible by remember { mutableStateOf(false) }
                        LaunchedEffect(Unit) { visible = true }
                        AnimatedVisibility(
                            visible = visible,
                            enter = fadeIn(tween(180 + index * 35)) +
                                    slideInVertically(tween(180 + index * 35)) { it / 3 }
                        ) {
                            StudentCard(student = student, index = index + 1)
                        }
                    }
                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }
}

@Composable
private fun StudentCard(
    student: ClassStudent,
    index: Int,
    modifier: Modifier = Modifier,
) {
    val isFemale = student.gender?.trim()?.uppercase() == "P"
    val genderColor = if (isFemale) StudentNeon else NeonBlue
    val genderLabel = if (isFemale) "Perempuan" else "Laki-laki"
    val genderIcon = if (isFemale) Icons.Default.Female else Icons.Default.Male
    val avatarGradient = if (isFemale)
        Brush.linearGradient(listOf(Color(0xFFEC4899), Color(0xFFA855F7)))
    else
        Brush.linearGradient(listOf(Color(0xFF3B82F6), Color(0xFF06B6D4)))

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(CosmicNavy)
            .border(
                width = 1.dp,
                brush = Brush.linearGradient(
                    listOf(genderColor.copy(alpha = 0.18f), GlassBorder)
                ),
                shape = RoundedCornerShape(20.dp)
            )
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Numbered Avatar
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape)
                    .background(avatarGradient)
                    .border(2.dp, Color.White.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "$index",
                        fontSize = 7.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.75f),
                        lineHeight = 8.sp
                    )
                    Text(
                        text = student.fullName.firstOrNull()?.toString()?.uppercase() ?: "?",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        lineHeight = 20.sp
                    )
                }
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = student.fullName,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(NeonSuccess.copy(alpha = 0.12f))
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "✓ Aktif",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = NeonSuccess
                        )
                    }
                }

                Spacer(Modifier.height(5.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // NISN badge
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(CosmicSurface)
                            .border(1.dp, GlassBorder, RoundedCornerShape(8.dp))
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Badge,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(10.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = student.nisn ?: "-",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )
                    }
                    // Gender badge
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(genderColor.copy(alpha = 0.1f))
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Icon(
                            imageVector = genderIcon,
                            contentDescription = null,
                            tint = genderColor,
                            modifier = Modifier.size(10.dp)
                        )
                        Spacer(Modifier.width(3.dp))
                        Text(
                            text = genderLabel,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = genderColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RombelKpiCard(
    title: String,
    value: String,
    subtitle: String,
    accentColor: Color,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.verticalGradient(
                    listOf(accentColor.copy(alpha = 0.1f), CosmicNavy)
                )
            )
            .border(1.dp, accentColor.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .padding(12.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(accentColor.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(17.dp)
                )
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
                maxLines = 1
            )
        }
    }
}
