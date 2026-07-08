/*
    Hospital Management System (HMS)
    File: 06_StoredProcedures.sql
    Purpose: Stored procedures required by the HMS Constitution
*/

USE HMS_DB;
GO

CREATE OR ALTER PROCEDURE usp_Login
    @Username VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Username,
        u.PasswordHash,
        u.IsActive,
        r.RoleId,
        r.RoleName
    FROM Users u
    INNER JOIN Roles r ON u.RoleId = r.RoleId
    WHERE u.Username = @Username AND u.IsActive = 1;
END
GO

CREATE OR ALTER PROCEDURE usp_AddDoctor
    @DoctorName VARCHAR(100),
    @DepartmentId INT,
    @Email VARCHAR(100),
    @Phone VARCHAR(15),
    @Qualification VARCHAR(100),
    @ExperienceYears INT,
    @Username VARCHAR(100),
    @PasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DoctorRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Doctor');
        IF @DoctorRoleId IS NULL THROW 50001, 'Doctor role not found.', 1;

        INSERT INTO Users(RoleId, Username, PasswordHash)
        VALUES(@DoctorRoleId, @Username, @PasswordHash);

        DECLARE @UserId INT = SCOPE_IDENTITY();
        DECLARE @DoctorCode VARCHAR(20) = CONCAT('DR-', RIGHT('0000' + CAST(@UserId AS VARCHAR(10)), 4));

        INSERT INTO Doctors(UserId, DepartmentId, DoctorCode, DoctorName, Email, Phone, Qualification, ExperienceYears)
        VALUES(@UserId, @DepartmentId, @DoctorCode, @DoctorName, @Email, @Phone, @Qualification, @ExperienceYears);

        SELECT SCOPE_IDENTITY() AS DoctorId, @DoctorCode AS DoctorCode;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_UpdateDoctor
    @DoctorId INT,
    @DoctorName VARCHAR(100),
    @DepartmentId INT,
    @Email VARCHAR(100),
    @Phone VARCHAR(15),
    @Qualification VARCHAR(100),
    @ExperienceYears INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Doctors
    SET DoctorName = @DoctorName,
        DepartmentId = @DepartmentId,
        Email = @Email,
        Phone = @Phone,
        Qualification = @Qualification,
        ExperienceYears = @ExperienceYears,
        ModifiedDate = GETDATE()
    WHERE DoctorId = @DoctorId AND IsActive = 1;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE usp_DeleteDoctor
    @DoctorId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @UserId INT;
        SELECT @UserId = UserId FROM Doctors WHERE DoctorId = @DoctorId;

        UPDATE Doctors SET IsActive = 0, ModifiedDate = GETDATE() WHERE DoctorId = @DoctorId;
        UPDATE Users SET IsActive = 0, ModifiedDate = GETDATE() WHERE UserId = @UserId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_GetDoctorById
    @DoctorId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_DoctorDetails WHERE DoctorId = @DoctorId;
END
GO

CREATE OR ALTER PROCEDURE usp_GetAllDoctors
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_DoctorDetails WHERE IsActive = 1 ORDER BY DoctorName;
END
GO

CREATE OR ALTER PROCEDURE usp_RegisterPatient
    @PatientName VARCHAR(100),
    @Gender VARCHAR(10),
    @DateOfBirth DATE,
    @Email VARCHAR(150),
    @Phone VARCHAR(15),
    @Address VARCHAR(500) = NULL,
    @BloodGroup VARCHAR(5) = NULL,
    @EmergencyContact VARCHAR(15) = NULL,
    @Username VARCHAR(100),
    @PasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PatientRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Patient');
        IF @PatientRoleId IS NULL THROW 50002, 'Patient role not found.', 1;

        INSERT INTO Users(RoleId, Username, PasswordHash)
        VALUES(@PatientRoleId, @Username, @PasswordHash);

        DECLARE @UserId INT = SCOPE_IDENTITY();
        DECLARE @NextNumber INT = ISNULL((SELECT MAX(CAST(UHID AS INT)) FROM Patients), 10000000) + 1;
        DECLARE @UHID CHAR(8) = RIGHT('00000000' + CAST(@NextNumber AS VARCHAR(8)), 8);

        INSERT INTO Patients(UserId, UHID, PatientName, Gender, DateOfBirth, Email, Phone, Address, BloodGroup, EmergencyContact)
        VALUES(@UserId, @UHID, @PatientName, @Gender, @DateOfBirth, @Email, @Phone, @Address, @BloodGroup, @EmergencyContact);

        SELECT SCOPE_IDENTITY() AS PatientId, @UHID AS UHID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_UpdatePatient
    @PatientId INT,
    @PatientName VARCHAR(100),
    @Gender VARCHAR(10),
    @DateOfBirth DATE,
    @Email VARCHAR(150),
    @Phone VARCHAR(15),
    @Address VARCHAR(500) = NULL,
    @BloodGroup VARCHAR(5) = NULL,
    @EmergencyContact VARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Patients
    SET PatientName = @PatientName,
        Gender = @Gender,
        DateOfBirth = @DateOfBirth,
        Email = @Email,
        Phone = @Phone,
        Address = @Address,
        BloodGroup = @BloodGroup,
        EmergencyContact = @EmergencyContact,
        ModifiedDate = GETDATE()
    WHERE PatientId = @PatientId AND IsActive = 1;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE usp_GetPatientByUHID
    @UHID CHAR(8)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_PatientDetails WHERE UHID = @UHID;
