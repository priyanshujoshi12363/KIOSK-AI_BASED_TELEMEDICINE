package com.aarogya.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.foundation.layout.Spacer
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.NavySoft
import com.aarogya.app.ui.theme.Saffron
import kotlinx.coroutines.delay

@androidx.compose.runtime.Composable
fun SplashScreen(onFinish: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(2200)
        onFinish()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Navy, NavySoft))),
        contentAlignment = Alignment.Center
    ) {
        TricolorStrip(Modifier.align(Alignment.TopCenter))
        TricolorStrip(Modifier.align(Alignment.BottomCenter))

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.HealthAndSafety,
                    contentDescription = null,
                    tint = Navy,
                    modifier = Modifier.size(56.dp)
                )
            }
            Spacer(Modifier.height(24.dp))
            Text("Aarogya", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.ExtraBold)
            Text(
                "AI Tele-medicine · Kerala",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 14.sp
            )
            Spacer(Modifier.height(40.dp))
            CircularProgressIndicator(color = Saffron, strokeWidth = 3.dp, modifier = Modifier.size(28.dp))
        }

        Text(
            "Government of Kerala",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 12.sp,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 28.dp)
        )
    }
}
