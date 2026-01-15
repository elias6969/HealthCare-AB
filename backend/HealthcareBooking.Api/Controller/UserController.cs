using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthcareBooking.Api.Contracts;
using HealthcareBooking.Api.Entities;
using HealthcareBooking.Api.Service;
using System.Security.Claims;

namespace HealthcareBooking.Api.Controllers;

[ApiController]
[Route("v1/api/users")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;
    private readonly JwtTokenService _jwtTokenService;

    public UsersController(
        UserService userService,
        JwtTokenService jwtTokenService)
    {
        _userService = userService;
        _jwtTokenService = jwtTokenService;
    }

    // Registration
    // Creates a new patient account.
    // Returns 409 if the email is already registered.
    [HttpPost("register/patient")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterDto dto)
    {
        try
        {
            var user = await _userService.CreateAccountAsync(
                dto.Email,
                dto.Password,
                UserRole.Patient
            );

            return CreatedUserResponse(user);
        }
        catch (InvalidOperationException)
        {
            return Conflict("User already exists");
        }
    }

    // Creates a new caregiver account.
    // Returns 409 if the email is already registered.
    [HttpPost("register/caregiver")]
    public async Task<IActionResult> RegisterCaregiver([FromBody] RegisterDto dto)
    {
        try
        {
            var user = await _userService.CreateAccountAsync(
                dto.Email,
                dto.Password,
                UserRole.Caregiver
            );

            return CreatedUserResponse(user);
        }
        catch (InvalidOperationException)
        {
            return Conflict("User already exists");
        }
    }

    // Authentication
    // Validates credentials and returns a JWT if successful.
    // The token should be sent in the Authorization header as:
    // Authorization: Bearer <token>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userService.LogInAsync(dto.Email, dto.Password);

        if (user == null)
            return Unauthorized("Invalid email or password");

        var token = _jwtTokenService.GenerateToken(user);

        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                user.Role
            }
        });
    }

    // Account management
    // Deletes the authenticated user's account.
    // Users are not allowed to delete other accounts.
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        if (userId != id)
            return Forbid();

        var deleted = await _userService.DeleteAccountAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    // Helpers
    private IActionResult CreatedUserResponse(User user)
    {
        return Created(string.Empty, new
        {
            user.Id,
            user.Email,
            user.Role,
            user.CreatedAt
        });
    }
}
