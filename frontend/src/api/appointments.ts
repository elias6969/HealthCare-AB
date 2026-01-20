import { http } from "./http";

export interface AvailableAppointmentSlot {
  caregiverId: number;
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

export async function listAvailableAppointmentSlots(caregiverId: number) {
  const res = await http.get<AvailableAppointmentSlot[]>("/appointments/available", {
    params: { caregiverId },
  });
  return res.data;
}

export async function bookAppointment(dto: BookAppointmentRequest) {
  const res = await http.post<Appointment>("/appointments", dto);
  return res.data;
}


