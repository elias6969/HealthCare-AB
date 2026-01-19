namespace HealthcareBooking.Api.Entities;

// User entity
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> PatientAppointments { get; set; } = new List<Appointment>();
    public ICollection<Appointment> CaregiverAppointments { get; set; } = new List<Appointment>();
    public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
}

public enum UserRole { Patient = 0, Caregiver = 1 }
