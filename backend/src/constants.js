export const Role = {
  ASHA: "ASHA",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
};

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
};

export const AshaDuty = {
  EMERGENCY: "EMERGENCY",
  DELIVERY: "DELIVERY",
  BOTH: "BOTH",
};

export const NotificationType = {
  MEDICINE_DELIVERY: "MEDICINE_DELIVERY",
  NEW_ASSIGNMENT: "NEW_ASSIGNMENT",
  CONSULT_COMPLETE: "CONSULT_COMPLETE",
  FOLLOW_UP: "FOLLOW_UP",
  EMERGENCY_ALERT: "EMERGENCY_ALERT",
  GENERAL: "GENERAL",
};

export const NotificationStatus = {
  UNREAD: "UNREAD",
  READ: "READ",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  COMPLETED: "COMPLETED",
};

export const DoctorStatus = {
  OFFLINE: "OFFLINE",
  ONLINE: "ONLINE",
  IN_CONSULT: "IN_CONSULT",
};

export const NotificationPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const ConsultationStatus = {
  QUEUED: "QUEUED",
  IN_CONSULT: "IN_CONSULT",
  PRESCRIBED: "PRESCRIBED",
  DISPENSED: "DISPENSED",
  CANCELLED: "CANCELLED",
};

export const Urgency = {
  NORMAL: "NORMAL",
  URGENT: "URGENT",
  EMERGENCY: "EMERGENCY",
};

export const PrescriptionStatus = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
};

export const EmergencyCategory = {
  CARDIAC: "CARDIAC",
  BREATHING: "BREATHING",
  STROKE: "STROKE",
  UNCONSCIOUS: "UNCONSCIOUS",
  SEIZURE: "SEIZURE",
  POISONING: "POISONING",
  BLEEDING: "BLEEDING",
  CHILDBIRTH: "CHILDBIRTH",
  BURN: "BURN",
  INJURY: "INJURY",
  OTHER: "OTHER",
};

export const EmergencySeverity = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MODERATE: "MODERATE",
};

export const EmergencyStatus = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
};
