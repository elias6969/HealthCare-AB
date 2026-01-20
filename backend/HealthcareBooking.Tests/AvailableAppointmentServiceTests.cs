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

    private static AvailableAppointmentService CreateService(AppDbContext context)
    {
        return new AvailableAppointmentService(context);
    }

    private static async Task<User> SeedCaregiverAsync(AppDbContext context)
    {
        var caregiver = new User
        {
            Email = "caregiver@test.com",
            FirstName = "Anna",
            LastName = "Svensson",
            Role = UserRole.Caregiver,
            PasswordHash = "hash"
        };

        context.Users.Add(caregiver);
        await context.SaveChangesAsync();

        return caregiver;
    }

    [Fact]
    public async Task Returns_full_availability_when_no_appointments_exist()
    {
        var context = CreateDbContext();
        var caregiver = await SeedCaregiverAsync(context);

        var now = DateTime.UtcNow;
        var start = now.AddHours(1);
        var end = now.AddHours(4);

        context.Availabilities.Add(new Availability
        {
            CaregiverId = caregiver.Id,
            Start = start,
            End = end
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(caregiver.Id);

        Assert.Single(result);
        Assert.Equal(start, result[0].Start);
        Assert.Equal(end, result[0].End);
    }

    [Fact]
    public async Task Excludes_fully_booked_availability()
    {
        var context = CreateDbContext();
        var caregiver = await SeedCaregiverAsync(context);

        var now = DateTime.UtcNow;

        context.Availabilities.Add(new Availability
        {
            CaregiverId = caregiver.Id,
            Start = now.AddHours(1),
            End = now.AddHours(3)
        });

        context.Appointments.Add(new Appointment
        {
            CaregiverId = caregiver.Id,
            PatientId = 2,
            Start = now.AddHours(1),
            End = now.AddHours(3),
            Status = AppointmentStatus.Booked
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(caregiver.Id);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Splits_availability_around_booked_appointment()
    {
        var context = CreateDbContext();
        var caregiver = await SeedCaregiverAsync(context);

        var now = DateTime.UtcNow;

        context.Availabilities.Add(new Availability
        {
            CaregiverId = caregiver.Id,
            Start = now.AddHours(1),
            End = now.AddHours(4)
        });

        context.Appointments.Add(new Appointment
        {
            CaregiverId = caregiver.Id,
            PatientId = 2,
            Start = now.AddHours(2),
            End = now.AddHours(3),
            Status = AppointmentStatus.Booked
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(caregiver.Id);

        Assert.Equal(2, result.Count);

        Assert.Equal(now.AddHours(1), result[0].Start);
        Assert.Equal(now.AddHours(2), result[0].End);

        Assert.Equal(now.AddHours(3), result[1].Start);
        Assert.Equal(now.AddHours(4), result[1].End);
    }

    [Fact]
    public async Task Does_not_return_past_time_slots()
    {
        var context = CreateDbContext();
        var caregiver = await SeedCaregiverAsync(context);

        var now = DateTime.UtcNow;

        context.Availabilities.Add(new Availability
        {
            CaregiverId = caregiver.Id,
            Start = now.AddHours(-2),
            End = now.AddHours(2)
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetAvailableSlotsAsync(caregiver.Id);

        Assert.Single(result);
        Assert.True(result[0].Start >= now);
    }
}
