package com.aarogya.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.aarogya.app.screens.AshaHomeScreen
import com.aarogya.app.screens.DoctorHomeScreen
import com.aarogya.app.screens.LoginScreen
import com.aarogya.app.screens.SplashScreen
import com.aarogya.app.screens.VideoCallScreen
import com.aarogya.app.ui.theme.AarogyaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

    NavHost(navController = nav, startDestination = "splash") {
        composable("splash") {
            SplashScreen(onFinish = {
                nav.navigate("login") {
                    popUpTo("splash") { inclusive = true }
                }
            })
        }
        composable("login") {
            LoginScreen(
                onDoctor = { nav.navigate("doctor") },
                onAsha = { nav.navigate("asha") }
            )
        }
        composable("doctor") {
            DoctorHomeScreen(
                onStartCall = { nav.navigate("call") },
                onLogout = {
                    nav.navigate("login") { popUpTo("login") { inclusive = true } }
                }
            )
        }
        composable("call") {
            VideoCallScreen(onEnd = { nav.popBackStack() })
        }
        composable("asha") {
            AshaHomeScreen(
                onLogout = {
                    nav.navigate("login") { popUpTo("login") { inclusive = true } }
                }
            )
        }
    }
}
