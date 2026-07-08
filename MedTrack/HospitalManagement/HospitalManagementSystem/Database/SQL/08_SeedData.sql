/*
    Hospital Management System (HMS)
    File: 08_SeedData.sql
    Purpose: Insert baseline roles, departments, and demo users
    NOTE: Demo PasswordHash values are placeholders. The C# application must store BCrypt/Argon2 hashes.
*/

USE HMS_DB;
GO

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin')
    INSERT INTO Roles(RoleName) VALUES ('Admin');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Doctor')
    INSERT INTO Roles(RoleName) VALUES ('Doctor');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Patient')
    INSERT INTO Roles(RoleName) VALUES ('Patient');
GO

IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = 'Cardiology')
    INSERT INTO Departments(DepartmentName, Description) VALUES ('Cardiology', 'Heart and cardiovascular care');
IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = 'Orthopaedics')
    INSERT INTO Departments(DepartmentName, Description) VALUES ('Orthopaedics', 'Bone and joint care');
IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = 'Dermatology')
    INSERT INTO Departments(DepartmentName, Description) VALUES ('Dermatology', 'Skin care');
IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = 'Paediatrics')
    INSERT INTO Departments(DepartmentName, Description) VALUES ('Paediatrics', 'Child health care');
IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = 'General Medicine')
    INSERT INTO Departments(DepartmentName, Description) VALUES ('General Medicine', 'General diagnosis and treatment');
GO

DECLARE @AdminRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Admin');
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin_root')
BEGIN
    INSERT INTO Users(RoleId, Username, PasswordHash)
    VALUES(@AdminRoleId, 'admin_root', '$2a$11$DEMO_HASH_REPLACE_FROM_CSHARP');
END
GO

DECLARE @DoctorRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Doctor');
DECLARE @CardiologyId INT = (SELECT DepartmentId FROM Departments WHERE DepartmentName = 'Cardiology');

IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'dr_arvind')
BEGIN
    INSERT INTO Users(RoleId, Username, PasswordHash)
    VALUES(@DoctorRoleId, 'dr_arvind', '$2a$11$DEMO_HASH_REPLACE_FROM_CSHARP');

    DECLARE @DoctorUserId INT = SCOPE_IDENTITY();
    INSERT INTO Doctors(UserId, DepartmentId, DoctorCode, DoctorName, Email, Phone, Qualification, ExperienceYears)
    VALUES(@DoctorUserId, @CardiologyId, 'DR-0001', 'Dr. Arvind Swamy', 'arvind.s@hospital.com', '9843012345', 'MBBS, MD Cardiology', 12);
END
GO

DECLARE @PatientRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Patient');
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'sridhar_v')
BEGIN
    INSERT INTO Users(RoleId, Username, PasswordHash)
    VALUES(@PatientRoleId, 'sridhar_v', '$2a$11$DEMO_HASH_REPLACE_FROM_CSHARP');

    DECLARE @PatientUserId INT = SCOPE_IDENTITY();
    INSERT INTO Patients(UserId, UHID, PatientName, Gender, DateOfBirth, Email, Phone, Address, BloodGroup, EmergencyContact)
    VALUES(@PatientUserId, '87452136', 'Sridhar V', 'Male', '2005-01-01', 'sridhar@gmail.com', '9876543210', 'Tamil Nadu, India', 'O+', '9876543211');
END
GO

DECLARE @DoctorId INT = (SELECT DoctorId FROM Doctors WHERE DoctorCode = 'DR-0001');
IF @DoctorId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorShifts WHERE DoctorId = @DoctorId AND ShiftName = 'Morning Shift')
BEGIN
    INSERT INTO DoctorShifts(DoctorId, ShiftName, StartTime, EndTime, SlotDurationMinutes)
    VALUES(@DoctorId, 'Morning Shift', '09:00', '13:00', 30);
END
GO
