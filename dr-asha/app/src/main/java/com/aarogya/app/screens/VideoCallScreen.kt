package com.aarogya.app.screens

import android.Manifest
import android.content.pm.PackageManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.ui.theme.StatusRed

private fun hasPerms(context: android.content.Context): Boolean {
    val cam = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    val mic = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
    return cam == PackageManager.PERMISSION_GRANTED && mic == PackageManager.PERMISSION_GRANTED
}

@Composable
fun VideoCallScreen(sessionId: String, onEnd: () -> Unit) {
    val context = LocalContext.current
    var granted by remember { mutableStateOf(hasPerms(context)) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result -> granted = result.values.all { it } }

    LaunchedEffect(Unit) {
        if (!granted) {
            launcher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
        }
    }

    val url = ApiClient.BASE_URL + "video.html?session=" + sessionId + "&role=doctor"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF15171F))
    ) {
        if (granted) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.mediaPlaybackRequiresUserGesture = false
                        webChromeClient = object : WebChromeClient() {
                            override fun onPermissionRequest(request: PermissionRequest) {
                                request.grant(request.resources)
                            }
                        }
                        loadUrl(url)
                    }
                }
            )
        } else {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Camera and microphone permission is required for the video call.",
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                Button(onClick = {
                    launcher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
                }) { Text("Grant Permission") }
            }
        }

        Button(
            onClick = onEnd,
            colors = ButtonDefaults.buttonColors(containerColor = StatusRed, contentColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .fillMaxWidth(0.85f)
                .height(56.dp)
        ) {
            Icon(Icons.Filled.CallEnd, contentDescription = null)
            Spacer(Modifier.size(8.dp))
            Text("End Call & Write Prescription", fontWeight = FontWeight.Bold)
        }
    }
}
