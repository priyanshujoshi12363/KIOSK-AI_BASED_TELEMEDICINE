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
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.Warning
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
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.SessionStore
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.data.remote.DeliveryDto
import com.aarogya.app.data.remote.EmergencyDto
import kotlinx.coroutines.delay
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
fun AshaHomeScreen(onHistory: () -> Unit, onLogout: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val deliveries = remember { mutableStateListOf<DeliveryDto>() }
    val alerts = remember { mutableStateListOf<EmergencyDto>() }
    var pending by remember { mutableIntStateOf(0) }
    var openAlerts by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun loadAlerts() {
        try {
            val r = ApiClient.service.getEmergencies()
            alerts.clear()
            alerts.addAll(r.alerts.filter { it.status != "RESOLVED" })
            openAlerts = r.open
        } catch (e: Exception) {
            openAlerts = 0
        }
    }

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
        loadAlerts()
    }

    LaunchedEffect(Unit) { load() }

    LaunchedEffect(Unit) {
        while (true) {
            delay(15000)
            loadAlerts()
        }
    }

    fun openMap(a: EmergencyDto) {
        val loc = a.location ?: return
        val lat = loc.lat ?: return
        val lng = loc.lng ?: return
        val label = Uri.encode(a.categoryLabel ?: "Emergency")
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lng?q=$lat,$lng($label)"))
        try {
            context.startActivity(intent)
        } catch (e: Exception) {
            error = "No map app found"
        }
    }

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
                        IconButton(onClick = onHistory) {
                            Icon(Icons.Filled.History, contentDescription = "History", tint = Color.White)
                        }
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
                    SummaryCard("Emergency", openAlerts.toString(), StatusRed, Modifier.weight(1f))
                    SummaryCard("Pending", pending.toString(), StatusAmber, Modifier.weight(1f))
                    SummaryCard("Delivered", delivered.toString(), StatusGreen, Modifier.weight(1f))
                }
            }
            if (error != null) {
                item { Text(error!!, color = StatusRed, modifier = Modifier.padding(4.dp)) }
            }
            if (alerts.isNotEmpty()) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 8.dp, start = 4.dp)
                    ) {
                        Icon(Icons.Filled.Warning, contentDescription = null, tint = StatusRed, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.size(6.dp))
                        Text(
                            "Emergency Alerts",
                            style = MaterialTheme.typography.titleMedium,
                            color = StatusRed,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
                items(alerts, key = { "em-" + (it.id ?: it.hashCode().toString()) }) { a ->
                    EmergencyCard(
                        a = a,
                        onMap = { openMap(a) },
                        onAcknowledge = {
                            val id = a.id
                            if (id != null) {
                                scope.launch {
                                    try {
                                        ApiClient.service.acknowledgeEmergency(id)
                                        loadAlerts()
                                    } catch (e: Exception) {
                                        error = "Failed to acknowledge"
                                    }
                                }
                            }
                        },
                        onResolve = {
                            val id = a.id
                            if (id != null) {
                                scope.launch {
                                    try {
                                        ApiClient.service.resolveEmergency(id)
                                        loadAlerts()
                                    } catch (e: Exception) {
                                        error = "Failed to resolve"
                                    }
                                }
                            }
                        }
                    )
                }
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
private fun EmergencyCard(
    a: EmergencyDto,
    onMap: () -> Unit,
    onAcknowledge: () -> Unit,
    onResolve: () -> Unit
) {
    val acknowledged = a.status == "ACKNOWLEDGED"
    val critical = a.severity == "CRITICAL"

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.06f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Warning, contentDescription = null, tint = StatusRed, modifier = Modifier.size(26.dp))
                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                    Text(
                        a.categoryLabel ?: "Emergency",
                        style = MaterialTheme.typography.titleMedium,
                        color = StatusRed,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        listOfNotNull(a.villager?.name, a.village).joinToString(" · ").ifEmpty { "Kiosk report" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
                Pill(
                    a.severity ?: "HIGH",
                    if (critical) StatusRed else StatusAmber,
                    (if (critical) StatusRed else StatusAmber).copy(alpha = 0.14f)
                )
            }

            if (!a.patient.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "Patient: ${a.patient}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.height(10.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Column {
                    if (!a.summary.isNullOrBlank()) {
                        Text(
                            a.summary,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(Modifier.height(6.dp))
                    }
                    Text(
                        "“${a.transcript ?: ""}”",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            }

            val lat = a.location?.lat
            val lng = a.location?.lng
            val hasLocation = lat != null && lng != null

            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                Text(
                    if (hasLocation)
                        listOfNotNull(
                            a.location?.label?.takeIf { it.isNotBlank() },
                            "%.5f, %.5f".format(lat, lng)
                        ).joinToString(" · ")
                    else "Location not shared",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.weight(1f).padding(start = 6.dp)
                )
                if (hasLocation) {
                    Button(
                        onClick = onMap,
                        colors = ButtonDefaults.buttonColors(containerColor = StatusRed, contentColor = Color.White),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Filled.Map, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(6.dp))
                        Text("Map", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            if (acknowledged) {
                Button(
                    onClick = onResolve,
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen, contentColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Mark Resolved", fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = onAcknowledge,
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed, contentColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Text("I am responding", fontWeight = FontWeight.ExtraBold)
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
