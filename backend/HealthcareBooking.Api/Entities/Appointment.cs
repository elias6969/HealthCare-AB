namespace HealthcareBooking.Api.Entities;

public class Appointment
{
    public int Id { get; set; }

    // Patient
    public int PatientId { get; set; }
    public User Patient { get; set; } = null!;

    // Caregiver
    public int CaregiverId { get; set; }
    public User Caregiver { get; set; } = null!;

    // Scheduling
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    // Status
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum AppointmentStatus
{
    Booked = 0,
    Cancelled = 1
}
