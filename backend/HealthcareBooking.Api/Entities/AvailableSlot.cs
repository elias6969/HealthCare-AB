namespace HealthcareBooking.Api.Entities;

public class AvailableSlot
{
    public int CaregiverId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}
