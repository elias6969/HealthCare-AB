using HealthcareBooking.Api.Entities;

namespace HealthcareBooking.Api.Dto;

public record AppointmentResponse(
    int Id,
    int CaregiverId,
    int PatientId,
    DateTime Start,
    DateTime End,
    AppointmentStatus Status
);
