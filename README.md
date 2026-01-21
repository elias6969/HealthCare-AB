# HealthCare AB – Appointment Booking System

A full-stack web application for managing healthcare appointment bookings, built as part of a software development lifecycle (SDLC) project for **Healthcare AB**.

The system allows **patients** to book appointments online and **caregivers** to manage availability and schedules, with a strong focus on security, testing, and professional development practices.

---

## Project Overview

This project consists of two main parts:

* **Backend** – ASP.NET Core Web API
* **Frontend** – React + TypeScript (Vite)

The application supports:

* Secure authentication with JWT
* Role-based access (Patient / Caregiver)
* Appointment booking and rescheduling
* Caregiver availability management
* Automated testing and CI

The project follows a structured SDLC process (Planning → Analysis → Design → Development).

---

## Tech Stack

### Backend

* ASP.NET Core (.NET 8)
* Entity Framework Core
* PostgreSQL
* JWT Authentication
* xUnit (unit testing)
* GitHub Actions (CI)

### Frontend

* React
* TypeScript
* Vite
* React Router
* Axios

---

## Repository Structure

```
HealthCare-AB/
│
├── backend/
│   ├── HealthcareBooking.Api/      # ASP.NET Core Web API
│   ├── HealthcareBooking.Tests/    # Backend unit tests
│   └── HealthcareBooking.sln
│
├── frontend/
│   ├── src/                        # React application source
│   ├── public/
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI pipeline (build + test)
│
└── README.md                       # This file
```

---

## Core Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* Role-based access control (Patient / Caregiver)

### Patient Features

* View available appointment slots
* Book appointments
* Reschedule appointments

### Caregiver Features

* Create and manage availability
* View upcoming appointments (dashboard)
* Reschedule appointments

### Quality & Process

* Service-level unit tests
* Continuous Integration (CI) pipeline
* Test coverage collection
* Clear separation of concerns (Controllers / Services / Data)

---

## Running the Project

### Prerequisites

* Node.js + npm
* .NET 8 SDK
* PostgreSQL
* A local or cloud database configured for the backend

### High-level steps

1. Start the **backend API**
2. Start the **frontend application**
3. Access the app via the frontend URL

Detailed setup instructions are available in:

* `backend/README.md`
* `frontend/README.md`

---

## SDLC & Project Scope

This project was developed following a professional SDLC approach:

* **Phase 1 – Planning**: scope definition, sprint planning, risk analysis
* **Phase 2 – Analysis**: system requirements (functional & non-functional)
* **Phase 3 – Design**: architecture, database design, CI strategy
* **Phase 4 – Development**: implementation, testing, CI, documentation

Sprint-based development was used, with automated testing and CI integrated early in the process.
