namespace HospitalManagementSystem.Shared.Models;

public record DepartmentRow(int DepartmentId, string DepartmentName);
public record DoctorRow(int DoctorId, string DoctorCode, string DoctorName, int DepartmentId, string DepartmentName, string Email, string Phone, string Qualification, int ExperienceYears, bool IsActive);
public record PatientRow(int PatientId, string UHID, string PatientName, string Gender, DateTime DateOfBirth, string Email, string Phone, string Address, string BloodGroup, string EmergencyContact, bool IsActive);
public record SlotRow(int SlotId, int DoctorId, DateTime SlotDate, TimeSpan StartTime, TimeSpan EndTime, bool IsBooked);
public record AppointmentRow(int AppointmentId, string AppointmentNumber, int PatientId, string UHID, string PatientName, int DoctorId, string DoctorCode, string DoctorName, string DepartmentName, int SlotId, DateTime AppointmentDate, TimeSpan StartTime, TimeSpan EndTime, string Status, string ReasonForVisit);
public record AppointmentOversightRow(int AppointmentId, string AppointmentNumber, int PatientId, string UHID, string PatientName, int DoctorId, string DoctorCode, string DoctorName, string DepartmentName, int SlotId, DateTime AppointmentDate, TimeSpan StartTime, TimeSpan EndTime, string Status, string ReasonForVisit, DateTime? BookingDateTime);
public record MedicalHistoryRow(int HistoryId, int AppointmentId, string AppointmentNumber, DateTime AppointmentDate, string DoctorName, string DepartmentName, string Diagnosis, string ClinicalNotes, string MedicineName, string Dosage, string Frequency, int DurationDays, string Instructions);
public record LeaveRow(int LeaveId, int DoctorId, DateTime StartDate, DateTime EndDate, string Reason, string Status);
public record NotificationRow(int NotificationId, string Recipient, string NotificationType, string Message, string Status, DateTime? SentDate, string UHID = "", DateTime? AppointmentDate = null, TimeSpan? StartTime = null);
public record RecipientLookupResult(bool Exists, string RecipientType, int RecipientId, string FullName, string Email, string Phone);
