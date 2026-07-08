/*
    Hospital Management System (HMS)
    File: 04_Indexes.sql
    Purpose: Create indexes for lookup, dashboard, and report performance
*/

USE HMS_DB;
GO

CREATE NONCLUSTERED INDEX IX_Users_Username ON Users(Username);
CREATE NONCLUSTERED INDEX IX_Patients_UHID ON Patients(UHID);
CREATE NONCLUSTERED INDEX IX_Doctors_DepartmentId ON Doctors(DepartmentId);
CREATE NONCLUSTERED INDEX IX_Slots_DoctorId_SlotDate ON Slots(DoctorId, SlotDate);
CREATE NONCLUSTERED INDEX IX_Appointments_DoctorId ON Appointments(DoctorId);
CREATE NONCLUSTERED INDEX IX_Appointments_PatientId ON Appointments(PatientId);
CREATE NONCLUSTERED INDEX IX_Appointments_AppointmentDate ON Appointments(AppointmentDate);
CREATE NONCLUSTERED INDEX IX_Appointments_Status ON Appointments(Status);
CREATE NONCLUSTERED INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE NONCLUSTERED INDEX IX_AuditLogs_CreatedDate ON AuditLogs(CreatedDate);
GO
