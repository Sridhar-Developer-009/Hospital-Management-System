/*
    Hospital Management System (HMS)
    File: 05_Views.sql
    Purpose: Create read-optimized views
*/

USE HMS_DB;
GO

CREATE OR ALTER VIEW vw_DoctorDetails AS
SELECT
    d.DoctorId,
    d.DoctorCode,
    d.DoctorName,
    d.Email,
    d.Phone,
    d.Qualification,
    d.ExperienceYears,
    d.IsActive,
    u.UserId,
    u.Username,
    r.RoleName,
    dept.DepartmentId,
    dept.DepartmentName
FROM Doctors d
INNER JOIN Users u ON d.UserId = u.UserId
INNER JOIN Roles r ON u.RoleId = r.RoleId
INNER JOIN Departments dept ON d.DepartmentId = dept.DepartmentId;
GO

CREATE OR ALTER VIEW vw_PatientDetails AS
SELECT
    p.PatientId,
    p.UHID,
    p.PatientName,
    p.Gender,
    p.DateOfBirth,
    p.Email,
    p.Phone,
    p.Address,
    p.BloodGroup,
    p.EmergencyContact,
    p.IsActive,
    u.UserId,
    u.Username,
    r.RoleName
FROM Patients p
INNER JOIN Users u ON p.UserId = u.UserId
INNER JOIN Roles r ON u.RoleId = r.RoleId;
GO

CREATE OR ALTER VIEW vw_AppointmentSummary AS
SELECT
    a.AppointmentId,
    a.AppointmentNumber,
    a.AppointmentDate,
    a.Status,
    a.ReasonForVisit,
    a.CreatedDate AS BookingDateTime,
    p.PatientId,
    p.UHID,
    p.PatientName,
    d.DoctorId,
    d.DoctorCode,
    d.DoctorName,
    dept.DepartmentId,
    dept.DepartmentName,
    s.SlotId,
    s.StartTime,
    s.EndTime,
    s.IsBooked
FROM Appointments a
INNER JOIN Patients p ON a.PatientId = p.PatientId
INNER JOIN Doctors d ON a.DoctorId = d.DoctorId
INNER JOIN Departments dept ON d.DepartmentId = dept.DepartmentId
INNER JOIN Slots s ON a.SlotId = s.SlotId;
GO

CREATE OR ALTER VIEW vw_DoctorSchedule AS
SELECT
    d.DoctorId,
    d.DoctorCode,
    d.DoctorName,
    dept.DepartmentName,
    s.SlotId,
    s.SlotDate,
    s.StartTime,
    s.EndTime,
    s.IsBooked,
    a.AppointmentId,
    a.AppointmentNumber,
    a.Status AS AppointmentStatus,
    p.PatientId,
    p.UHID,
    p.PatientName
FROM Doctors d
INNER JOIN Departments dept ON d.DepartmentId = dept.DepartmentId
INNER JOIN Slots s ON d.DoctorId = s.DoctorId
LEFT JOIN Appointments a ON s.SlotId = a.SlotId
LEFT JOIN Patients p ON a.PatientId = p.PatientId;
GO

CREATE OR ALTER VIEW vw_PatientMedicalHistory AS
SELECT
    p.PatientId,
    p.UHID,
    p.PatientName,
    a.AppointmentId,
    a.AppointmentNumber,
    a.AppointmentDate,
    d.DoctorId,
    d.DoctorName,
    dept.DepartmentName,
    mh.HistoryId,
    mh.Diagnosis,
    mh.ClinicalNotes,
    mh.FollowUpDate,
    pr.PrescriptionId,
    pr.MedicineName,
    pr.Dosage,
    pr.Frequency,
    pr.DurationDays,
    pr.Instructions
FROM Patients p
INNER JOIN Appointments a ON p.PatientId = a.PatientId
INNER JOIN Doctors d ON a.DoctorId = d.DoctorId
INNER JOIN Departments dept ON d.DepartmentId = dept.DepartmentId
INNER JOIN MedicalHistories mh ON a.AppointmentId = mh.AppointmentId
LEFT JOIN Prescriptions pr ON mh.HistoryId = pr.HistoryId;
GO
