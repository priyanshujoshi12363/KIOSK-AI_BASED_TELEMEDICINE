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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.aarogya.app.data.SessionStore
import com.aarogya.app.data.remote.ApiClient
import com.aarogya.app.data.remote.AshaLoginRequest
import com.aarogya.app.data.remote.DoctorLoginRequest
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import com.aarogya.app.ui.components.TricolorStrip
import com.aarogya.app.ui.theme.IndiaGreen
import com.aarogya.app.ui.theme.Navy
import com.aarogya.app.ui.theme.StatusRed
import com.aarogya.app.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLoggedIn: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var role by remember { mutableStateOf("DOCTOR") }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        if (identifier.isBlank() || password.isBlank()) {
            error = "Enter your credentials"
            return
        }
        error = null
        loading = true
        scope.launch {
            try {
                if (role == "DOCTOR") {
                    val r = ApiClient.service.doctorLogin(
                        DoctorLoginRequest(identifier.trim(), password.trim())
                    )
                    if (r.token != null) {
                        SessionStore.save(context, r.token, "DOCTOR", r.doctor?.name)
                        onLoggedIn("DOCTOR")
                    } else error = "Login failed"
                } else {
                    val r = ApiClient.service.ashaLogin(
                        AshaLoginRequest(identifier.trim(), password.trim())
                    )
                    if (r.token != null) {
                        SessionStore.save(context, r.token, "ASHA", r.asha?.name)
                        onLoggedIn("ASHA")
                    } else error = "Login failed"
                }
            } catch (e: HttpException) {
                error = when (e.code()) {
                    401 -> if (role == "DOCTOR") "Wrong email or password"
                           else "Wrong phone number or password"
                    403 -> "This account is not active"
                    in 500..599 -> "Server problem, please try again"
                    else -> "Could not sign in (${e.code()})"
                }
            } catch (e: SocketTimeoutException) {
                error = "Server is waking up, please try again in a moment"
            } catch (e: IOException) {
                error = "No connection to the server. Check your internet."
            } catch (e: Exception) {
                error = "Could not sign in"
            } finally {
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TricolorStrip()
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                "Welcome",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                "Sign in to continue to Aarogya",
                color = TextSecondary,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(24.dp))

            Row(
                Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(14.dp))
                    .padding(4.dp)
            ) {
                RoleTab("Doctor", role == "DOCTOR", Navy, Modifier.weight(1f)) {
                    role = "DOCTOR"; error = null
                }
                RoleTab("ASHA Worker", role == "ASHA", IndiaGreen, Modifier.weight(1f)) {
                    role = "ASHA"; error = null
                }
            }

            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = identifier,
                onValueChange = { identifier = it },
                label = { Text(if (role == "DOCTOR") "Email" else "Phone") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            if (error != null) {
                Spacer(Modifier.height(12.dp))
                Text(error!!, color = StatusRed, style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { submit() },
                enabled = !loading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (role == "DOCTOR") Navy else IndiaGreen,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (loading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.height(22.dp))
                } else {
                    Text("Sign In", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(
                "Doctors and ASHA workers register on the government portal.",
                color = TextSecondary,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun RoleTab(
    label: String,
    active: Boolean,
    tint: Color,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .background(if (active) tint else Color.Transparent)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (active) Color.White else TextSecondary,
            fontWeight = FontWeight.SemiBold
        )
    }
}
