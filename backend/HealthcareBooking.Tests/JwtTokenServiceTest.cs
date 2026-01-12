using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Xunit;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;

namespace HealthcareBooking.Tests;

public class JwtTokenServiceTests
{
    private JwtTokenService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TEST_SUPER_SECRET_KEY_1234567890123456",
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience",
                ["Jwt:ExpiresMinutes"] = "60"
            })
            .Build();

        return new JwtTokenService(config);
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwt()
    {
        var service = CreateService();

        var user = new User
        {
            Id = 1,
            Email = "test@test.com",
            Role = UserRole.Patient
        };

        var token = service.GenerateToken(user);

        Assert.False(string.IsNullOrWhiteSpace(token));

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal("TestIssuer", jwt.Issuer);
        Assert.Contains("TestAudience", jwt.Audiences);
    }

    [Fact]
    public void GenerateToken_ContainsExpectedClaims()
    {
        var service = CreateService();

        var user = new User
        {
            Id = 42,
            Email = "claims@test.com",
            Role = UserRole.Caregiver
        };

        var token = service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal("42", jwt.Subject);
        Assert.Contains(jwt.Claims, c =>
            c.Type == JwtRegisteredClaimNames.Email &&
            c.Value == "claims@test.com"
        );
        Assert.Contains(jwt.Claims, c =>
            c.Type == ClaimTypes.Role &&
            c.Value == UserRole.Caregiver.ToString()
        );
    }

    [Fact]
    public void GenerateToken_HasExpiration()
    {
        var service = CreateService();

        var user = new User
        {
            Id = 1,
            Email = "expiry@test.com",
            Role = UserRole.Patient
        };

        var token = service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.True(jwt.ValidTo > DateTime.UtcNow);
    }
}
