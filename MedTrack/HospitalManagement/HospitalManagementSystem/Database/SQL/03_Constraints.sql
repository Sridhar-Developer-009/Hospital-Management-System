/*
    Hospital Management System (HMS)
    File: 03_Constraints.sql
    Purpose: Foreign keys, unique constraints, and check constraints
*/

USE HMS_DB;
GO

/* Unique Constraints */
ALTER TABLE Roles ADD CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName);
ALTER TABLE Users ADD CONSTRAINT UQ_Users_Username UNIQUE (Username);
ALTER TABLE Departments ADD CONSTRAINT UQ_Departments_DepartmentName UNIQUE (DepartmentName);
ALTER TABLE Doctors ADD CONSTRAINT UQ_Doctors_UserId UNIQUE (UserId);
ALTER TABLE Doctors ADD CONSTRAINT UQ_Doctors_DoctorCode UNIQUE (DoctorCode);
ALTER TABLE Doctors ADD CONSTRAINT UQ_Doctors_Email UNIQUE (Email);
ALTER TABLE Patients ADD CONSTRAINT UQ_Patients_UserId UNIQUE (UserId);
ALTER TABLE Patients ADD CONSTRAINT UQ_Patients_UHID UNIQUE (UHID);
ALTER TABLE Patients ADD CONSTRAINT UQ_Patients_Email UNIQUE (Email);
ALTER TABLE Patients ADD CONSTRAINT UQ_Patients_Phone UNIQUE (Phone);
ALTER TABLE DoctorShifts ADD CONSTRAINT UQ_DoctorShifts_DoctorId_ShiftName UNIQUE (DoctorId, ShiftName);
ALTER TABLE HospitalHolidays ADD CONSTRAINT UQ_HospitalHolidays_HolidayDate UNIQUE (HolidayDate);
ALTER TABLE Slots ADD CONSTRAINT UQ_Slots_DoctorId_SlotDate_StartTime UNIQUE (DoctorId, SlotDate, StartTime);
ALTER TABLE Appointments ADD CONSTRAINT UQ_Appointments_AppointmentNumber UNIQUE (AppointmentNumber);
ALTER TABLE Appointments ADD CONSTRAINT UQ_Appointments_SlotId UNIQUE (SlotId);
GO
-- Drop the unconditional unique constraint on SlotId and replace with a filtered
-- unique index so that cancelled/completed/no-show appointments do not
-- permanently lock their slot. Only active ('Booked') appointments claim a slot.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Appointments_SlotId' AND object_id = OBJECT_ID('Appointments'))
BEGIN
    ALTER TABLE Appointments DROP CONSTRAINT UQ_Appointments_SlotId;
END
GO
CREATE UNIQUE INDEX UQ_Appointments_SlotId_Active
    ON Appointments(SlotId)
    WHERE Status = 'Booked';
GO
ALTER TABLE MedicalHistories ADD CONSTRAINT UQ_MedicalHistories_AppointmentId UNIQUE (AppointmentId);
GO

/* Foreign Keys */
ALTER TABLE Users ADD CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);
ALTER TABLE Doctors ADD CONSTRAINT FK_Doctors_Users FOREIGN KEY (UserId) REFERENCES Users(UserId);
ALTER TABLE Doctors ADD CONSTRAINT FK_Doctors_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId);
ALTER TABLE Patients ADD CONSTRAINT FK_Patients_Users FOREIGN KEY (UserId) REFERENCES Users(UserId);
ALTER TABLE DoctorShifts ADD CONSTRAINT FK_DoctorShifts_Doctors FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId);
ALTER TABLE DoctorLeaves ADD CONSTRAINT FK_DoctorLeaves_Doctors FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId);
ALTER TABLE DoctorLeaves ADD CONSTRAINT FK_DoctorLeaves_ApprovedByUser FOREIGN KEY (ApprovedByUserId) REFERENCES Users(UserId);
ALTER TABLE Slots ADD CONSTRAINT FK_Slots_Doctors FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId);
ALTER TABLE Appointments ADD CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientId) REFERENCES Patients(PatientId);
ALTER TABLE Appointments ADD CONSTRAINT FK_Appointments_Doctors FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId);
ALTER TABLE Appointments ADD CONSTRAINT FK_Appointments_Slots FOREIGN KEY (SlotId) REFERENCES Slots(SlotId);
ALTER TABLE MedicalHistories ADD CONSTRAINT FK_MedicalHistories_Appointments FOREIGN KEY (AppointmentId) REFERENCES Appointments(AppointmentId);
ALTER TABLE Prescriptions ADD CONSTRAINT FK_Prescriptions_MedicalHistories FOREIGN KEY (HistoryId) REFERENCES MedicalHistories(HistoryId);
ALTER TABLE NotificationLogs ADD CONSTRAINT FK_NotificationLogs_Appointments FOREIGN KEY (AppointmentId) REFERENCES Appointments(AppointmentId);
ALTER TABLE AuditLogs ADD CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId);
GO

/* Check Constraints */
ALTER TABLE Patients ADD CONSTRAINT CK_Patients_Gender CHECK (Gender IN ('Male', 'Female', 'Other'));
ALTER TABLE Doctors ADD CONSTRAINT CK_Doctors_ExperienceYears CHECK (ExperienceYears >= 0);
ALTER TABLE DoctorShifts ADD CONSTRAINT CK_DoctorShifts_SlotDurationMinutes CHECK (SlotDurationMinutes > 0);
ALTER TABLE DoctorShifts ADD CONSTRAINT CK_DoctorShifts_TimeRange CHECK (EndTime > StartTime);
ALTER TABLE DoctorLeaves ADD CONSTRAINT CK_DoctorLeaves_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected'));
ALTER TABLE DoctorLeaves ADD CONSTRAINT CK_DoctorLeaves_DateRange CHECK (EndDate >= StartDate);
ALTER TABLE Slots ADD CONSTRAINT CK_Slots_TimeRange CHECK (EndTime > StartTime);
ALTER TABLE Appointments ADD CONSTRAINT CK_Appointments_Status CHECK (Status IN ('Booked', 'Completed', 'Cancelled', 'NoShow'));
ALTER TABLE NotificationLogs ADD CONSTRAINT CK_NotificationLogs_NotificationType CHECK (NotificationType IN ('System', 'Admin', 'Scheduler'));
ALTER TABLE NotificationLogs ADD CONSTRAINT CK_NotificationLogs_Status CHECK (Status IN ('AppointmentConfirmed', 'AppointmentCancelled', 'AppointmentRescheduled', 'Reminder', 'AdminAnnouncement', 'SystemAlert'));
ALTER TABLE Prescriptions ADD CONSTRAINT CK_Prescriptions_DurationDays CHECK (DurationDays > 0);
GO
