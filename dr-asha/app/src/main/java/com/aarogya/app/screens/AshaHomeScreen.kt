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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Medication
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableIntStateOf
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
import com.aarogya.app.data.remote.DeliveryDto
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.StatusAmber
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AshaHomeScreen(onLogout: () -> Unit) {
    val scope = rememberCoroutineScope()
    val deliveries = remember { mutableStateListOf<DeliveryDto>() }
    var pending by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun load() {
        loading = true
        error = null
        try {
            val r = ApiClient.service.getDeliveries()
            deliveries.clear()
            deliveries.addAll(r.deliveries)
            pending = r.pending
        } catch (e: Exception) {
            error = "Could not load deliveries"
        } finally {
            loading = false
        }
    }

    LaunchedEffect(Unit) { load() }

    val delivered = deliveries.count { it.status == "COMPLETED" }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text(SessionStore.name ?: "ASHA Worker", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "ASHA Worker",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = onLogout) {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = IndiaGreen,
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
                CircularProgressIndicator(color = IndiaGreen)
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    SummaryCard("Pending", pending.toString(), StatusAmber, Modifier.weight(1f))
                    SummaryCard("Delivered", delivered.toString(), StatusGreen, Modifier.weight(1f))
                }
            }
            if (error != null) {
                item { Text(error!!, color = StatusRed, modifier = Modifier.padding(4.dp)) }
            }
            item {
                Text(
                    "Assigned Deliveries",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(top = 8.dp, start = 4.dp)
                )
            }
            if (deliveries.isEmpty()) {
                item {
                    Text(
                        "No deliveries assigned yet.",
                        color = TextSecondary,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
            items(deliveries, key = { it.id ?: it.hashCode().toString() }) { d ->
                DeliveryCard(d) {
                    val id = d.id ?: return@DeliveryCard
                    scope.launch {
                        try {
                            ApiClient.service.markDelivered(id)
                            load()
                        } catch (e: Exception) {
                            error = "Failed to update"
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryCard(label: String, value: String, tint: Color, modifier: Modifier) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(value, color = tint, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.headlineLarge)
            Text(label, color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun DeliveryCard(d: DeliveryDto, onDelivered: () -> Unit) {
    val done = d.status == "COMPLETED"
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                InitialsAvatar(d.villager?.name ?: "?", IndiaGreen)
                Column(Modifier.weight(1f).padding(start = 14.dp)) {
                    Text(d.villager?.name ?: "Villager", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text(d.villager?.village ?: "", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
                if (d.priority == "URGENT" && !done) {
                    Pill("Urgent", StatusRed, StatusRed.copy(alpha = 0.12f))
                }
            }

            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.Top) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                Text(
                    listOfNotNull(d.deliveryAddress, d.villager?.phone).joinToString("\n"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(start = 6.dp)
                )
            }

            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Medication, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(6.dp))
                        Text("Medicines", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Spacer(Modifier.height(8.dp))
                    d.medicines.forEach { m ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(Modifier.weight(1f)) {
                                Text(m.name ?: "", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                                Text(m.dosage ?: "", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            }
                            Text("x${m.quantity ?: 1}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            if (done) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("Delivered", color = StatusGreen, fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = onDelivered,
                    colors = ButtonDefaults.buttonColors(containerColor = IndiaGreen, contentColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Mark as Delivered", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
