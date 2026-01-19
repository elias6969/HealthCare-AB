using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class AvailableAppointmentServiceTests
{
    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
                          .UseInMemoryDatabase(Guid.NewGuid().ToString())
                          .Options;

        return new AppDbContext(options);
    }

    private static AvailableAppointmentService
    CreateService(AppDbContext context)
    {
        return new AvailableAppointmentService(context);
    }

    [Fact]
    public async Task Returns_full_availability_when_no_appointments_exist()
    {
        var context = CreateDbContext();

        context.Availabilities.Add(
            new Availability
            {
                CaregiverId = 1,
                Start = DateTime.UtcNow.AddHours(1),
                End = DateTime.UtcNow.AddHours(4)
            });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(1);

        Assert.Single(result);
        Assert.Equal(DateTime.UtcNow.AddHours(1).Hour, result[0].Start.Hour);
        Assert.Equal(DateTime.UtcNow.AddHours(4).Hour, result[0].End.Hour);
    }

    [Fact]
    public async Task Excludes_fully_booked_availability()
    {
        var context = CreateDbContext();

        context.Availabilities.Add(
            new Availability
            {
                CaregiverId = 1,
                Start = DateTime.UtcNow.AddHours(1),
                End = DateTime.UtcNow.AddHours(3)
            });

        context.Appointments.Add(new Appointment
        {
            CaregiverId = 1,
            PatientId = 2,
            Start = DateTime.UtcNow.AddHours(1),
            End = DateTime.UtcNow.AddHours(3),
            Status = AppointmentStatus.Booked
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(1);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Splits_availability_around_booked_appointment()
    {
        var context = CreateDbContext();

        context.Availabilities.Add(
            new Availability
            {
                CaregiverId = 1,
                Start = DateTime.UtcNow.AddHours(1),
                End = DateTime.UtcNow.AddHours(4)
            });

        context.Appointments.Add(new Appointment
        {
            CaregiverId = 1,
            PatientId = 2,
            Start = DateTime.UtcNow.AddHours(2),
            End = DateTime.UtcNow.AddHours(3),
            Status = AppointmentStatus.Booked
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(1);

        Assert.Equal(2, result.Count);

        Assert.Equal(DateTime.UtcNow.AddHours(1).Hour, result[0].Start.Hour);
        Assert.Equal(DateTime.UtcNow.AddHours(2).Hour, result[0].End.Hour);

        Assert.Equal(DateTime.UtcNow.AddHours(3).Hour, result[1].Start.Hour);
        Assert.Equal(DateTime.UtcNow.AddHours(4).Hour, result[1].End.Hour);
    }

    [Fact]
    public async Task Does_not_return_past_time_slots()
    {
        var context = CreateDbContext();

        var now = DateTime.UtcNow;

        context.Availabilities.Add(new Availability
        {
            CaregiverId = 1,
            Start = now.AddHours(-2),
            End = now.AddHours(2)
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(1);

        Assert.Single(result);
        Assert.True(result[0].Start >= now);
    }
}
