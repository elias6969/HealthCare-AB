namespace HealthcareBooking.Api.Entities;

public class Availability
{
    public int Id { get; set; }

    // Caregiver
    public int CaregiverId { get; set; }
    public User Caregiver { get; set; } = null!;

    // Availability window
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
