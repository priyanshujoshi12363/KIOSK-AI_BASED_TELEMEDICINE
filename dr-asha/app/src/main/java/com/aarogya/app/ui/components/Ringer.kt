package com.aarogya.app.ui.components

import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.media.Ringtone
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object Ringer {
    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    fun start(context: Context, urgent: Boolean) {
        stop()
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ringtone = RingtoneManager.getRingtone(context.applicationContext, uri)?.apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                }
                play()
            }
        } catch (e: Exception) {
            ringtone = null
        }

        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                manager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            val pattern = if (urgent) {
                longArrayOf(0, 500, 200, 500, 200, 500, 600)
            } else {
                longArrayOf(0, 700, 900)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            vibrator = null
        }
    }

    fun stop() {
        try {
            ringtone?.stop()
        } catch (e: Exception) {
            // ignore
        }
        ringtone = null

        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            // ignore
        }
        vibrator = null
    }
}
