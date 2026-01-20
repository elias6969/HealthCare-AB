using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthcareBooking.Api.Service;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Dto;
using System.Security.Claims;

namespace HealthcareBooking.Api.Controllers;


[ApiController]
[Route("v1/api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AvailableAppointmentService _availableAppointmentService;
    private readonly AppointmentService _appointmentService;

    public AppointmentsController(
        AvailableAppointmentService availableAppointmentService,
        AppointmentService appointmentService)
    {
        _availableAppointmentService = availableAppointmentService;
        _appointmentService = appointmentService;
    }

    // GET /v1/api/appointments/available
    // GET /v1/api/appointments/available?caregiverId=9
    // Returns available appointment slots.
    // If caregiverId is provided, filters by caregiver.
    // Otherwise returns slots across all caregivers.
    [HttpGet("available")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetAvailable([FromQuery] int? caregiverId)
    {
        if (caregiverId.HasValue)
        {
            var slots = await _availableAppointmentService
                .GetAvailableSlotsAsync(caregiverId.Value);

            return Ok(slots);
        }

        var allSlots = await _availableAppointmentService
            .GetAllAvailableSlotsAsync();

        return Ok(allSlots);
    }

    // POST /v1/api/appointments
    [HttpPost]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> Book([FromBody] CreateAppointmentDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var patient = new User
        {
            Id = userId,
            Role = UserRole.Patient
        };

        try
        {
            var appointment = await _appointmentService.BookAsync(
                patient,
                dto.CaregiverId,
                dto.Start,
                dto.End);

            return Created(string.Empty, new AppointmentResponse(
                appointment.Id,
                appointment.CaregiverId,
                appointment.PatientId,
                appointment.Start,
                appointment.End,
                appointment.Status));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    // PATCH /v1/api/appointments/{id}/reschedule
    [HttpPatch("{id:int}/reschedule")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> Reschedule(
        int id,
        [FromBody] RescheduleAppointmentDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var patient = new User
        {
            Id = userId,
            Role = UserRole.Patient
        };

        try
        {
            var updated = await _appointmentService.RescheduleAsync(
                patient,
                id,
                dto.NewStart,
                dto.NewEnd);

            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
