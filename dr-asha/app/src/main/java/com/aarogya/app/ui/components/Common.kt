package com.aarogya.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.Saffron

@Composable
fun TricolorStrip(modifier: Modifier = Modifier, height: Dp = 4.dp) {
    Row(modifier = modifier.fillMaxWidth().height(height)) {
        Box(Modifier.weight(1f).background(Saffron).height(height))
        Box(Modifier.weight(1f).background(Color.White).height(height))
        Box(Modifier.weight(1f).background(IndiaGreen).height(height))
    }
}

@Composable
fun InitialsAvatar(name: String, tint: Color, size: Dp = 46.dp) {
    val initials = name.trim().split(" ")
        .mapNotNull { it.firstOrNull()?.uppercase() }
        .take(2)
        .joinToString("")
    Box(
        modifier = Modifier.size(size).clip(CircleShape).background(tint.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = tint,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value / 2.6f).sp
        )
    }
}

@Composable
fun Pill(text: String, textColor: Color, bg: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, color = textColor, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}
