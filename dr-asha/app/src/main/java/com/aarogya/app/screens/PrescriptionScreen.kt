package com.aarogya.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.data.remote.CreatePrescriptionRequest
import com.aarogya.app.data.remote.MedicineDto
import com.aarogya.app.data.remote.RxItem
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrescriptionScreen(sessionId: String, onDone: () -> Unit) {
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }
    val results = remember { mutableStateListOf<MedicineDto>() }
    val selected = remember { mutableStateListOf<RxItem>() }
    var advice by remember { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(query) {
        if (query.isBlank()) {
            results.clear()
            return@LaunchedEffect
        }
        delay(300)
        try {
            val r = ApiClient.service.catalog(query.trim())
            results.clear()
            results.addAll(r.medicines)
        } catch (e: Exception) {
            results.clear()
        }
    }

    fun add(m: MedicineDto) {
        val name = m.name ?: return
        if (selected.any { it.name == name }) return
        selected.add(RxItem(name, m.defaultDosage, m.defaultQuantity ?: 1, null))
        query = ""
    }

    fun submit() {
        if (selected.isEmpty()) {
            error = "Add at least one medicine"
            return
        }
        error = null
        submitting = true
        scope.launch {
            try {
                ApiClient.service.createPrescription(
                    CreatePrescriptionRequest(sessionId, selected.toList(), advice.ifBlank { null })
                )
                onDone()
            } catch (e: Exception) {
                error = "Could not save prescription"
                submitting = false
            }
        }
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = { Text("Prescription", style = MaterialTheme.typography.titleLarge) },
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
        Column(Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search medicine") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            if (results.isNotEmpty()) {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp)
                ) {
                    Column {
                        results.take(6).forEach { m ->
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .clickable { add(m) }
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(m.name ?: "", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                                    Text(m.defaultDosage ?: "", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                                }
                                Icon(Icons.Filled.Add, contentDescription = null, tint = Navy)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            Text("Prescribed medicines", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground)
            Spacer(Modifier.height(8.dp))

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (selected.isEmpty()) {
                    item { Text("No medicines added yet.", color = TextSecondary) }
                }
                items(selected, key = { it.name }) { item ->
                    RxRow(
                        item = item,
                        onQty = { q ->
                            val i = selected.indexOfFirst { it.name == item.name }
                            if (i >= 0 && q >= 1) selected[i] = item.copy(quantity = q)
                        },
                        onRemove = {
                            selected.removeAll { it.name == item.name }
                        }
                    )
                }
                item {
                    OutlinedTextField(
                        value = advice,
                        onValueChange = { advice = it },
                        label = { Text("Advice (optional)") },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    )
                }
            }

            if (error != null) {
                Text(error!!, color = StatusRed, modifier = Modifier.padding(vertical = 6.dp))
            }

            Button(
                onClick = { submit() },
                enabled = !submitting,
                colors = ButtonDefaults.buttonColors(containerColor = StatusGreen, contentColor = Color.White),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(54.dp)
            ) {
                if (submitting) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(22.dp))
                } else {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Confirm & Send to ASHA", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun RxRow(item: RxItem, onQty: (Int) -> Unit, onRemove: () -> Unit) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(item.name, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(item.dosage ?: "", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            }
            Box(
                Modifier
                    .size(32.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                    .clickable { onQty((item.quantity ?: 1) - 1) },
                contentAlignment = Alignment.Center
            ) { Text("-", fontWeight = FontWeight.Bold) }
            Text(
                "${item.quantity ?: 1}",
                modifier = Modifier.padding(horizontal = 10.dp),
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Box(
                Modifier
                    .size(32.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                    .clickable { onQty((item.quantity ?: 1) + 1) },
                contentAlignment = Alignment.Center
            ) { Text("+", fontWeight = FontWeight.Bold) }
            IconButton(onClick = onRemove) {
                Icon(Icons.Filled.Close, contentDescription = "Remove", tint = StatusRed)
            }
        }
    }
}
