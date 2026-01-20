import { http } from "./http";

export interface CaregiverIdentity {
  id: number;
  firstName: string;
  lastName: string;
}

export interface AvailableAppointmentSlot {
  caregiver: CaregiverIdentity;
  start: string; // ISO UTC string from backend
  end: string; // ISO UTC string from backend
}

export interface BookAppointmentRequest {
  caregiverId: number;
  start: string;
  end: string;
}

export interface Appointment {
  id: number;
  caregiverId: number;
  patientId: number;
  start: string;
  end: string;
  status: number;
}

export async function listAvailableAppointmentSlots(caregiverId?: number) {
  // FYI: backend supports both:
  // - all caregivers: GET /appointments/available
  // - specific caregiver: GET /appointments/available?caregiverId=123
  // So we keep caregiverId optional and only send it when we actually have one.
  const res = await http.get<AvailableAppointmentSlot[]>("/appointments/available", {
    params: caregiverId ? { caregiverId } : undefined,
  });
  return res.data;
}

export async function bookAppointment(dto: BookAppointmentRequest) {
  // This is the real booking call. Backend owns validation (conflicts, time windows, etc).
  const res = await http.post<Appointment>("/appointments", dto);
  return res.data;
}

export interface RescheduleAppointmentRequest {
  newStart: string;
  newEnd: string;
}

export async function rescheduleAppointment(appointmentId: number, dto: RescheduleAppointmentRequest) {
  // Optional feature: reschedule existing appointment to a new window.
  const res = await http.patch<Appointment>(`/appointments/${appointmentId}/reschedule`, dto);
  return res.data;
}


