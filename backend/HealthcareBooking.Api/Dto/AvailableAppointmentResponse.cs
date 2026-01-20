namespace HealthcareBooking.Api.Dto;

public record AvailableAppointmentResponse(
    CaregiverSummaryDto Caregiver,
    DateTime Start,
    DateTime End
);
