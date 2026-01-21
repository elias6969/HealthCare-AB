# HealthcareBooking API (Backend)

ASP.NET Core Web API for the **Healthcare AB appointment booking system**.
This backend provides secure authentication, appointment booking, caregiver scheduling, and role-based access control.

The API is designed with a clear separation of concerns and follows professional SDLC and DevOps practices.

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
  Handle HTTP requests, authentication, authorization, and input validation.

* **Services**
  Contain business logic (booking rules, availability checks, role enforcement).

* **Data Layer**
  Entity Framework Core with PostgreSQL for persistence.

This separation keeps controllers thin and business rules testable.

---

## Authentication & Authorization

* JWT-based authentication
* Tokens include:

  * User ID
  * Email
  * Role (Patient / Caregiver)
* Role-based authorization using `[Authorize(Roles = "...")]`

### Roles

* **Patient**

  * Book and reschedule appointments
* **Caregiver**

  * Manage availability
  * View and reschedule own appointments

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

All protected endpoints require:

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
* Relationships are enforced via EF Core
* All date/time values are stored in UTC

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

The project uses **GitHub Actions** for CI.

The pipeline:

* Restores dependencies
* Builds the solution
* Runs unit tests
* Collects test coverage

CI configuration:

```
.github/workflows/ci.yml
```

---

## Running the Backend Locally

### Prerequisites

* .NET 8 SDK
* PostgreSQL
* Connection string configured in `appsettings.json`

### Run

```bash
dotnet run --project HealthcareBooking.Api
```

The API will start with HTTPS enabled and Swagger available in development mode.

---

## Configuration

JWT and database settings are configured via `appsettings.json`:

* JWT issuer, audience, signing key
* Token expiration time
* Database connection string

---

## SDLC & Quality Notes

* Development followed a sprint-based SDLC process
* Core risks (security, double booking, data integrity) were addressed early
* Automated testing and CI were integrated before feature completion
* Emphasis was placed on correctness, security, and maintainability
