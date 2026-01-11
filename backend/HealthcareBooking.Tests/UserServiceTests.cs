using Microsoft.EntityFrameworkCore;
using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using Xunit;

namespace HealthcareBooking.Tests;

public class UserServiceTests
{
    private UserService CreateService()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        var passwordService = new PasswordService();

        return new UserService(context, passwordService);
    }

    [Fact]
    public async Task CreateAccountAsync_CreatesUserSuccessfully()
    {
        // Arrange
        var service = CreateService();

        // Act
        var user = await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            UserRole.Patient
        );

        // Assert
        Assert.NotNull(user);
        Assert.Equal("test@test.com", user.Email);
        Assert.Equal(UserRole.Patient, user.Role);
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    [Fact]
    public async Task CreateAccountAsync_DuplicateEmail_Throws()
    {
        // Arrange
        var service = CreateService();

        await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            UserRole.Patient
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAccountAsync(
                "test@test.com",
                "Password123!",
                UserRole.Patient
            )
        );
    }

    [Fact]
    public async Task LogInAsync_WrongPassword_ReturnsNull()
    {
        // Arrange
        var service = CreateService();

        await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            UserRole.Patient
        );

        // Act
        var result = await service.LogInAsync(
            "test@test.com",
            "WrongPassword"
        );

        // Assert
        Assert.Null(result);
    }
}
