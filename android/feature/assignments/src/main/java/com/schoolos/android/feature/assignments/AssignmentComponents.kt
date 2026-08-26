package com.schoolos.android.feature.assignments

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

fun formatDateShort(iso: String): String {
    return try {
        val instant = Instant.parse(iso)
        val formatter = DateTimeFormatter.ofPattern("d MMM, HH:mm").withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        iso
    }
}
