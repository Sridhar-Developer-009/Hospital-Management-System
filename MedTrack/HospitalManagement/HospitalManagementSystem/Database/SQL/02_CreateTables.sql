/*
    Hospital Management System (HMS)
    File: 02_CreateTables.sql
    Purpose: Create all HMS tables
*/

USE HMS_DB;
GO

CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) NOT NULL,
    RoleName VARCHAR(50) NOT NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Roles_CreatedDate DEFAULT GETDATE(),
    CONSTRAINT PK_Roles PRIMARY KEY (RoleId)
);
GO

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) NOT NULL,
    RoleId INT NOT NULL,
    Username VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Users_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Users PRIMARY KEY (UserId)
);
GO

CREATE TABLE Departments (
    DepartmentId INT IDENTITY(1,1) NOT NULL,
    DepartmentName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Departments_IsActive DEFAULT 1,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Departments_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Departments PRIMARY KEY (DepartmentId)
);
GO

CREATE TABLE Doctors (
    DoctorId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    DepartmentId INT NOT NULL,
    DoctorCode VARCHAR(20) NOT NULL,
    DoctorName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Qualification VARCHAR(100) NOT NULL,
    ExperienceYears INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Doctors_IsActive DEFAULT 1,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Doctors_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Doctors PRIMARY KEY (DoctorId)
);
GO

CREATE TABLE Patients (
    PatientId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    UHID CHAR(8) NOT NULL,
    PatientName VARCHAR(100) NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Email VARCHAR(150) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Address VARCHAR(500) NULL,
    BloodGroup VARCHAR(5) NULL,
    EmergencyContact VARCHAR(15) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Patients_IsActive DEFAULT 1,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Patients_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Patients PRIMARY KEY (PatientId)
);
GO

CREATE TABLE DoctorShifts (
    ShiftId INT IDENTITY(1,1) NOT NULL,
    DoctorId INT NOT NULL,
    ShiftName VARCHAR(50) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    SlotDurationMinutes INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_DoctorShifts_IsActive DEFAULT 1,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_DoctorShifts_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_DoctorShifts PRIMARY KEY (ShiftId)
);
GO

CREATE TABLE DoctorLeaves (
    LeaveId INT IDENTITY(1,1) NOT NULL,
    DoctorId INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason VARCHAR(500) NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_DoctorLeaves_Status DEFAULT 'Pending',
    ApprovedByUserId INT NULL,
    ApprovedDate DATETIME NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_DoctorLeaves_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_DoctorLeaves PRIMARY KEY (LeaveId)
);
GO

CREATE TABLE HospitalHolidays (
    HolidayId INT IDENTITY(1,1) NOT NULL,
    HolidayDate DATE NOT NULL,
    HolidayName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_HospitalHolidays_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_HospitalHolidays PRIMARY KEY (HolidayId)
);
GO

CREATE TABLE Slots (
    SlotId INT IDENTITY(1,1) NOT NULL,
    DoctorId INT NOT NULL,
    SlotDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsBooked BIT NOT NULL CONSTRAINT DF_Slots_IsBooked DEFAULT 0,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Slots_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Slots PRIMARY KEY (SlotId)
);
GO

CREATE TABLE Appointments (
    AppointmentId INT IDENTITY(1,1) NOT NULL,
    AppointmentNumber VARCHAR(20) NOT NULL,
    PatientId INT NOT NULL,
    DoctorId INT NOT NULL,
    SlotId INT NOT NULL,
    AppointmentDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Appointments_Status DEFAULT 'Booked',
    ReasonForVisit VARCHAR(500) NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Appointments_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_Appointments PRIMARY KEY (AppointmentId)
);
GO

CREATE TABLE MedicalHistories (
    HistoryId INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    Diagnosis VARCHAR(500) NOT NULL,
    ClinicalNotes VARCHAR(MAX) NULL,
    FollowUpDate DATE NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_MedicalHistories_CreatedDate DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT PK_MedicalHistories PRIMARY KEY (HistoryId)
);
GO

CREATE TABLE Prescriptions (
    PrescriptionId INT IDENTITY(1,1) NOT NULL,
    HistoryId INT NOT NULL,
    MedicineName VARCHAR(100) NOT NULL,
    Dosage VARCHAR(50) NOT NULL,
    Frequency VARCHAR(50) NOT NULL,
    DurationDays INT NOT NULL,
    Instructions VARCHAR(300) NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_Prescriptions_CreatedDate DEFAULT GETDATE(),
    CONSTRAINT PK_Prescriptions PRIMARY KEY (PrescriptionId)
);
GO

CREATE TABLE NotificationLogs (
    NotificationId INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    Recipient VARCHAR(150) NOT NULL,
    NotificationType VARCHAR(30) NOT NULL,
    Message VARCHAR(500) NOT NULL,
    Status VARCHAR(30) NOT NULL,
    SentDate DATETIME NULL,
    CONSTRAINT PK_NotificationLogs PRIMARY KEY (NotificationId)
);
GO

CREATE TABLE AuditLogs (
    LogId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    ActionType VARCHAR(50) NOT NULL,
    EntityName VARCHAR(50) NOT NULL,
    EntityId INT NULL,
    Description VARCHAR(500) NULL,
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_AuditLogs_CreatedDate DEFAULT GETDATE(),
    CONSTRAINT PK_AuditLogs PRIMARY KEY (LogId)
);
GO
