using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Dto;
using HealthcareBooking.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareBooking.Api.Service;

public class AvailableAppointmentService
{
    private readonly AppDbContext _context;

    public AvailableAppointmentService(AppDbContext context)
    {
        _context = context;
    }

    // Returns future appointment slots for a single caregiver,
    // enriched with caregiver display information.
    public async Task<IReadOnlyList<AvailableAppointmentResponse>>
        GetAvailableSlotsAsync(int caregiverId)
    {
        var now = DateTime.UtcNow;

        var caregiver = await _context.Users
            .Where(u => u.Id == caregiverId && u.Role == UserRole.Caregiver)
            .Select(u => new CaregiverSummaryDto(
                u.Id,
                u.FirstName,
                u.LastName))
            .SingleOrDefaultAsync();

        if (caregiver == null)
            return Array.Empty<AvailableAppointmentResponse>();

        var availabilities = await _context.Availabilities
            .Where(a => a.CaregiverId == caregiverId && a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        var appointments = await _context.Appointments
            .Where(a =>
                a.CaregiverId == caregiverId &&
                a.Status == AppointmentStatus.Booked &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        return BuildSlots(caregiver, availabilities, appointments, now);
    }

    // Returns future appointment slots across ALL caregivers
    public async Task<IReadOnlyList<AvailableAppointmentResponse>>
        GetAllAvailableSlotsAsync()
    {
        var now = DateTime.UtcNow;

        // Load all caregivers with display info
        var caregivers = await _context.Users
            .Where(u => u.Role == UserRole.Caregiver)
            .Select(u => new CaregiverSummaryDto(
                u.Id,
                u.FirstName,
                u.LastName))
            .ToListAsync();

        if (caregivers.Count == 0)
            return Array.Empty<AvailableAppointmentResponse>();

        var caregiverIds = caregivers.Select(c => c.Id).ToList();

        // Load all future availabilities
        var availabilities = await _context.Availabilities
            .Where(a =>
                caregiverIds.Contains(a.CaregiverId) &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        // Load all future booked appointments
        var appointments = await _context.Appointments
            .Where(a =>
                caregiverIds.Contains(a.CaregiverId) &&
                a.Status == AppointmentStatus.Booked &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        var results = new List<AvailableAppointmentResponse>();

        foreach (var caregiver in caregivers)
        {
            var caregiverAvailabilities = availabilities
                .Where(a => a.CaregiverId == caregiver.Id)
                .ToList();

            var caregiverAppointments = appointments
                .Where(a => a.CaregiverId == caregiver.Id)
                .ToList();

            results.AddRange(
                BuildSlots(
                    caregiver,
                    caregiverAvailabilities,
                    caregiverAppointments,
                    now));
        }

        return results;
    }

    // Shared slot-splitting logic (single source of truth)
    private static List<AvailableAppointmentResponse> BuildSlots(
        CaregiverSummaryDto caregiver,
        List<Availability> availabilities,
        List<Appointment> appointments,
        DateTime now)
    {
        var slots = new List<AvailableAppointmentResponse>();

        foreach (var availability in availabilities)
        {
            var slotStart = availability.Start < now
                ? now
                : availability.Start;

            var slotEnd = availability.End;

            var overlappingAppointments = appointments
                .Where(a =>
                    a.Start < slotEnd &&
                    a.End > slotStart)
                .ToList();

            foreach (var appointment in overlappingAppointments)
            {
                TryAddSlot(slots, caregiver, slotStart, appointment.Start);

                slotStart = appointment.End < now
                    ? now
                    : appointment.End;
            }

            TryAddSlot(slots, caregiver, slotStart, slotEnd);
        }

        return slots;
    }

    private static void TryAddSlot(
        List<AvailableAppointmentResponse> slots,
        CaregiverSummaryDto caregiver,
        DateTime start,
        DateTime end)
    {
        if (end <= start)
            return;

        if (end - start < TimeSpan.FromSeconds(1))
            return;

        slots.Add(new AvailableAppointmentResponse(
            caregiver,
            start,
            end
        ));
    }
}
