namespace HealthcareBooking.Api.Service;

using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using Microsoft.EntityFrameworkCore;

public class AppointmentService
{
    private readonly AppDbContext _context;

    public AppointmentService(AppDbContext context) { _context = context; }

    public async Task<Appointment> BookAsync(User patient, int caregiverId,
                                             DateTime start, DateTime end)
    {
        if (patient.Role != UserRole.Patient)
            throw new InvalidOperationException(
                "Only patients can book appointments.");

        if (start >= end)
            throw new InvalidOperationException("Invalid appointment time range.");

        start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        var availabilityExists = await _context.Availabilities.AnyAsync(
            a => a.CaregiverId == caregiverId && a.Start <= start && a.End >= end);

        if (!availabilityExists)
            throw new InvalidOperationException(
                "Selected time is not within caregiver availability.");

        var overlaps = await _context.Appointments.AnyAsync(
            a => a.CaregiverId == caregiverId &&
                 a.Status == AppointmentStatus.Booked && a.Start < end &&
                 a.End > start);

        if (overlaps)
            throw new InvalidOperationException("Time slot is already booked.");

        var appointment =
            new Appointment
            {
                PatientId = patient.Id,
                CaregiverId = caregiverId,
                Start = start,
                End = end
            };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return appointment;
    }

    public async Task CancelAsync(User patient, int appointmentId)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(
            a => a.Id == appointmentId);

        if (appointment == null)
            throw new KeyNotFoundException("Appointment not found.");

        if (appointment.PatientId != patient.Id)
            throw new UnauthorizedAccessException(
                "You cannot cancel someone else's appointment.");

        if (appointment.Status == AppointmentStatus.Cancelled)
            return; // idempotent

        appointment.Status = AppointmentStatus.Cancelled;
        await _context.SaveChangesAsync();
    }

    public async Task<Appointment> RescheduleAsync(User patient,
                                                   int appointmentId,
                                                   DateTime newStart,
                                                   DateTime newEnd)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(
            a => a.Id == appointmentId && a.Status == AppointmentStatus.Booked);

        if (appointment == null)
            throw new KeyNotFoundException("Appointment not found.");

        if (appointment.PatientId != patient.Id)
            throw new UnauthorizedAccessException();

        newStart = DateTime.SpecifyKind(newStart, DateTimeKind.Utc);
        newEnd = DateTime.SpecifyKind(newEnd, DateTimeKind.Utc);

        // Double booking check (exclude current appointment)
        var overlap = await _context.Appointments.AnyAsync(
            a => a.CaregiverId == appointment.CaregiverId &&
                 a.Id != appointment.Id && a.Status == AppointmentStatus.Booked &&
                 a.Start < newEnd && a.End > newStart);

        if (overlap)
            throw new InvalidOperationException("New time slot is already booked.");

        appointment.Start = newStart;
        appointment.End = newEnd;

        await _context.SaveChangesAsync();
        return appointment;
    }

    public async Task<IReadOnlyList<Appointment>>
    GetCaregiverAppointmentsAsync(int caregiverId)
    {
        var now = DateTime.UtcNow;

        return await _context.Appointments
            .Where(a => a.CaregiverId == caregiverId &&
                        a.Status == AppointmentStatus.Booked && a.End > now)
            .OrderBy(a => a.Start)
            .ToListAsync();
    }

    public async Task<Appointment> RescheduleByCaregiverAsync(int caregiverId,
                                                              int appointmentId,
                                                              DateTime newStart,
                                                              DateTime newEnd)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(
            a => a.Id == appointmentId && a.Status == AppointmentStatus.Booked);

        if (appointment == null)
            throw new KeyNotFoundException("Appointment not found.");

        if (appointment.CaregiverId != caregiverId)
            throw new UnauthorizedAccessException();

        newStart = DateTime.SpecifyKind(newStart, DateTimeKind.Utc);
        newEnd = DateTime.SpecifyKind(newEnd, DateTimeKind.Utc);

        if (newStart >= newEnd)
            throw new InvalidOperationException("Invalid time range.");

        // Ensure still inside caregiver availability
        var availabilityExists = await _context.Availabilities.AnyAsync(
            a => a.CaregiverId == caregiverId && a.Start <= newStart &&
                 a.End >= newEnd);

        if (!availabilityExists)
            throw new InvalidOperationException("New time is outside availability.");

        // Prevent overlap with other appointments
        var overlap = await _context.Appointments.AnyAsync(
            a => a.CaregiverId == caregiverId && a.Id != appointment.Id &&
                 a.Status == AppointmentStatus.Booked && a.Start < newEnd &&
                 a.End > newStart);

        if (overlap)
            throw new InvalidOperationException("Time slot already booked.");

        appointment.Start = newStart;
        appointment.End = newEnd;

        await _context.SaveChangesAsync();
        return appointment;
    }
}
