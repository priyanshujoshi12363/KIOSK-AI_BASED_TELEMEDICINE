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
import androidx.compose.material.icons.filled.Medication
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
import com.aarogya.app.data.remote.HistorySessionDto
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.StatusAmber
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorHistoryScreen(onBack: () -> Unit) {
    val items = remember { mutableStateListOf<HistorySessionDto>() }
    var dispensed by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val r = ApiClient.service.getDoctorHistory()
            items.clear()
            items.addAll(r.sessions)
            dispensed = r.dispensed
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
                            Text("Consultation History", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "${items.size} completed · $dispensed delivered",
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
                        containerColor = Navy, titleContentColor = Color.White
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

        if (items.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding).padding(28.dp), contentAlignment = Alignment.Center) {
                Text(
                    error ?: "You have not completed any consultations yet.",
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
            items(items, key = { it.id ?: it.hashCode().toString() }) { s ->
                HistoryCard(s)
            }
        }
    }
}

@Composable
private fun HistoryCard(s: HistorySessionDto) {
    val emergency = s.urgency == "EMERGENCY"
    val delivered = s.status == "DISPENSED"

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                InitialsAvatar(s.villager?.name ?: "?", if (emergency) StatusRed else Navy)
                Column(Modifier.weight(1f).padding(start = 12.dp)) {
                    Text(
                        s.villager?.name ?: "Villager",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        listOfNotNull(s.village, formatWhen(s.consultEndedAt ?: s.createdAt))
                            .joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
                if (emergency) Pill("EMERGENCY", StatusRed, StatusRed.copy(alpha = 0.12f))
                else if (delivered) Pill("Delivered", StatusGreen, StatusGreen.copy(alpha = 0.12f))
                else Pill("Prescribed", StatusAmber, StatusAmber.copy(alpha = 0.12f))
            }

            if (!s.diagnosis.isNullOrBlank()) {
                Spacer(Modifier.height(10.dp))
                Text(
                    s.diagnosis,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold
                )
            }

            if (!s.symptoms.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(s.symptoms, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }

            if (s.medicines.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                Box(
                    Modifier.fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                        .padding(11.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Filled.Medication, contentDescription = null,
                                tint = IndiaGreen, modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.size(6.dp))
                            Text(
                                "${s.medicines.size} medicine(s)",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Spacer(Modifier.height(5.dp))
                        s.medicines.forEach { m ->
                            Text(
                                listOfNotNull(
                                    m.name,
                                    m.dosage?.takeIf { it.isNotBlank() },
                                    m.frequency?.takeIf { it.isNotBlank() },
                                    m.timing?.takeIf { it.isNotBlank() }
                                ).joinToString(" · ") + "  x${m.quantity ?: 1}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

fun formatWhen(iso: String?): String? {
    if (iso.isNullOrBlank()) return null
    return try {
        val date = iso.substringBefore("T")
        val time = iso.substringAfter("T").take(5)
        "$date $time"
    } catch (e: Exception) {
        null
    }
}