END
GO

CREATE OR ALTER PROCEDURE usp_GetAllPatients
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_PatientDetails WHERE IsActive = 1 ORDER BY PatientName;
END
GO

CREATE OR ALTER PROCEDURE usp_GenerateDoctorSlots
    @DoctorId INT,
    @StartDate DATE,
    @EndDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @SlotDurationMinutes INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentDate DATE = @StartDate;
    DECLARE @CurrentStart TIME;
    DECLARE @CurrentEnd TIME;
    DECLARE @RowsCreated INT = 0;

    WHILE @CurrentDate <= @EndDate
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM HospitalHolidays WHERE HolidayDate = @CurrentDate)
           AND NOT EXISTS (
               SELECT 1 FROM DoctorLeaves
               WHERE DoctorId = @DoctorId
                 AND Status = 'Approved'
                 AND @CurrentDate BETWEEN StartDate AND EndDate
           )
        BEGIN
            SET @CurrentStart = @StartTime;

            WHILE DATEADD(MINUTE, @SlotDurationMinutes, CAST(@CurrentStart AS DATETIME)) <= CAST(@EndTime AS DATETIME)
            BEGIN
                SET @CurrentEnd = CAST(DATEADD(MINUTE, @SlotDurationMinutes, CAST(@CurrentStart AS DATETIME)) AS TIME);

                IF NOT EXISTS (
                    SELECT 1 FROM Slots
                    WHERE DoctorId = @DoctorId AND SlotDate = @CurrentDate AND StartTime = @CurrentStart
                )
                BEGIN
                    INSERT INTO Slots(DoctorId, SlotDate, StartTime, EndTime)
                    VALUES(@DoctorId, @CurrentDate, @CurrentStart, @CurrentEnd);
                    SET @RowsCreated += 1;
                END

                SET @CurrentStart = @CurrentEnd;
            END
        END

        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
    END

    SELECT @RowsCreated AS RowsCreated;
END
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
      AND (SlotDate > CAST(GETDATE() AS DATE) OR (SlotDate = CAST(GETDATE() AS DATE) AND StartTime > CAST(GETDATE() AS TIME)))
    ORDER BY StartTime;
END
GO

