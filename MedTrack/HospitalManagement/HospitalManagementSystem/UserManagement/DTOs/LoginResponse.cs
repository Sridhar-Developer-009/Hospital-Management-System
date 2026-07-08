namespace HospitalManagementSystem.UserManagement.DTOs;
public class LoginResponse
{
    public int UserId { get; set; }
    public int? DoctorId { get; set; }
    public int? PatientId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string CodeOrUhid { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public bool IsAuthenticated { get; set; }
}
