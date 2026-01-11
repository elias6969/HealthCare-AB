using System.ComponentModel.DataAnnotations;

namespace HealthcareBooking.Api.Contracts;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = null!;
}
