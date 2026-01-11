using Microsoft.EntityFrameworkCore;
using HealthcareBooking.Api.Data;
using HealthcareBooking.Api.Entities;

namespace HealthcareBooking.Api.Service;

public class UserService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public UserService(AppDbContext context, PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    // Creates a new user account.
    // Throws if the email is already in use.
    public async Task<User> CreateAccountAsync(
        string email,
        string password,
        UserRole role)
    {
        // Make sure the email isn't already registered
        var exists = await _context.Users
            .AnyAsync(u => u.Email == email);

        if (exists)
            throw new InvalidOperationException("User already exists");

        var user = new User
        {
            Email = email,
            Role = role
        };

        // Hash the password before storing it
        user.PasswordHash = _passwordService.Hash(password, user);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    // Deletes a user account by id.
    // Returns false if the user does not exist.
    public async Task<bool> DeleteAccountAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return true;
    }

    // Verifies login credentials.
    // Returns the user if successful, otherwise null.
    public async Task<User?> LogInAsync(string email, string password)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Email == email);

        if (user == null)
            return null;

        var isValid = _passwordService.Verify(
            user.PasswordHash,
            password,
            user);

        return isValid ? user : null;
    }
}
