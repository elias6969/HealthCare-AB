using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Dto;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class AvailabilityServiceTests
{
    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AvailabilityService CreateService(AppDbContext context)
    {
        return new AvailabilityService(context);
    }

    [Fact]
    public async Task CreateAvailability_Caregiver_Succeeds()
    {
        // Arrange
        var context = CreateDbContext();

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

        var service = CreateService(context);

        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(2);

        // Act
        var availability = await service.CreateAvailabilityAsync(
            caregiver,
            start,
            end);

        // Assert
        Assert.NotNull(availability);
        Assert.Equal(caregiver.Id, availability.CaregiverId);
        Assert.Equal(start, availability.Start);
        Assert.Equal(end, availability.End);
        Assert.Single(context.Availabilities);
    }

    [Fact]
    public async Task CreateAvailability_Patient_Throws()
    {
        // Arrange
        var context = CreateDbContext();

        var patient = new User
        {
            Email = "patient@test.com",
            FirstName = "Elias",
            LastName = "Test",
            Role = UserRole.Patient,
            PasswordHash = "hash"
        };

        context.Users.Add(patient);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(2);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAvailabilityAsync(patient, start, end));
    }

    [Fact]
    public async Task CreateAvailability_StartAfterEnd_Throws()
    {
        // Arrange
        var context = CreateDbContext();

        var caregiver = new User
        {
            Email = "caregiver2@test.com",
            FirstName = "Anna",
            LastName = "Svensson",
            Role = UserRole.Caregiver,
            PasswordHash = "hash"
        };

        context.Users.Add(caregiver);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var start = DateTime.UtcNow.AddHours(2);
        var end = DateTime.UtcNow.AddHours(1);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAvailabilityAsync(caregiver, start, end));
    }
}
