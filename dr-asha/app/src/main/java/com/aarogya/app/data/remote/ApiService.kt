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
}
