namespace HospitalManagementSystem.AppointmentManagement.Models;
public class MedicalHistory { public int HistoryId { get; set; } public int AppointmentId { get; set; } public string Diagnosis { get; set; } = string.Empty; public string? ClinicalNotes { get; set; } public DateTime? FollowUpDate { get; set; } }