CREATE OR ALTER PROCEDURE usp_BookAppointment
    @PatientId INT,
    @DoctorId INT,
    @SlotId INT,
    @ReasonForVisit VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SlotDate DATE;
        DECLARE @AppointmentNumber VARCHAR(20);
        SELECT @SlotDate = SlotDate FROM Slots WHERE SlotId = @SlotId AND DoctorId = @DoctorId;

        IF @SlotDate IS NULL THROW 50003, 'Invalid slot for doctor.', 1;

        UPDATE Slots
        SET IsBooked = 1, ModifiedDate = GETDATE()
        WHERE SlotId = @SlotId AND DoctorId = @DoctorId AND IsBooked = 0;

        IF @@ROWCOUNT = 0 THROW 50004, 'Slot no longer available.', 1;

        IF EXISTS (
            SELECT 1 FROM Appointments
            WHERE PatientId = @PatientId
              AND DoctorId = @DoctorId
              AND AppointmentDate = @SlotDate
              AND Status = 'Booked'
        )
        BEGIN
            THROW 50005, 'Patient already has a booked appointment with this doctor on this date.', 1;
        END

        DECLARE @NextId INT = IDENT_CURRENT('Appointments') + 1;
        SET @AppointmentNumber = CONCAT('APPT-', YEAR(@SlotDate), '-', RIGHT('0000' + CAST(@NextId AS VARCHAR(10)), 4));

        INSERT INTO Appointments(AppointmentNumber, PatientId, DoctorId, SlotId, AppointmentDate, ReasonForVisit)
        VALUES(@AppointmentNumber, @PatientId, @DoctorId, @SlotId, @SlotDate, @ReasonForVisit);

        SELECT SCOPE_IDENTITY() AS AppointmentId, @AppointmentNumber AS AppointmentNumber;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_CancelAppointment
    @AppointmentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SlotId INT;
        SELECT @SlotId = SlotId FROM Appointments WHERE AppointmentId = @AppointmentId AND Status = 'Booked';
        IF @SlotId IS NULL THROW 50006, 'Appointment cannot be cancelled.', 1;

        UPDATE Appointments
        SET Status = 'Cancelled', ModifiedDate = GETDATE()
        WHERE AppointmentId = @AppointmentId AND Status = 'Booked';

        UPDATE Slots
        SET IsBooked = 0, ModifiedDate = GETDATE()
        WHERE SlotId = @SlotId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_CompleteAppointment
    @AppointmentId INT,
    @Diagnosis VARCHAR(500),
    @ClinicalNotes VARCHAR(MAX) = NULL,
    @FollowUpDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE Appointments
        SET Status = 'Completed', ModifiedDate = GETDATE()
        WHERE AppointmentId = @AppointmentId AND Status = 'Booked';

        IF @@ROWCOUNT = 0 THROW 50007, 'Appointment cannot be completed.', 1;

        DECLARE @SlotId INT;
        SELECT @SlotId = SlotId FROM Appointments WHERE AppointmentId = @AppointmentId;

        UPDATE Slots
        SET IsBooked = 0, ModifiedDate = GETDATE()
        WHERE SlotId = @SlotId;

        INSERT INTO MedicalHistories(AppointmentId, Diagnosis, ClinicalNotes, FollowUpDate)
        VALUES(@AppointmentId, @Diagnosis, @ClinicalNotes, @FollowUpDate);

        SELECT SCOPE_IDENTITY() AS HistoryId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_GetAppointmentsByDoctor
    @DoctorId INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_AppointmentSummary
    WHERE DoctorId = @DoctorId
      AND (@FromDate IS NULL OR AppointmentDate >= @FromDate)
      AND (@ToDate IS NULL OR AppointmentDate <= @ToDate)
    ORDER BY AppointmentDate, StartTime;
END
GO

CREATE OR ALTER PROCEDURE usp_GetAppointmentsByPatient
    @PatientId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_AppointmentSummary
    WHERE PatientId = @PatientId
    ORDER BY AppointmentDate DESC, StartTime DESC;
END
GO

CREATE OR ALTER PROCEDURE usp_ApplyDoctorLeave
    @DoctorId INT,
    @StartDate DATE,
    @EndDate DATE,
    @Reason VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DoctorLeaves(DoctorId, StartDate, EndDate, Reason)
    VALUES(@DoctorId, @StartDate, @EndDate, @Reason);
    SELECT SCOPE_IDENTITY() AS LeaveId;
END
GO

CREATE OR ALTER PROCEDURE usp_ApproveDoctorLeave
    @LeaveId INT,
    @ApprovedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE DoctorLeaves
    SET Status = 'Approved', ApprovedByUserId = @ApprovedByUserId, ApprovedDate = GETDATE(), ModifiedDate = GETDATE()
    WHERE LeaveId = @LeaveId AND Status = 'Pending';
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE usp_RejectDoctorLeave
    @LeaveId INT,
    @ApprovedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE DoctorLeaves
    SET Status = 'Rejected', ApprovedByUserId = @ApprovedByUserId, ApprovedDate = GETDATE(), ModifiedDate = GETDATE()
    WHERE LeaveId = @LeaveId AND Status = 'Pending';
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE usp_DailyAppointmentReport
    @ReportDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DepartmentName, DoctorName, Status, COUNT(*) AS AppointmentCount
    FROM vw_AppointmentSummary
    WHERE AppointmentDate = @ReportDate
    GROUP BY DepartmentName, DoctorName, Status
    ORDER BY DepartmentName, DoctorName, Status;
END
GO

