package com.schoolos.android.core.common

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

fun String.toFormattedDate(inputPattern: String = "yyyy-MM-dd'T'HH:mm:ss'Z'", outputPattern: String = "MMM dd, yyyy"): String {
    return try {
        val inputFormatter = DateTimeFormatter.ofPattern(inputPattern, Locale.US)
        val outputFormatter = DateTimeFormatter.ofPattern(outputPattern, Locale.US)
        val dateTime = LocalDateTime.parse(this, inputFormatter)
        dateTime.format(outputFormatter)
    } catch (e: Exception) {
        this
    }
}

fun String.toReadableTime(): String {
    return toFormattedDate(outputPattern = "hh:mm a")
}

fun Double.toPercentage(): String = "${(this * 100).toInt()}%"
