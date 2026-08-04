package com.aarogya.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.MockData
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import kotlinx.coroutines.delay

@Composable
fun VideoCallScreen(onEnd: () -> Unit) {
    val call = MockData.incomingCall
    var seconds by remember { mutableIntStateOf(0) }
    var muted by remember { mutableStateOf(false) }
    var videoOn by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            seconds += 1
        }
    }

    val timer = "%02d:%02d".format(seconds / 60, seconds % 60)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF15171F), Color(0xFF262A3A))))
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(top = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier.size(120.dp).clip(CircleShape).background(call.tint.copy(alpha = 0.25f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(64.dp))
            }
            Spacer(Modifier.height(20.dp))
            Text(call.patientName, color = Color.White, fontWeight = FontWeight.Bold, style = androidx.compose.material3.MaterialTheme.typography.headlineSmall)
            Text("${call.ageGender} · ${call.village}", color = Color.White.copy(alpha = 0.7f))
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(8.dp).clip(CircleShape).background(StatusGreen))
                Spacer(Modifier.width(6.dp))
                Text(timer, color = Color.White.copy(alpha = 0.85f))
            }
        }

        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .padding(top = 40.dp)
                .size(96.dp, 132.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF3A3F52)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(40.dp))
        }

        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
                .padding(top = 40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color.Black.copy(alpha = 0.35f))
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(call.complaint, color = Color.White, style = androidx.compose.material3.MaterialTheme.typography.bodyMedium)
        }

        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 40.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CallButton(
                icon = if (muted) Icons.Filled.MicOff else Icons.Filled.Mic,
                bg = Color.White.copy(alpha = 0.15f),
                onClick = { muted = !muted }
            )
            CallButton(
                icon = Icons.Filled.CallEnd,
                bg = StatusRed,
                size = 72,
                onClick = onEnd
            )
            CallButton(
                icon = if (videoOn) Icons.Filled.Videocam else Icons.Filled.VideocamOff,
                bg = Color.White.copy(alpha = 0.15f),
                onClick = { videoOn = !videoOn }
            )
        }
    }
}

@Composable
private fun CallButton(icon: ImageVector, bg: Color, size: Int = 60, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(size.dp)
            .clip(CircleShape)
            .background(bg)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size((size / 2.4).dp))
    }
}
