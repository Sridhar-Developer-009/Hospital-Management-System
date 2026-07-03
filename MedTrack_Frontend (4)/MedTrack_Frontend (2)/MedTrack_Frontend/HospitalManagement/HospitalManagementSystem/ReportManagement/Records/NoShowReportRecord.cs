namespace HospitalManagementSystem.ReportManagement.Records;
public record NoShowReportRecord(string AppointmentNumber, string PatientName, string DoctorName, DateTime AppointmentDate);
