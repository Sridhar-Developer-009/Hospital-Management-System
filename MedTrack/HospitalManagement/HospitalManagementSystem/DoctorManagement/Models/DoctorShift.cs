namespace HospitalManagementSystem.DoctorManagement.Models;
public class DoctorShift { public int ShiftId { get; set; } public int DoctorId { get; set; } public string ShiftName { get; set; } = string.Empty; public TimeSpan StartTime { get; set; } public TimeSpan EndTime { get; set; } public int SlotDurationMinutes { get; set; } public bool IsActive { get; set; } = true; }
