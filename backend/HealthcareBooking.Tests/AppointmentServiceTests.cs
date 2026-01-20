using System;
using System.Threading.Tasks;
using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HealthcareBooking.Api.Tests.Services;

public class AppointmentServiceTests
{
    // ---------- Helper: In-memory DbContext ----------
    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    // ---------- Book appointment: success ----------
    [Fact]
    public async Task BookAsync_Should_Create_Appointment_When_Slot_Is_Free()
    {
        using var context = CreateDbContext();
        var service = new AppointmentService(context);

        var caregiver = new User { Id = 1, Role = UserRole.Caregiver };
        var patient = new User { Id = 2, Role = UserRole.Patient };

        context.Availabilities.Add(new Availability
        {
            CaregiverId = caregiver.Id,
            Start = new DateTime(2026, 1, 26, 9, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 11, 0, 0, DateTimeKind.Utc)
        });

        await context.SaveChangesAsync();

        var appointment = await service.BookAsync(
            patient,
            caregiver.Id,
            new DateTime(2026, 1, 26, 9, 30, 0, DateTimeKind.Utc),
            new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc));

        Assert.NotNull(appointment);
        Assert.Equal(patient.Id, appointment.PatientId);
        Assert.Equal(caregiver.Id, appointment.CaregiverId);
        Assert.Equal(AppointmentStatus.Booked, appointment.Status);
    }

    // ---------- Book appointment: double booking ----------
    [Fact]
    public async Task BookAsync_Should_Throw_When_Double_Booking()
    {
        using var context = CreateDbContext();
        var service = new AppointmentService(context);

        context.Availabilities.Add(new Availability
        {
            CaregiverId = 1,
            Start = new DateTime(2026, 1, 26, 9, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 11, 0, 0, DateTimeKind.Utc)
        });

        context.Appointments.Add(new Appointment
        {
            CaregiverId = 1,
            PatientId = 2,
            Start = new DateTime(2026, 1, 26, 9, 30, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
            Status = AppointmentStatus.Booked
        });

        await context.SaveChangesAsync();

        var patient = new User { Id = 3, Role = UserRole.Patient };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.BookAsync(
                patient,
                1,
                new DateTime(2026, 1, 26, 9, 45, 0, DateTimeKind.Utc),
                new DateTime(2026, 1, 26, 10, 15, 0, DateTimeKind.Utc)));
    }

    // ---------- Reschedule: success ----------
    [Fact]
    public async Task RescheduleAsync_Should_Update_Time_When_Slot_Is_Free()
    {
        using var context = CreateDbContext();
        var service = new AppointmentService(context);

        context.Availabilities.Add(new Availability
        {
            CaregiverId = 1,
            Start = new DateTime(2026, 1, 26, 9, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 11, 0, 0, DateTimeKind.Utc)
        });

        var appointment = new Appointment
        {
            Id = 1,
            CaregiverId = 1,
            PatientId = 2,
            Start = new DateTime(2026, 1, 26, 9, 30, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
            Status = AppointmentStatus.Booked
        };

        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        var patient = new User { Id = 2, Role = UserRole.Patient };

        var updated = await service.RescheduleAsync(
            patient,
            appointment.Id,
            new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 1, 26, 10, 30, 0, DateTimeKind.Utc));

        Assert.Equal(
            new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
            updated.Start);

        Assert.Equal(
            new DateTime(2026, 1, 26, 10, 30, 0, DateTimeKind.Utc),
            updated.End);
    }

    // ---------- Reschedule: overlap ----------
    [Fact]
    public async Task RescheduleAsync_Should_Throw_When_New_Time_Overlaps()
    {
        using var context = CreateDbContext();
        var service = new AppointmentService(context);

        context.Availabilities.Add(new Availability
        {
            CaregiverId = 1,
            Start = new DateTime(2026, 1, 26, 9, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2026, 1, 26, 11, 0, 0, DateTimeKind.Utc)
        });

        context.Appointments.AddRange(
            new Appointment
            {
                Id = 1,
                CaregiverId = 1,
                PatientId = 2,
                Start = new DateTime(2026, 1, 26, 9, 30, 0, DateTimeKind.Utc),
                End = new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
                Status = AppointmentStatus.Booked
            },
            new Appointment
            {
                Id = 2,
                CaregiverId = 1,
                PatientId = 3,
                Start = new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
                End = new DateTime(2026, 1, 26, 10, 30, 0, DateTimeKind.Utc),
                Status = AppointmentStatus.Booked
            }
        );

        await context.SaveChangesAsync();

        var patient = new User { Id = 2, Role = UserRole.Patient };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RescheduleAsync(
                patient,
                1,
                new DateTime(2026, 1, 26, 10, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 1, 26, 10, 30, 0, DateTimeKind.Utc)));
    }
}
