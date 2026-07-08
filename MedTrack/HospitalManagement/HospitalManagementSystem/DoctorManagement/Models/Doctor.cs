namespace HospitalManagementSystem.DoctorManagement.Models;
public class Doctor
{
    public int DoctorId { get; set; }
    public int UserId { get; set; }
    public int DepartmentId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public bool IsActive { get; set; } = true;
    public string GetFullName() => DoctorName;
}
