using HealthcareBooking.Api.Data;
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

    // Returns future appointment slots for a caregiver.
    // Slots are calculated by subtracting booked appointments from availability.
    public async Task<IReadOnlyList<AvailableSlot>> GetAvailableSlotsAsync(int caregiverId)
    {
        // Capture the current time once to keep comparisons consistent
        var now = DateTime.UtcNow;

        // Load future availability windows for the caregiver
        var availabilities = await _context.Availabilities
            .Where(a =>
                a.CaregiverId == caregiverId &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        // Load future, booked appointments for the caregiver
        var appointments = await _context.Appointments
            .Where(a =>
                a.CaregiverId == caregiverId &&
                a.Status == AppointmentStatus.Booked &&
                a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();

        var availableSlots = new List<AvailableSlot>();

        foreach (var availability in availabilities)
        {
            // Ensure we never return a slot starting in the past
            var slotStart = availability.Start < now
                ? now
                : availability.Start;

            var slotEnd = availability.End;

            // Find appointments that overlap this availability window
            var overlappingAppointments = appointments
                .Where(a =>
                    a.Start < slotEnd &&
                    a.End > slotStart)
                .ToList();

            foreach (var appointment in overlappingAppointments)
            {
                // Add free time before the appointment, if any
                TryAddSlot(
                    availableSlots,
                    caregiverId,
                    slotStart,
                    appointment.Start);

                // Move the pointer past the appointment
                slotStart = appointment.End < now
                    ? now
                    : appointment.End;
            }

            // Add remaining free time after the last appointment
            TryAddSlot(
                availableSlots,
                caregiverId,
                slotStart,
                slotEnd);
        }

        return availableSlots;
    }

    // Adds a slot only if it represents a real, usable time range.
    // Prevents zero-length or microsecond slots caused by time precision.
    private static void TryAddSlot(
        List<AvailableSlot> slots,
        int caregiverId,
        DateTime start,
        DateTime end)
    {
        if (end <= start)
            return;

        // Ignore extremely short slots that are not meaningful for appointments
        if (end - start < TimeSpan.FromSeconds(1))
            return;

        slots.Add(new AvailableSlot
        {
            CaregiverId = caregiverId,
            Start = start,
            End = end
        });
    }
}
