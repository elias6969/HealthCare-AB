using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareBooking.Api.Service;

public class AvailabilityService
{
    private readonly AppDbContext _context;

    public AvailabilityService(AppDbContext context) { _context = context; }

    public async Task<Availability>
    CreateAvailabilityAsync(User caregiver, DateTime start, DateTime end)
    {
        // Role check
        if (caregiver.Role != UserRole.Caregiver)
            throw new InvalidOperationException(
                "Only caregivers can create availability.");

        // Time validation
        if (start >= end)
            throw new InvalidOperationException(
                "Start time must be before end time.");

        var availability =
            new Availability
            {
                CaregiverId = caregiver.Id,
                Start =
                                   DateTime.SpecifyKind(start, DateTimeKind.Utc),
                End = DateTime.SpecifyKind(end, DateTimeKind.Utc)
            };

        _context.Availabilities.Add(availability);
        await _context.SaveChangesAsync();

        return availability;
    }
}
