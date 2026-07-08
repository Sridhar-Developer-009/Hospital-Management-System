namespace HospitalManagementSystem.UserManagement.Models;
public class User
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public bool ValidatePassword(string password) => BCrypt.Net.BCrypt.Verify(password, PasswordHash);
}
