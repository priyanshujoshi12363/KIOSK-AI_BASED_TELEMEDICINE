package com.aarogya.app.data

import androidx.compose.ui.graphics.Color

enum class ConsultStatus { COMPLETED, UPCOMING, MISSED }

enum class DeliveryStatus { PENDING, DELIVERED }

enum class Priority { NORMAL, URGENT }

data class Consultation(
    val id: String,
    val patientName: String,
    val ageGender: String,
    val village: String,
    val dateTime: String,
    val complaint: String,
    val diagnosis: String,
    val status: ConsultStatus,
    val tint: Color
)

data class IncomingCall(
    val patientName: String,
    val ageGender: String,
    val village: String,
    val complaint: String,
    val waitingMinutes: Int,
    val tint: Color
)

data class Medicine(
    val name: String,
    val dosage: String,
    val quantity: Int
)

data class Delivery(
    val id: String,
    val villagerName: String,
    val ageGender: String,
    val village: String,
    val address: String,
    val phone: String,
    val prescribedBy: String,
    val medicines: List<Medicine>,
    val priority: Priority,
    val status: DeliveryStatus
)
