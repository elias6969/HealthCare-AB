using Microsoft.AspNetCore.Mvc;
using HealthcareBooking.Api.Service;
using HealthcareBooking.Api.Contracts;
using HealthcareBooking.Api.Entities;

namespace HealthcareBooking.Api.Controllers;

[ApiController]
[Route("v1/api/users")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    // --------------------
    // REGISTER
    // --------------------

    // Registers a new patient account.
    [HttpPost("register/patient")]
    public async Task<IActionResult> RegisterPatient(RegisterDto dto)
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
            // Email already exists
            return Conflict("User already exists");
        }
    }

    // Registers a new caregiver account.
    [HttpPost("register/caregiver")]
    public async Task<IActionResult> RegisterCaregiver(RegisterDto dto)
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

    // --------------------
    // LOGIN
    // --------------------

    // Verifies user credentials and returns basic user info.
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userService.LogInAsync(
            dto.Email,
            dto.Password
        );

        if (user == null)
            return Unauthorized("Invalid email or password");

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Role
        });
    }

    // --------------------
    // DELETE
    // --------------------

    // Deletes a user account by id.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _userService.DeleteAccountAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    // --------------------
    // HELPERS
    // --------------------

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
