/*
    Hospital Management System (HMS)
    File: 09_TestQueries.sql
    Purpose: Manual verification queries after running SQL package
*/

USE HMS_DB;
GO

-- 1. Verify master data
SELECT * FROM Roles;
SELECT * FROM Departments;
SELECT * FROM vw_DoctorDetails;
SELECT * FROM vw_PatientDetails;
GO

-- 2. Generate demo slots for Dr. Arvind Swamy for the next 7 days
DECLARE @DoctorId INT = (SELECT DoctorId FROM Doctors WHERE DoctorCode = 'DR-0001');
EXEC usp_GenerateDoctorSlots
    @DoctorId = @DoctorId,
    @StartDate = '2026-06-05',
    @EndDate = '2026-06-11',
    @StartTime = '09:00',
    @EndTime = '13:00',
    @SlotDurationMinutes = 30;
GO

-- 3. View available slots
DECLARE @DoctorId2 INT = (SELECT DoctorId FROM Doctors WHERE DoctorCode = 'DR-0001');
EXEC usp_GetAvailableSlots @DoctorId = @DoctorId2, @SlotDate = '2026-06-05';
GO

-- 4. Book first available slot
DECLARE @PatientId INT = (SELECT PatientId FROM Patients WHERE UHID = '87452136');
DECLARE @DoctorId3 INT = (SELECT DoctorId FROM Doctors WHERE DoctorCode = 'DR-0001');
DECLARE @SlotId INT = (
    SELECT TOP 1 SlotId FROM Slots
    WHERE DoctorId = @DoctorId3 AND SlotDate = '2026-06-05' AND IsBooked = 0
    ORDER BY StartTime
);

IF @SlotId IS NOT NULL
BEGIN
    EXEC usp_BookAppointment
        @PatientId = @PatientId,
        @DoctorId = @DoctorId3,
        @SlotId = @SlotId,
        @ReasonForVisit = 'Regular consultation';
END
GO

-- 5. View appointment summary
SELECT * FROM vw_AppointmentSummary;
GO

-- 6. Reports
EXEC usp_DailyAppointmentReport @ReportDate = '2026-06-05';
EXEC usp_DoctorWiseAppointmentReport @FromDate = '2026-06-01', @ToDate = '2026-06-30';
EXEC usp_DepartmentWiseAppointmentReport @FromDate = '2026-06-01', @ToDate = '2026-06-30';
EXEC usp_NoShowAppointmentReport @FromDate = '2026-06-01', @ToDate = '2026-06-30';
GO



USE HMS_DB;
GO

CREATE OR ALTER PROCEDURE usp_GetAvailableSlots
    @DoctorId INT,
    @SlotDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SlotId, DoctorId, SlotDate, StartTime, EndTime, IsBooked
    FROM Slots
    WHERE DoctorId = @DoctorId
      AND SlotDate = @SlotDate
      AND IsBooked = 0
      AND (
            @SlotDate > CAST(GETDATE() AS DATE)
            OR StartTime > CAST(GETDATE() AS TIME)
          )
    ORDER BY StartTime;
END
GO