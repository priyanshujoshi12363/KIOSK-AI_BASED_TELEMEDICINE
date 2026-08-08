package com.aarogya.app.data.remote

data class DoctorLoginRequest(val email: String, val password: String)
data class AshaLoginRequest(val phone: String, val password: String)

data class DoctorDto(
    val id: String?,
    val name: String?,
    val specialization: String?,
    val isVerified: Boolean?
)

data class AshaDto(
    val id: String?,
    val name: String?,
    val village: String?
)

data class DoctorLoginResponse(val token: String?, val doctor: DoctorDto?)
data class AshaLoginResponse(val token: String?, val asha: AshaDto?)

data class VillagerBrief(
    val name: String?,
    val village: String?,
    val phone: String?,
    val aadhaarLast4: String?,
    val gender: String?,
    val dateOfBirth: String?,
    val address: String?
)

data class SessionDto(
    val id: String?,
    val villager: VillagerBrief?,
    val village: String?,
    val symptoms: String?,
    val language: String?,
    val urgency: String?,
    val status: String?,
    val pickupAfter: String?
)

data class QueueResponse(val sessions: List<SessionDto> = emptyList())
data class SessionResponse(val session: SessionDto?)

data class MedicineDto(
    val name: String?,
    val form: String?,
    val defaultDosage: String?,
    val defaultQuantity: Int?
)

data class CatalogResponse(val medicines: List<MedicineDto> = emptyList())

data class RxItem(
    val name: String,
    val dosage: String?,
    val quantity: Int?,
    val instructions: String?
)

data class CreatePrescriptionRequest(
    val sessionId: String,
    val medicines: List<RxItem>,
    val advice: String?
)

data class CreatePrescriptionResponse(val notified: Boolean?)

data class DeliveryMedicine(
    val name: String?,
    val dosage: String?,
    val quantity: Int?,
    val instructions: String?
)

data class DeliveryDto(
    val id: String?,
    val villager: VillagerBrief?,
    val title: String?,
    val message: String?,
    val priority: String?,
    val status: String?,
    val deliveryAddress: String?,
    val medicines: List<DeliveryMedicine> = emptyList(),
    val createdAt: String?,
    val completedAt: String?
)

data class DeliveriesResponse(val deliveries: List<DeliveryDto> = emptyList(), val pending: Int = 0)
data class DeliveryResponse(val delivery: DeliveryDto?)

data class LocationDto(
    val lat: Double?,
    val lng: Double?,
    val accuracy: Double?,
    val label: String?,
    val source: String?
)

data class EmergencyDto(
    val id: String?,
    val villager: VillagerBrief?,
    val village: String?,
    val transcript: String?,
    val summary: String?,
    val language: String?,
    val category: String?,
    val categoryLabel: String?,
    val severity: String?,
    val patient: String?,
    val location: LocationDto?,
    val status: String?,
    val createdAt: String?,
    val acknowledgedAt: String?
)

data class EmergenciesResponse(val alerts: List<EmergencyDto> = emptyList(), val open: Int = 0)
data class EmergencyResponse(val alert: EmergencyDto?)
