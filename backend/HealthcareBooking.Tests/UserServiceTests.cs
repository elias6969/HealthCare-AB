using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;

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
        var service = CreateService();

        var user = await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            "Elias",
            "Testafter",
            UserRole.Patient
        );

        Assert.NotNull(user);
        Assert.Equal("test@test.com", user.Email);
        Assert.Equal(UserRole.Patient, user.Role);
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    [Fact]
    public async Task CreateAccountAsync_DuplicateEmail_Throws()
    {
        var service = CreateService();

        await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            "Elias",
            "Testafter",
            UserRole.Patient
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAccountAsync(
                "test@test.com",
                "Password123!",
                "Another",
                "User",
                UserRole.Patient
            )
        );
    }

    [Fact]
    public async Task CreateAccountAsync_PasswordIsHashed()
    {
        var service = CreateService();
        var password = "Password123!";

        var user = await service.CreateAccountAsync(
            "secure@test.com",
            password,
            "Elias",
            "Secure",
            UserRole.Patient
        );

        Assert.NotEqual(password, user.PasswordHash);
    }

    [Fact]
    public async Task LogInAsync_ValidCredentials_ReturnsUser()
    {
        var service = CreateService();

        await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            "Elias",
            "Testafter",
            UserRole.Patient
        );

        var result = await service.LogInAsync(
            "test@test.com",
            "Password123!"
        );

        Assert.NotNull(result);
        Assert.Equal("test@test.com", result!.Email);
        Assert.Equal(UserRole.Patient, result.Role);
    }

    [Fact]
    public async Task LogInAsync_WrongPassword_ReturnsNull()
    {
        var service = CreateService();

        await service.CreateAccountAsync(
            "test@test.com",
            "Password123!",
            "Elias",
            "Testafter",
            UserRole.Patient
        );

        var result = await service.LogInAsync(
            "test@test.com",
            "WrongPassword"
        );

        Assert.Null(result);
    }

    [Fact]
    public async Task LogInAsync_UnknownEmail_ReturnsNull()
    {
        var service = CreateService();

        var result = await service.LogInAsync(
            "unknown@test.com",
            "Password123!"
        );

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAccountAsync_ExistingUser_ReturnsTrue()
    {
        var service = CreateService();

        var user = await service.CreateAccountAsync(
            "delete@test.com",
            "Password123!",
            "Elias",
            "Delete",
            UserRole.Patient
        );

        var result = await service.DeleteAccountAsync(user.Id);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteAccountAsync_NonExistentUser_ReturnsFalse()
    {
        var service = CreateService();

        var result = await service.DeleteAccountAsync(999);

        Assert.False(result);
    }
}
