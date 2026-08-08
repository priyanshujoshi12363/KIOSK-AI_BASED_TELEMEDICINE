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
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
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
import com.aarogya.app.data.remote.ConfirmRequest
import com.aarogya.app.data.remote.RxItem
import com.aarogya.app.data.remote.RxMedicine
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.Saffron
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewRxScreen(sessionId: String, onDone: () -> Unit, onManual: () -> Unit) {
    val scope = rememberCoroutineScope()
    val meds = remember { mutableStateListOf<RxMedicine>() }
    var rxId by remember { mutableStateOf<String?>(null) }
    var diagnosis by remember { mutableStateOf("") }
    var advice by remember { mutableStateOf("") }
    var followUp by remember { mutableStateOf("") }
    val keyPoints = remember { mutableStateListOf<String>() }
    var waiting by remember { mutableStateOf(true) }
    var confirming by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(sessionId) {
        repeat(40) {
            try {
                val r = ApiClient.service.getDraft(sessionId)
                val p = r.prescription
                if (p != null) {
                    rxId = p.id
                    meds.clear()
                    meds.addAll(p.medicines)
                    diagnosis = p.diagnosis ?: ""
                    advice = p.advice ?: ""
                    followUp = p.followUp ?: ""
                    keyPoints.clear()
                    keyPoints.addAll(p.keyPoints)
                    waiting = false
                    return@LaunchedEffect
                }
            } catch (e: Exception) {
                // draft not ready yet
            }
            delay(3000)
        }
        waiting = false
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text("Review Prescription", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "Written by AI from your consultation",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
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
        if (waiting) {
            Column(
                Modifier.fillMaxSize().padding(padding).padding(28.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(color = Saffron)
                Spacer(Modifier.height(18.dp))
                Text("Listening back to the consultation…", color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text(
                    "The assistant is writing the prescription from what you said.",
                    color = TextSecondary, style = MaterialTheme.typography.bodyMedium
                )
                Spacer(Modifier.height(24.dp))
                Button(onClick = onManual, colors = ButtonDefaults.buttonColors(containerColor = Navy)) {
                    Text("Write it myself instead")
                }
            }
            return@Scaffold
        }

        if (rxId == null) {
            Column(
                Modifier.fillMaxSize().padding(padding).padding(28.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("No AI draft available", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Spacer(Modifier.height(14.dp))
                Button(onClick = onManual, colors = ButtonDefaults.buttonColors(containerColor = Navy)) {
                    Text("Write prescription manually")
                }
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = Saffron, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(6.dp))
                    Text(
                        "Check every line before confirming",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            }

            if (keyPoints.isNotEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text("What you said", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Spacer(Modifier.height(6.dp))
                            keyPoints.forEach {
                                Text("• $it", color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = diagnosis, onValueChange = { diagnosis = it },
                    label = { Text("Assessment") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                Text("Medicines", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground)
            }

            items(meds, key = { it.hashCode() }) { m ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(m.name ?: "", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Text(
                                listOfNotNull(
                                    m.dosage?.takeIf { it.isNotBlank() },
                                    m.frequency?.takeIf { it.isNotBlank() },
                                    m.timing?.takeIf { it.isNotBlank() },
                                    m.duration?.takeIf { it.isNotBlank() }
                                ).joinToString(" · "),
                                color = TextSecondary,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        Text("x${m.quantity ?: 1}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        IconButton(onClick = { meds.remove(m) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Remove", tint = StatusRed)
                        }
                    }
                }
            }

            if (meds.isEmpty()) {
                item { Text("No medicines. Add them manually if needed.", color = TextSecondary) }
            }

            item {
                OutlinedTextField(
                    value = advice, onValueChange = { advice = it },
                    label = { Text("Advice") }, minLines = 2,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            item {
                OutlinedTextField(
                    value = followUp, onValueChange = { followUp = it },
                    label = { Text("Follow-up") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (error != null) {
                item { Text(error!!, color = StatusRed) }
            }

            item {
                Button(
                    onClick = {
                        val id = rxId ?: return@Button
                        if (meds.isEmpty()) { error = "Add at least one medicine"; return@Button }
                        confirming = true
                        scope.launch {
                            try {
                                ApiClient.service.confirmPrescription(
                                    id,
                                    ConfirmRequest(
                                        medicines = meds.map {
                                            RxItem(
                                                name = it.name ?: "",
                                                dosage = it.dosage,
                                                quantity = it.quantity,
                                                instructions = it.instructions
                                            )
                                        },
                                        advice = advice,
                                        diagnosis = diagnosis,
                                        followUp = followUp
                                    )
                                )
                                onDone()
                            } catch (e: Exception) {
                                error = "Could not confirm"
                            } finally {
                                confirming = false
                            }
                        }
                    },
                    enabled = !confirming,
                    colors = ButtonDefaults.buttonColors(containerColor = IndiaGreen, contentColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(54.dp)
                ) {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text(if (confirming) "Sending…" else "Confirm & send to ASHA", fontWeight = FontWeight.ExtraBold)
                }
            }

            item {
                Button(
                    onClick = onManual,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Write it myself instead") }
            }
        }
    }
}
