package com.aarogya.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AppColors = lightColorScheme(
    primary = Navy,
    onPrimary = Color.White,
    secondary = IndiaGreen,
    onSecondary = Color.White,
    tertiary = Saffron,
    onTertiary = InkDark,
    background = AppBackground,
    onBackground = TextPrimary,
    surface = CardWhite,
    onSurface = TextPrimary,
    surfaceVariant = Color(0xFFEDEFF5),
    onSurfaceVariant = TextSecondary,
    outline = Divider,
    error = StatusRed
)

@Composable
fun AarogyaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppColors,
        typography = Typography,
        content = content
    )
}