CREATE OR ALTER PROCEDURE usp_DoctorWiseAppointmentReport
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DoctorId, DoctorName, DepartmentName, Status, COUNT(*) AS AppointmentCount
    FROM vw_AppointmentSummary
    WHERE AppointmentDate BETWEEN @FromDate AND @ToDate
    GROUP BY DoctorId, DoctorName, DepartmentName, Status
    ORDER BY DoctorName, Status;
END
GO

CREATE OR ALTER PROCEDURE usp_DepartmentWiseAppointmentReport
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DepartmentId, DepartmentName, Status, COUNT(*) AS AppointmentCount
    FROM vw_AppointmentSummary
    WHERE AppointmentDate BETWEEN @FromDate AND @ToDate
    GROUP BY DepartmentId, DepartmentName, Status
    ORDER BY DepartmentName, Status;
END
GO

CREATE OR ALTER PROCEDURE usp_NoShowAppointmentReport
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM vw_AppointmentSummary
    WHERE Status = 'NoShow'
      AND AppointmentDate BETWEEN @FromDate AND @ToDate
    ORDER BY AppointmentDate DESC, DoctorName;
END
GO

CREATE OR ALTER PROCEDURE usp_DeclareHolidayWithCascade
    @HolidayDate DATE,
    @HolidayName NVARCHAR(200),
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Resolve holiday table and column names (mirrors HolidayRepository dynamic logic)
        DECLARE @TableName sysname =
            CASE
                WHEN OBJECT_ID('HospitalHolidays', 'U') IS NOT NULL THEN 'HospitalHolidays'
                WHEN OBJECT_ID('HospitalHoliday', 'U') IS NOT NULL THEN 'HospitalHoliday'
                ELSE NULL
            END;

        IF @TableName IS NULL
            THROW 51000, 'Holiday table was not found in the HMS database.', 1;

        DECLARE @Columns nvarchar(max) = N'HolidayDate';
        DECLARE @Values  nvarchar(max) = N'@HolidayDate';

        IF COL_LENGTH(@TableName, 'HolidayName') IS NOT NULL
        BEGIN
            SET @Columns += N', HolidayName';
            SET @Values  += N', @HolidayName';
        END
        ELSE IF COL_LENGTH(@TableName, 'HolidayTitle') IS NOT NULL
        BEGIN
            SET @Columns += N', HolidayTitle';
            SET @Values  += N', @HolidayName';
        END;

        IF COL_LENGTH(@TableName, 'Description') IS NOT NULL
        BEGIN
            SET @Columns += N', Description';
            SET @Values  += N', @Description';
        END
        ELSE IF COL_LENGTH(@TableName, 'Reason') IS NOT NULL
        BEGIN
            SET @Columns += N', Reason';
            SET @Values  += N', @Description';
        END;

        IF COL_LENGTH(@TableName, 'IsActive') IS NOT NULL
        BEGIN
            SET @Columns += N', IsActive';
            SET @Values  += N', 1';
        END;

        IF COL_LENGTH(@TableName, 'CreatedDate') IS NOT NULL
        BEGIN
            SET @Columns += N', CreatedDate';
            SET @Values  += N', GETDATE()';
        END;

        DECLARE @Sql nvarchar(max) = N'INSERT INTO ' + QUOTENAME(@TableName) +
            N' (' + @Columns + N') VALUES (' + @Values + N');';
        EXEC sp_executesql @Sql,
            N'@HolidayDate date, @HolidayName nvarchar(200), @Description nvarchar(500)',
            @HolidayDate, @HolidayName, @Description;

        -- 2. Cascade-cancel all 'Booked' appointments on the holiday date
        DECLARE @CancelledAppointments TABLE (AppointmentId INT, SlotId INT);

        UPDATE a
        SET Status = 'Cancelled', ModifiedDate = GETDATE()
        OUTPUT inserted.AppointmentId, inserted.SlotId INTO @CancelledAppointments
        FROM Appointments AS a
        WHERE a.AppointmentDate = @HolidayDate
          AND a.Status = 'Booked';

        -- 3. Release the slots that were tied to those appointments
        UPDATE s
        SET IsBooked = 0, ModifiedDate = GETDATE()
        FROM Slots AS s
        INNER JOIN @CancelledAppointments AS ca ON s.SlotId = ca.SlotId;

        -- 4. Return summary counts
        SELECT
            (SELECT COUNT(*) FROM @CancelledAppointments) AS CancelledAppointmentCount,
            (SELECT COUNT(DISTINCT SlotId) FROM @CancelledAppointments) AS ReleasedSlotCount;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
