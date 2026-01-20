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

    // Returns future appointment slots for a caregiver,
    // enriched with caregiver display information.
    public async Task<IReadOnlyList<AvailableAppointmentResponse>>
        GetAvailableSlotsAsync(int caregiverId)
    {
        var now = DateTime.UtcNow;

        // Load caregiver display info ONCE
        var caregiver = await _context.Users
            .Where(u => u.Id == caregiverId && u.Role == UserRole.Caregiver)
            .Select(u => new CaregiverSummaryDto(
                u.Id,
                u.FirstName,
                u.LastName))
            .SingleOrDefaultAsync();

        if (caregiver == null)
            return Array.Empty<AvailableAppointmentResponse>();

        // Load future availability windows
        var availabilities = await _context.Availabilities
            .Where(a =>
                a.CaregiverId == caregiverId &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        // Load future booked appointments
        var appointments = await _context.Appointments
            .Where(a =>
                a.CaregiverId == caregiverId &&
                a.Status == AppointmentStatus.Booked &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        var availableSlots = new List<AvailableAppointmentResponse>();

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
                TryAddSlot(
                    availableSlots,
                    caregiver,
                    slotStart,
                    appointment.Start);

                slotStart = appointment.End < now
                    ? now
                    : appointment.End;
            }

            TryAddSlot(
                availableSlots,
                caregiver,
                slotStart,
                slotEnd);
        }

        return availableSlots;
    }

    // Adds a slot only if it represents a real, usable time range.
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
