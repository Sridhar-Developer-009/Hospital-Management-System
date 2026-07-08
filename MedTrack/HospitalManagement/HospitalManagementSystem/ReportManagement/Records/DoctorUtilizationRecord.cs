namespace HospitalManagementSystem.ReportManagement.Records;
public record DoctorUtilizationRecord(int DoctorId, string DoctorName, int TotalSlots, int BookedSlots, decimal UtilizationPercentage);
