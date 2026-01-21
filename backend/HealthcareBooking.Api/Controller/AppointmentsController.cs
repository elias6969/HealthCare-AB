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

    // ------------------------------------------------------------------
    // PATIENT ENDPOINTS
    // ------------------------------------------------------------------

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

        var allSlots =
            await _availableAppointmentService.GetAllAvailableSlotsAsync();

        return Ok(allSlots);
    }

    // POST /v1/api/appointments
    // Books a new appointment for the authenticated patient
    [HttpPost]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> Book([FromBody] CreateAppointmentDto dto)
    {
        var userId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value
        );

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

            return Created(
                string.Empty,
                new AppointmentResponse(
                    appointment.Id,
                    appointment.CaregiverId,
                    appointment.PatientId,
                    appointment.Start,
                    appointment.End,
                    appointment.Status));
        }
        catch (InvalidOperationException ex)
        {
            // Covers invalid time range, double booking, or missing availability
            return Conflict(new { error = ex.Message });
        }
    }

    // PATCH /v1/api/appointments/{id}/reschedule
    // Allows a patient to reschedule their own appointment
    [HttpPatch("{id:int}/reschedule")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult>
    Reschedule(int id, [FromBody] RescheduleAppointmentDto dto)
    {
        var userId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value
        );

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

    // ------------------------------------------------------------------
    // CAREGIVER ENDPOINTS
    // ------------------------------------------------------------------

    // GET /v1/api/appointments/caregiver/me
    // Returns upcoming appointments for the authenticated caregiver
    // Used as the caregiver dashboard endpoint
    [HttpGet("caregiver/me")]
    [Authorize(Roles = "Caregiver")]
    public async Task<IActionResult> GetMyCaregiverAppointments()
    {
        var caregiverId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value
        );

        var appointments =
            await _appointmentService.GetCaregiverAppointmentsAsync(caregiverId);

        return Ok(appointments);
    }

    // PATCH /v1/api/appointments/{id}/caregiver/reschedule
    // Allows a caregiver to reschedule an appointment they own
    [HttpPatch("{id:int}/caregiver/reschedule")]
    [Authorize(Roles = "Caregiver")]
    public async Task<IActionResult>
    CaregiverReschedule(int id, [FromBody] RescheduleAppointmentDto dto)
    {
        var caregiverId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value
        );

        try
        {
            var updated =
                await _appointmentService.RescheduleByCaregiverAsync(
                    caregiverId,
                    id,
                    dto.NewStart,
                    dto.NewEnd);

            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
