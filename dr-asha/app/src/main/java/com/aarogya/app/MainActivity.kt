package com.aarogya.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.aarogya.app.data.SessionStore
import com.aarogya.app.screens.AshaHomeScreen
import com.aarogya.app.screens.DoctorHomeScreen
import com.aarogya.app.screens.LoginScreen
import com.aarogya.app.screens.PrescriptionScreen
import com.aarogya.app.screens.SplashScreen
import com.aarogya.app.screens.AshaHistoryScreen
import com.aarogya.app.screens.DoctorHistoryScreen
import com.aarogya.app.screens.VideoCallScreen
import com.aarogya.app.ui.theme.AarogyaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SessionStore.load(this)
        setContent {
            AarogyaTheme {
                AarogyaApp()
            }
        }
    }
}

@Composable
fun AarogyaApp() {
    val nav = rememberNavController()
    val context = LocalContext.current

    fun logout() {
        SessionStore.clear(context)
        nav.navigate("login") { popUpTo(0) }
    }

    NavHost(navController = nav, startDestination = "splash") {
        composable("splash") {
            SplashScreen(onFinish = {
                val dest = when (SessionStore.role) {
                    "DOCTOR" -> "doctor"
                    "ASHA" -> "asha"
                    else -> "login"
                }
                nav.navigate(dest) { popUpTo("splash") { inclusive = true } }
            })
        }
        composable("login") {
            LoginScreen(onLoggedIn = { role ->
                nav.navigate(if (role == "DOCTOR") "doctor" else "asha") {
                    popUpTo("login") { inclusive = true }
                }
            })
        }
        composable("doctor") {
            DoctorHomeScreen(
                onOpenConsult = { id -> nav.navigate("consult/$id") },
                onHistory = { nav.navigate("doctorHistory") },
                onLogout = { logout() }
            )
        }
        composable("doctorHistory") {
            DoctorHistoryScreen(onBack = { nav.popBackStack() })
        }
        composable("ashaHistory") {
            AshaHistoryScreen(onBack = { nav.popBackStack() })
        }
        composable("consult/{sessionId}") { entry ->
            val id = entry.arguments?.getString("sessionId") ?: ""
            VideoCallScreen(
                sessionId = id,
                onEnd = { nav.navigate("prescribe/$id") { popUpTo("doctor") } }
            )
        }
        composable("prescribe/{sessionId}") { entry ->
            val id = entry.arguments?.getString("sessionId") ?: ""
            PrescriptionScreen(
                sessionId = id,
                onDone = { nav.navigate("doctor") { popUpTo("doctor") { inclusive = true } } }
            )
        }
        composable("asha") {
            AshaHomeScreen(
                onHistory = { nav.navigate("ashaHistory") },
                onLogout = { logout() }
            )
        }
    }
}
