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
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Videocam
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.Consultation
import com.aarogya.app.data.ConsultStatus
import com.aarogya.app.data.MockData
import com.aarogya.app.ui.components.InitialsAvatar
import com.aarogya.app.ui.components.Pill
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.NavySoft
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.Saffron
import com.aarogya.app.ui.theme.StatusAmber
import com.aarogya.app.ui.theme.StatusGreen
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorHomeScreen(onStartCall: () -> Unit, onLogout: () -> Unit) {
    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text(MockData.doctorName, style = MaterialTheme.typography.titleLarge)
                            Text(
                                MockData.doctorSpecialty,
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
                        containerColor = Navy,
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
            item { IncomingCallCard(onStartCall) }
            item {
                Text(
                    "Consultation History",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(top = 8.dp, start = 4.dp)
                )
            }
            items(MockData.consultations) { c -> ConsultationCard(c) }
        }
    }
}

@Composable
private fun IncomingCallCard(onStartCall: () -> Unit) {
    val call = MockData.incomingCall
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .background(Brush.linearGradient(listOf(Navy, NavySoft)))
                .padding(18.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(10.dp).background(Saffron, RoundedCornerShape(50))
                )
                Spacer(Modifier.size(8.dp))
                Text(
                    "INCOMING CONSULTATION",
                    color = Saffron,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(12.dp))
            Text(call.patientName, color = Color.White, style = MaterialTheme.typography.headlineSmall)
            Text(
                "${call.ageGender} · ${call.village}",
                color = Color.White.copy(alpha = 0.75f),
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(Modifier.height(6.dp))
            Text(call.complaint, color = Color.White.copy(alpha = 0.9f), style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onStartCall,
                colors = ButtonDefaults.buttonColors(containerColor = Saffron, contentColor = Navy),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Icon(Icons.Filled.Videocam, contentDescription = null)
                Spacer(Modifier.size(8.dp))
                Text("Join Video Call", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ConsultationCard(c: Consultation) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            InitialsAvatar(c.patientName, c.tint)
            Column(Modifier.weight(1f).padding(start = 14.dp)) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(c.patientName, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                    StatusPill(c.status)
                }
                Text(
                    "${c.ageGender} · ${c.village}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(Modifier.height(6.dp))
                Text(c.complaint, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                Text(
                    "Dx: ${c.diagnosis}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(Modifier.height(6.dp))
                Text(c.dateTime, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            }
        }
    }
}

@Composable
private fun StatusPill(status: ConsultStatus) {
    when (status) {
        ConsultStatus.COMPLETED -> Pill("Completed", StatusGreen, StatusGreen.copy(alpha = 0.12f))
        ConsultStatus.UPCOMING -> Pill("Upcoming", StatusAmber, StatusAmber.copy(alpha = 0.12f))
        ConsultStatus.MISSED -> Pill("Missed", StatusRed, StatusRed.copy(alpha = 0.12f))
    }
}
