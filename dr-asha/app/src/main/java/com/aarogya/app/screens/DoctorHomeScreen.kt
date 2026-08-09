package com.aarogya.app.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.delay
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.SessionStore
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.data.remote.SessionDto
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.components.Ringer
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorHomeScreen(
    onOpenConsult: (String) -> Unit,
    onHistory: () -> Unit,
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val queue = remember { mutableStateListOf<SessionDto>() }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var claimingId by remember { mutableStateOf<String?>(null) }
    var incoming by remember { mutableStateOf<SessionDto?>(null) }
    val seen = remember { mutableStateListOf<String>() }
    var primed by remember { mutableStateOf(false) }

    suspend fun load(initial: Boolean = false) {
        if (initial) loading = true
        error = null
        try {
            val r = ApiClient.service.getQueue()
            queue.clear()
            queue.addAll(r.sessions)

            val fresh = r.sessions.filter { it.id != null && !seen.contains(it.id) }
            seen.clear()
            seen.addAll(r.sessions.mapNotNull { it.id })

            if (primed && fresh.isNotEmpty() && incoming == null) {
                incoming = fresh.firstOrNull { it.urgency == "EMERGENCY" } ?: fresh.first()
                Ringer.start(context, incoming?.urgency == "EMERGENCY")
            }
            primed = true
        } catch (e: Exception) {
            error = "Could not load patient queue"
        } finally {
            loading = false
        }
    }

    LaunchedEffect(Unit) { load(initial = true) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(8000)
            load()
        }
    }

    DisposableEffect(Unit) { onDispose { Ringer.stop() } }

    incoming?.let { call ->
        IncomingCallScreen(
            session = call,
            onAccept = {
                Ringer.stop()
                val id = call.id
                incoming = null
                if (id != null) {
                    scope.launch {
                        try {
                            ApiClient.service.claimSession(id)
                            onOpenConsult(id)
                        } catch (e: Exception) {
                            error = "Could not start consultation"
                        }
                    }
                }
            },
            onDismiss = {
                Ringer.stop()
                incoming = null
            }
        )
        return
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text(SessionStore.name ?: "Doctor", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "Waiting patients: ${queue.size}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = onHistory) {
                            Icon(Icons.Filled.History, contentDescription = "History", tint = Color.White)
                        }
                        IconButton(onClick = { scope.launch { load() } }) {
                            Icon(Icons.Filled.Refresh, contentDescription = "Refresh", tint = Color.White)
                        }
                        IconButton(onClick = onLogout) {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Navy,
                        titleContentColor = Color.White
                    )
                )
                TricolorStrip()
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Navy)
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    "Patient Queue",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
            if (error != null) {
                item { Text(error!!, color = StatusRed, modifier = Modifier.padding(4.dp)) }
            }
            if (queue.isEmpty()) {
                item {
                    Text(
                        "No patients waiting right now.",
                        color = TextSecondary,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
            items(queue, key = { it.id ?: it.hashCode().toString() }) { s ->
                QueueCard(s, claimingId == s.id) {
                    val id = s.id ?: return@QueueCard
                    claimingId = id
                    scope.launch {
                        try {
                            ApiClient.service.claimSession(id)
                            onOpenConsult(id)
                        } catch (e: Exception) {
                            error = "Could not start consultation"
                        } finally {
                            claimingId = null
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QueueCard(s: SessionDto, claiming: Boolean, onStart: () -> Unit) {
    val emergency = s.urgency == "EMERGENCY"
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                InitialsAvatar(s.villager?.name ?: "?", if (emergency) StatusRed else Navy)
                Column(Modifier.weight(1f).padding(start = 14.dp)) {
                    Text(s.villager?.name ?: "Patient", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        listOfNotNull(s.villager?.gender, s.villager?.village).joinToString(" · "),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
                if (emergency) Pill("Emergency", StatusRed, StatusRed.copy(alpha = 0.12f))
            }
            Spacer(Modifier.height(10.dp))
            Text(
                s.symptoms?.ifBlank { "No symptoms recorded" } ?: "",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = onStart,
                enabled = !claiming,
                colors = ButtonDefaults.buttonColors(containerColor = Navy, contentColor = Color.White),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                if (claiming) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                } else {
                    Icon(Icons.Filled.Videocam, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Start Video Consultation", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
