using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthcareBooking.Api.Service;
using HealthcareBooking.Api.Entities;

namespace HealthcareBooking.Api.Controllers;

[ApiController]
[Route("v1/api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AvailableAppointmentService _availableAppointmentService;

    public AppointmentsController(
        AvailableAppointmentService availableAppointmentService)
    {
        _availableAppointmentService = availableAppointmentService;
    }

    // GET /v1/api/appointments/available?caregiverId=5
    // Allows patients to fetch available appointment slots
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable(
        [FromQuery] int caregiverId)
    {
        if (caregiverId <= 0)
            return BadRequest("caregiverId is required");

        var slots = await _availableAppointmentService
            .GetAvailableSlotsAsync(caregiverId);

        return Ok(slots);
    }
}
