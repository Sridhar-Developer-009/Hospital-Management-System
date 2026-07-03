namespace HospitalManagementSystem.AuditManagement.Models;
public class AuditLog { public int LogId { get; set; } public int UserId { get; set; } public string ActionType { get; set; } = string.Empty; public string EntityName { get; set; } = string.Empty; public int? EntityId { get; set; } public string? Description { get; set; } public DateTime CreatedDate { get; set; } = DateTime.Now; }
