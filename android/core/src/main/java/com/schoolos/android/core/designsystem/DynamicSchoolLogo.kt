package com.schoolos.android.core.designsystem

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage

@Composable
fun DynamicSchoolLogo(
    logoUrl: String?,
    modifier: Modifier = Modifier,
    contentDescription: String? = "School Logo",
    fallback: @Composable () -> Unit = {
        Icon(
            imageVector = Icons.Default.School,
            contentDescription = "School Logo",
            tint = NeonBlue,
            modifier = modifier,
        )
    },
) {
    if (logoUrl.isNullOrBlank()) {
        fallback()
        return
    }

    if (logoUrl.startsWith("data:image", ignoreCase = true)) {
        val bitmap = remember(logoUrl) {
            try {
                val base64Data = logoUrl.substringAfter("base64,", "")
                if (base64Data.isNotEmpty()) {
                    val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
                } else null
            } catch (_: Exception) {
                null
            }
        }

        if (bitmap != null) {
            Image(
                bitmap = bitmap,
                contentDescription = contentDescription,
                modifier = modifier,
                contentScale = ContentScale.Crop,
            )
        } else {
            fallback()
        }
    } else {
        AsyncImage(
            model = logoUrl,
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = ContentScale.Crop,
            error = rememberVectorPainter(Icons.Default.School),
        )
    }
}
