package com.aarogya.app.data

import androidx.compose.ui.graphics.Color

object MockData {

    const val doctorName = "Dr. Anil Menon"
    const val doctorSpecialty = "General Medicine · Kerala Medical Council"
    const val ashaName = "Lakshmi Nair"
    const val ashaVillage = "Kollam"

    val incomingCall = IncomingCall(
        patientName = "Meena Devi",
        ageGender = "42 · Female",
        village = "Kollam",
        complaint = "Fever and body ache for 3 days",
        waitingMinutes = 2,
        tint = Color(0xFF6C5CE7)
    )

    val consultations = listOf(
        Consultation(
            id = "C-1042",
            patientName = "Ravi Kumar",
            ageGender = "39 · Male",
            village = "Kollam",
            dateTime = "Today · 10:15 AM",
            complaint = "Cough and cold",
            diagnosis = "Upper respiratory infection",
            status = ConsultStatus.COMPLETED,
            tint = Color(0xFF00A8A8)
        ),
        Consultation(
            id = "C-1041",
            patientName = "Suresh Pillai",
            ageGender = "55 · Male",
            village = "Karunagappally",
            dateTime = "Today · 09:40 AM",
            complaint = "High blood pressure follow-up",
            diagnosis = "Hypertension, stable",
            status = ConsultStatus.COMPLETED,
            tint = Color(0xFFE08A00)
        ),
        Consultation(
            id = "C-1040",
            patientName = "Anjali Menon",
            ageGender = "28 · Female",
            village = "Kollam",
            dateTime = "Yesterday · 04:20 PM",
            complaint = "Skin rash",
            diagnosis = "Allergic dermatitis",
            status = ConsultStatus.COMPLETED,
            tint = Color(0xFFD23B7D)
        ),
        Consultation(
            id = "C-1039",
            patientName = "Thomas Jacob",
            ageGender = "61 · Male",
            village = "Punalur",
            dateTime = "Yesterday · 02:05 PM",
            complaint = "Joint pain",
            diagnosis = "Osteoarthritis",
            status = ConsultStatus.MISSED,
            tint = Color(0xFF6C5CE7)
        ),
        Consultation(
            id = "C-1038",
            patientName = "Fathima Beevi",
            ageGender = "34 · Female",
            village = "Kollam",
            dateTime = "12 Aug · 11:30 AM",
            complaint = "Stomach pain",
            diagnosis = "Gastritis",
            status = ConsultStatus.COMPLETED,
            tint = Color(0xFF00A8A8)
        )
    )

    val deliveries = listOf(
        Delivery(
            id = "D-2051",
            villagerName = "Meena Devi",
            ageGender = "42 · Female",
            village = "Kollam",
            address = "House 12, Main Road, Kollam",
            phone = "+91 98765 00011",
            prescribedBy = "Dr. Anil Menon",
            medicines = listOf(
                Medicine("Paracetamol 500mg", "1 tablet, 3 times a day", 15),
                Medicine("Cetirizine 10mg", "1 tablet at night", 5)
            ),
            priority = Priority.URGENT,
            status = DeliveryStatus.PENDING
        ),
        Delivery(
            id = "D-2050",
            villagerName = "Ravi Kumar",
            ageGender = "39 · Male",
            village = "Kollam",
            address = "House 4, Temple Street, Kollam",
            phone = "+91 98765 00012",
            prescribedBy = "Dr. Anil Menon",
            medicines = listOf(
                Medicine("Amoxicillin 500mg", "1 capsule, twice a day", 10),
                Medicine("Cough Syrup", "10ml, 3 times a day", 1)
            ),
            priority = Priority.NORMAL,
            status = DeliveryStatus.PENDING
        ),
        Delivery(
            id = "D-2049",
            villagerName = "Anjali Menon",
            ageGender = "28 · Female",
            village = "Kollam",
            address = "House 9, Lake View, Kollam",
            phone = "+91 98765 00013",
            prescribedBy = "Dr. Anil Menon",
            medicines = listOf(
                Medicine("Calamine Lotion", "Apply twice a day", 1)
            ),
            priority = Priority.NORMAL,
            status = DeliveryStatus.DELIVERED
        ),
        Delivery(
            id = "D-2048",
            villagerName = "Fathima Beevi",
            ageGender = "34 · Female",
            village = "Kollam",
            address = "House 21, Market Road, Kollam",
            phone = "+91 98765 00014",
            prescribedBy = "Dr. Anil Menon",
            medicines = listOf(
                Medicine("Pantoprazole 40mg", "1 tablet before breakfast", 14),
                Medicine("ORS Sachets", "1 in water when needed", 6)
            ),
            priority = Priority.NORMAL,
            status = DeliveryStatus.DELIVERED
        )
    )
}
