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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.data.remote.DeliveryDto
import com.aarogya.app.data.remote.EmergencyDto
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AshaHistoryScreen(onBack: () -> Unit) {
    val deliveries = remember { mutableStateListOf<DeliveryDto>() }
    val emergencies = remember { mutableStateListOf<EmergencyDto>() }
    var tab by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val r = ApiClient.service.getAshaHistory()
            deliveries.clear(); deliveries.addAll(r.deliveries)
            emergencies.clear(); emergencies.addAll(r.emergencies)
        } catch (e: Exception) {
            error = "Could not load history"
        } finally {
            loading = false
        }
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text("My Work History", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "${deliveries.size} delivered · ${emergencies.size} emergencies",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = IndiaGreen, titleContentColor = Color.White
                    )
                )
                TricolorStrip()
                TabRow(selectedTabIndex = tab, containerColor = MaterialTheme.colorScheme.surface) {
                    Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Deliveries") })
                    Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Emergencies") })
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = IndiaGreen)
            }
            return@Scaffold
        }

        val empty = if (tab == 0) deliveries.isEmpty() else emergencies.isEmpty()
        if (empty) {
            Box(Modifier.fillMaxSize().padding(padding).padding(28.dp), contentAlignment = Alignment.Center) {
                Text(
                    error ?: if (tab == 0) "No completed deliveries yet."
                    else "No emergencies handled yet.",
                    color = TextSecondary
                )
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (tab == 0) {
                items(deliveries, key = { it.id ?: it.hashCode().toString() }) { d ->
                    PastDeliveryCard(d)
                }
            } else {
                items(emergencies, key = { it.id ?: it.hashCode().toString() }) { a ->
                    PastEmergencyCard(a)
                }
            }
        }
    }
}

@Composable
private fun PastDeliveryCard(d: DeliveryDto) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                InitialsAvatar(d.villager?.name ?: "?", StatusGreen)
                Column(Modifier.weight(1f).padding(start = 12.dp)) {
                    Text(
                        d.villager?.name ?: "Villager",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        listOfNotNull(d.villager?.village, formatWhen(d.completedAt ?: d.createdAt))
                            .joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall, color = TextSecondary
                    )
                }
                Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(22.dp))
            }

            if (d.medicines.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                Box(
                    Modifier.fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                        .padding(11.dp)
                ) {
                    Column {
                        d.medicines.forEach { m ->
                            Text(
                                listOfNotNull(
                                    m.name,
                                    m.dosage?.takeIf { it.isNotBlank() },
                                    m.timing?.takeIf { it.isNotBlank() }
                                ).joinToString(" · ") + "  x${m.quantity ?: 1}",
                                style = MaterialTheme.typography.bodySmall, color = TextSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PastEmergencyCard(a: EmergencyDto) {
    val resolved = a.status == "RESOLVED"
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Warning, contentDescription = null, tint = StatusRed, modifier = Modifier.size(22.dp))
                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                    Text(
                        a.categoryLabel ?: "Emergency",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        listOfNotNull(
                            a.villager?.name ?: a.village,
                            formatWhen(a.acknowledgedAt ?: a.createdAt)
                        ).joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall, color = TextSecondary
                    )
                }
                Pill(
                    if (resolved) "Resolved" else "Responded",
                    if (resolved) StatusGreen else IndiaGreen,
                    (if (resolved) StatusGreen else IndiaGreen).copy(alpha = 0.12f)
                )
            }

            if (!a.transcript.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "“${a.transcript}”",
                    style = MaterialTheme.typography.bodySmall, color = TextSecondary
                )
            }
        }
    }
}
