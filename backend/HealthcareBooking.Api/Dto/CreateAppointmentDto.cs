namespace HealthcareBooking.Api.Dto;

public class CreateAppointmentDto
{
    public int CaregiverId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}
