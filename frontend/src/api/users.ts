import { http } from "./http";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function login(dto: LoginDto) {
  const res = await http.post("/users/login", dto);
  return res.data;
}

export async function registerPatient(dto: RegisterDto) {
  const res = await http.post("/users/register/patient", dto);
  return res.data;
}

export async function registerCaregiver(dto: RegisterDto) {
  const res = await http.post("/users/register/caregiver", dto);
  return res.data;
}

export async function deleteAccount(id: number) {
  return http.delete(`/users/${id}`);
}
