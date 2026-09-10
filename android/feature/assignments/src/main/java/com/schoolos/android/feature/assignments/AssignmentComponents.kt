package com.schoolos.android.feature.assignments

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonInfo
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.TextTertiary
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

fun formatDateShort(iso: String): String {
    return try {
        val instant = Instant.parse(iso)
        val formatter = DateTimeFormatter.ofPattern("d MMM, HH:mm").withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        iso
    }
}

/** Urgency info for an assignment due date. */
data class DueInfo(val label: String, val color: Color)

@Composable
fun dueDateInfo(dueAt: String?): DueInfo? {
    if (dueAt.isNullOrBlank()) return null
    val due = try {
        Instant.parse(dueAt).atZone(ZoneId.systemDefault())
    } catch (_: Exception) {
        return null
    }
    val days = ChronoUnit.DAYS.between(LocalDate.now(), due.toLocalDate())
    return when {
        days < 0L -> DueInfo("Terlambat ${-days} hr", NeonError)
        days == 0L -> DueInfo("Hari ini", NeonWarning)
        days == 1L -> DueInfo("Besok", NeonInfo)
        days <= 7L -> DueInfo("$days hari lagi", NeonInfo)
        else -> DueInfo(formatDateShort(dueAt), TextTertiary)
    }
}
