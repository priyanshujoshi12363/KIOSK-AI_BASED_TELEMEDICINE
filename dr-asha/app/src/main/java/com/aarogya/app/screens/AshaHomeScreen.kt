package com.aarogya.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.Delivery
import com.aarogya.app.data.DeliveryStatus
import com.aarogya.app.data.MockData
import com.aarogya.app.data.Priority
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.StatusAmber
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AshaHomeScreen(onLogout: () -> Unit) {
    val deliveries = remember { mutableStateListOf<Delivery>().apply { addAll(MockData.deliveries) } }
    val pending = deliveries.count { it.status == DeliveryStatus.PENDING }
    val delivered = deliveries.count { it.status == DeliveryStatus.DELIVERED }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text(MockData.ashaName, style = MaterialTheme.typography.titleLarge)
                            Text(
                                "ASHA Worker · ${MockData.ashaVillage}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = onLogout) {
                            Icon(Icons.Filled.Logout, contentDescription = "Logout", tint = Color.White)
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
            item {
                Text(
                    "Assigned Deliveries",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(top = 8.dp, start = 4.dp)
                )
            }
            items(deliveries, key = { it.id }) { d ->
                DeliveryCard(d) {
                    val i = deliveries.indexOfFirst { it.id == d.id }
                    if (i >= 0) deliveries[i] = d.copy(status = DeliveryStatus.DELIVERED)
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
private fun DeliveryCard(d: Delivery, onDelivered: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                InitialsAvatar(d.villagerName, IndiaGreen)
                Column(Modifier.weight(1f).padding(start = 14.dp)) {
                    Text(d.villagerName, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text("${d.ageGender} · ${d.village}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
                if (d.priority == Priority.URGENT && d.status == DeliveryStatus.PENDING) {
                    Pill("Urgent", StatusRed, StatusRed.copy(alpha = 0.12f))
                }
            }

            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.Top) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                Text(
                    "${d.address}\n${d.phone}",
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
                                Text(m.name, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                                Text(m.dosage, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            }
                            Text("x${m.quantity}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            if (d.status == DeliveryStatus.DELIVERED) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
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
