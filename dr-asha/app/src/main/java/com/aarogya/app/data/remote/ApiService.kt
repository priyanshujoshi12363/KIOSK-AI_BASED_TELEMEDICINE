package com.aarogya.app.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("api/doctor/auth/login")
    suspend fun doctorLogin(@Body body: DoctorLoginRequest): DoctorLoginResponse

    @POST("api/asha/auth/login")
    suspend fun ashaLogin(@Body body: AshaLoginRequest): AshaLoginResponse

    @GET("api/session/queue")
    suspend fun getQueue(): QueueResponse

    @POST("api/session/{id}/claim")
    suspend fun claimSession(@Path("id") id: String): SessionResponse

    @GET("api/prescription/catalog")
    suspend fun catalog(@Query("q") q: String): CatalogResponse

    @POST("api/prescription")
    suspend fun createPrescription(@Body body: CreatePrescriptionRequest): CreatePrescriptionResponse

    @GET("api/asha/deliveries")
    suspend fun getDeliveries(): DeliveriesResponse

    @POST("api/asha/deliveries/{id}/delivered")
    suspend fun markDelivered(@Path("id") id: String): DeliveryResponse

    @GET("api/prescription/draft/{sessionId}")
    suspend fun getDraft(@Path("sessionId") sessionId: String): DraftResponse

    @POST("api/prescription/{id}/confirm")
    suspend fun confirmPrescription(
        @Path("id") id: String,
        @Body body: ConfirmRequest
    ): ConfirmResponse

    @GET("api/emergency")
    suspend fun getEmergencies(): EmergenciesResponse

    @POST("api/emergency/{id}/acknowledge")
    suspend fun acknowledgeEmergency(@Path("id") id: String): EmergencyResponse

    @POST("api/emergency/{id}/resolve")
    suspend fun resolveEmergency(@Path("id") id: String): EmergencyResponse
}
