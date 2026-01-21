# HealthCare-AB Frontend

React + TypeScript (Vite) frontend for **Healthcare AB**.

## What’s in this frontend

- **Auth**: login + register (patient/caregiver), JWT stored in `localStorage`
- **Protected app shell**: dashboard + account settings
- **Patient**: book appointment from available slots
- **Caregiver**: set availability, view upcoming appointments, reschedule appointments

## Requirements

- Node.js + npm
- A running backend API

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file (optional) to configure the backend URL:

```bash
VITE_API_URL=https://localhost:7017/v1/api
```

If `VITE_API_URL` is not set, the app falls back to **`https://localhost:7017/v1/api`**.

## Run

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Routes

- `/login`
- `/register`
- `/dashboard` (protected)
- `/delete-account` (protected)

## API usage

All requests go through Axios in `src/api/http.ts` and automatically attach:

- `Authorization: Bearer <token>` (when `localStorage.token` exists)

Endpoints used:

- **Users/Auth** (`src/api/users.ts`)
  - `POST /users/login`
  - `POST /users/register/patient`
  - `POST /users/register/caregiver`
  - `DELETE /users/{id}`
- **Appointments** (`src/api/appointments.ts`)
  - `GET /appointments/available`
  - `POST /appointments`
  - `GET /appointments/caregiver/me`
  - `PATCH /appointments/{id}/caregiver/reschedule`
- **Availability** (`src/api/availability.ts`)
  - `POST /availability`
  - `GET /availability/me`

## Project structure (high level)

- `src/api/` – API clients (Axios wrappers)
- `src/auth/` – auth context + helpers
- `src/pages/` – routed pages (Login/Register/Dashboard/DeleteAccount)
- `src/components/` – feature components + UI primitives
- `src/layout/` – main app layout (sidebar/topbar)
