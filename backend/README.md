# HealthcareBooking API (Backend)

ASP.NET Core Web API for the **Healthcare AB appointment booking system**.

This backend provides secure authentication, appointment booking, caregiver availability management, and role-based access control. The system is designed with a clear separation of concerns and follows professional SDLC and DevOps practices.

---

## Tech Stack

* **.NET 8 / ASP.NET Core**
* **Entity Framework Core**
* **PostgreSQL**
* **JWT Authentication**
* **xUnit** (unit testing)
* **GitHub Actions** (CI pipeline)

---

## Architecture Overview

The backend follows a layered architecture:

* **Controllers**
  Handle HTTP requests, authentication, authorization, and request validation.

* **Services**
  Contain all business logic, including booking rules, availability checks, and role enforcement.

* **Data Layer**
  Uses Entity Framework Core with PostgreSQL for persistence.

This structure keeps controllers thin and makes business logic easy to test and maintain.

---

## Authentication & Authorization

* JWT-based authentication
* Tokens contain:

  * User ID
  * Email
  * Role (Patient / Caregiver)
* Role-based authorization is enforced using `[Authorize(Roles = "...")]`

### Roles

* **Patient**

  * Book appointments
  * Reschedule own appointments

* **Caregiver**

  * Create and manage availability
  * View upcoming appointments
  * Reschedule own appointments

---

## API Endpoints (Overview)

### Authentication & Users

* `POST /v1/api/users/login`
* `POST /v1/api/users/register/patient`
* `POST /v1/api/users/register/caregiver`
* `DELETE /v1/api/users/{id}`

### Appointments

* `GET /v1/api/appointments/available`
* `POST /v1/api/appointments`
* `PATCH /v1/api/appointments/{id}/reschedule`
* `GET /v1/api/appointments/caregiver/me`
* `PATCH /v1/api/appointments/{id}/caregiver/reschedule`

### Availability

* `POST /v1/api/availability`
* `GET /v1/api/availability/me`

All protected endpoints require the following HTTP header:

```
Authorization: Bearer <JWT>
```

---

## Database

* **PostgreSQL**
* Core entities:

  * `User`
  * `Appointment`
  * `Availability`
* Relationships are enforced via Entity Framework Core
* All date and time values are stored in **UTC**

---

## Testing

* Unit tests focus on **service-layer business logic**
* Covered areas include:

  * User registration and authentication
  * Appointment booking and rescheduling rules
  * Availability validation
  * Double-booking prevention
* Tests are located in:

```
backend/HealthcareBooking.Tests
```

---

## Continuous Integration (CI)

The project uses **GitHub Actions** for continuous integration.

The CI pipeline:

* Restores dependencies
* Builds the solution
* Runs unit tests
* Collects test coverage

Configuration file:

```
.github/workflows/ci.yml
```

---

## Running the Backend Locally

### Prerequisites

* .NET 8 SDK
* PostgreSQL
* Database connection string configured in `appsettings.json`

### Run

The backend is typically started using the HTTPS launch profile:

```bash
dotnet run --launch-profile https
```

When running in development mode, Swagger UI is available for API exploration.

---

## Configuration

Application settings are configured via `appsettings.json`, including:

* JWT issuer, audience, and signing key
* Token expiration time
* Database connection string

---

## SDLC & Quality Notes

* Development followed a sprint-based SDLC approach
* Key risks (security, double booking, data integrity) were addressed early
* Automated testing and CI were integrated before feature completion
* Emphasis was placed on correctness, security, and maintainability
