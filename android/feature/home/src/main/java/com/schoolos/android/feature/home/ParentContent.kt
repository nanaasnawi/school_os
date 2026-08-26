package com.schoolos.android.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.schoolos.android.core.designsystem.DonutChart
import com.schoolos.android.core.designsystem.GlassBorder
import com.schoolos.android.core.designsystem.NeonBlue
import com.schoolos.android.core.designsystem.NeonError
import com.schoolos.android.core.designsystem.NeonSuccess
import com.schoolos.android.core.designsystem.NeonWarning
import com.schoolos.android.core.designsystem.ParentNeon
import com.schoolos.android.core.designsystem.TextPrimary
import com.schoolos.android.core.designsystem.TextSecondary
import com.schoolos.android.core.designsystem.TextTertiary

fun LazyListScope.parentContent(
    onNavigateToProgress: () -> Unit,
    onNavigateToNotifications: () -> Unit,
) {
    item {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .shadow(3.dp, RoundedCornerShape(20.dp), spotColor = Color(0x10000000))
                .clickable { onNavigateToProgress() }
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(54.dp).clip(CircleShape)
                        .background(ParentNeon.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Default.School, null, tint = ParentNeon, modifier = Modifier.size(26.dp)) }
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Muhammad Ali", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                    Text("Kelas 7A", fontSize = 12.sp, color = TextSecondary)
                    Spacer(Modifier.height(2.dp))
                    Text("NIS: 12345678", fontSize = 11.sp, color = TextTertiary)
                }
                Icon(Icons.Default.ChevronRight, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
            }
        }
    }

    item {
        LightCard {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Kehadiran Siswa", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                        Text("Agustus 2026", fontSize = 11.sp, color = TextTertiary)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonSuccess.copy(alpha = 0.12f))
                            .border(1.dp, NeonSuccess.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                    ) {
                        Text("90% Hadir", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NeonSuccess)
                    }
                }
                Spacer(Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    DonutChart(
                        percentage = 0.90f,
                        activeColor = NeonSuccess,
                        backgroundColor = NeonSuccess.copy(alpha = 0.12f),
                        labelText = "Hadir",
                        modifier = Modifier.size(100.dp),
                        strokeWidth = 18f,
                    )
                    Spacer(Modifier.width(20.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        LightAttendanceLegendRow("Hadir", "18 hari", NeonSuccess)
                        LightAttendanceLegendRow("Sakit", "1 hari",  NeonWarning)
                        LightAttendanceLegendRow("Izin",  "1 hari",  NeonBlue)
                        LightAttendanceLegendRow("Alfa",  "0 hari",  NeonError)
                    }
                }
            }
        }
    }
}

@Composable
fun LightAttendanceLegendRow(label: String, value: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(10.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(8.dp))
        Text(label, fontSize = 12.sp, color = TextSecondary, modifier = Modifier.width(40.dp))
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
    }
}
