package com.schoolos.android.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Chip that indicates an active subject filter (e.g. navigated from a session
 * detail). Tapping it clears the filter so all subjects are shown again.
 */
@Composable
fun SubjectFilterChip(
    subject: String,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NeonBlue.copy(alpha = 0.08f))
            .border(1.dp, NeonBlue.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Default.FilterList,
            contentDescription = null,
            tint = NeonBlue,
            modifier = Modifier.size(16.dp),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            "Mata Pelajaran: ",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
        )
        Text(
            subject,
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold,
            color = NeonBlue,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f, fill = false),
        )
        Spacer(Modifier.width(8.dp))
        Icon(
            Icons.Default.Close,
            contentDescription = "Hapus filter mata pelajaran",
            tint = TextTertiary,
            modifier = Modifier
                .size(18.dp)
                .clickable(onClick = onClear),
        )
    }
}