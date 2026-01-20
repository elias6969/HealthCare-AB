import { http } from "./http";

export interface Availability {
  id: number;
  caregiverId: number;
  start: string; // ISO string
  end: string; // ISO string
  createdAt?: string;
}

export interface CreateAvailabilityRequest {
  start: string; // ISO string
  end: string; // ISO string
}

export async function createAvailability(dto: CreateAvailabilityRequest) {
  const res = await http.post<Availability>("/availability", dto);
  return res.data;
}

export async function listMyAvailability() {
  const res = await http.get<Availability[]>("/availability/me");
  return res.data;
}


