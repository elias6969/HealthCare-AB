using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using HealthcareBooking.Api.Dto;
using System.Security.Claims;

namespace HealthcareBooking.Api.Controllers;

[ApiController]
[Route("v1/api/availability")]
[Authorize]
public class AvailabilityController : ControllerBase
{
    private readonly AvailabilityService _availabilityService;

    public AvailabilityController(AvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    // POST /v1/api/availability
    // Creates an availability slot for the authenticated caregiver
    [HttpPost]
    public async Task<IActionResult>
    Create([FromBody] CreateAvailabilityDto dto)
    {
        var user = GetAuthenticatedUser();

        try
        {
            var availability = await _availabilityService.CreateAvailabilityAsync(
                user, dto.Start, dto.End);

            return Created(string.Empty, availability);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    // GET /v1/api/availability/me
    // Returns availability for the authenticated caregiver
    [HttpGet("me")]
    [Authorize(Roles = "Caregiver")]
    public async Task<IActionResult> GetMyAvailability()
    {
        var caregiverId =
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var availability =
            await _availabilityService.GetCaregiverAvailabilityAsync(caregiverId);

        return Ok(availability);
    }

    // Helpers
    private User GetAuthenticatedUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException();

        var role = Enum.Parse<UserRole>(roleClaim!);

        return new User { Id = userId, Role = role };
    }
}
