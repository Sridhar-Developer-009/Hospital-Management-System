namespace HospitalManagementSystem.PatientManagement.Models;
public class Patient
{
    public int PatientId { get; set; }
    public int UserId { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? EmergencyContact { get; set; }
    public bool IsActive { get; set; } = true;
    public string GetFullName() => PatientName;
}
