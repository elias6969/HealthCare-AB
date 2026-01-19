using Microsoft.EntityFrameworkCore;
using HealthcareBooking.Api.Entities;

namespace HealthcareBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Email).IsRequired();

            entity.Property(u => u.PasswordHash).IsRequired();

            entity.Property(u => u.Role).HasConversion<int>();
        });

        // Appointment configuration
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Start).IsRequired();

            entity.Property(a => a.End).IsRequired();

            entity.Property(a => a.Status).HasConversion<int>();

            // Patient relationship
            entity.HasOne(a => a.Patient)
                .WithMany(u => u.PatientAppointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Caregiver relationship
            entity.HasOne(a => a.Caregiver)
                .WithMany(u => u.CaregiverAppointments)
                .HasForeignKey(a => a.CaregiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
