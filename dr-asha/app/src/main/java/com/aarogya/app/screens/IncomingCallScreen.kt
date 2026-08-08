package com.aarogya.app.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.remote.SessionDto
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.StatusRed

@Composable
fun IncomingCallScreen(
    session: SessionDto,
    onAccept: () -> Unit,
    onDismiss: () -> Unit
) {
    val emergency = session.urgency == "EMERGENCY"
    val accent = if (emergency) StatusRed else IndiaGreen

    val pulse = rememberInfiniteTransition(label = "pulse")
    val scale by pulse.animateFloat(
        initialValue = 1f,
        targetValue = 1.18f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (emergency) 600 else 1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF0B0E27), Color(0xFF15173A))
                )
            )
    ) {
        TricolorStrip(Modifier.align(Alignment.TopCenter), 5.dp)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp, vertical = 56.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    if (emergency) "EMERGENCY CONSULTATION" else "INCOMING CONSULTATION",
                    color = accent,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.labelLarge
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "Aarogya Kiosk",
                    color = Color.White.copy(alpha = 0.55f),
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(contentAlignment = Alignment.Center) {
                    Box(
                        modifier = Modifier
                            .size(190.dp)
                            .scale(scale)
                            .clip(CircleShape)
                            .background(accent.copy(alpha = 0.16f))
                    )
                    InitialsAvatar(session.villager?.name ?: "?", accent, 128.dp)
                }

                Spacer(Modifier.height(24.dp))
                Text(
                    session.villager?.name ?: "Villager",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    listOfNotNull(session.village, session.villager?.phone).joinToString(" · "),
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodyLarge
                )

                if (emergency) {
                    Spacer(Modifier.height(12.dp))
                    Pill("EMERGENCY", StatusRed, StatusRed.copy(alpha = 0.2f))
                }

                if (!session.symptoms.isNullOrBlank()) {
                    Spacer(Modifier.height(20.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White.copy(alpha = 0.07f), RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        Text(
                            session.symptoms,
                            color = Color.White.copy(alpha = 0.85f),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.12f),
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.height(62.dp)
                ) {
                    Icon(Icons.Filled.CallEnd, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Later", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onAccept,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = accent,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.height(62.dp)
                ) {
                    Icon(Icons.Filled.Call, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Answer", fontWeight = FontWeight.ExtraBold)
                }
            }
        }
    }
}
