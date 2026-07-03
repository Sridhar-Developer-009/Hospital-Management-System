/*
    Hospital Management System (HMS)
    File: 07_Triggers.sql
    Purpose: Database-level audit and safety triggers
*/

USE HMS_DB;
GO

CREATE OR ALTER TRIGGER trg_Appointments_StatusAudit
ON Appointments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs(UserId, ActionType, EntityName, EntityId, Description)
    SELECT
        ISNULL(p.UserId, 1),
        CASE i.Status
            WHEN 'Cancelled' THEN 'CANCEL_APPOINTMENT'
            WHEN 'Completed' THEN 'COMPLETE_APPOINTMENT'
            WHEN 'NoShow' THEN 'MARK_NOSHOW'
            ELSE 'UPDATE_APPOINTMENT'
        END,
        'Appointments',
        i.AppointmentId,
        CONCAT('Appointment ', i.AppointmentNumber, ' status changed from ', d.Status, ' to ', i.Status)
    FROM inserted i
    INNER JOIN deleted d ON i.AppointmentId = d.AppointmentId
    INNER JOIN Patients p ON i.PatientId = p.PatientId
    WHERE ISNULL(i.Status, '') <> ISNULL(d.Status, '');
END
GO

CREATE OR ALTER TRIGGER trg_DoctorLeaves_StatusAudit
ON DoctorLeaves
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs(UserId, ActionType, EntityName, EntityId, Description)
    SELECT
        ISNULL(i.ApprovedByUserId, 1),
        CASE i.Status
            WHEN 'Approved' THEN 'APPROVE_LEAVE'
            WHEN 'Rejected' THEN 'REJECT_LEAVE'
            ELSE 'UPDATE_LEAVE'
        END,
        'DoctorLeaves',
        i.LeaveId,
        CONCAT('Doctor leave status changed from ', d.Status, ' to ', i.Status)
    FROM inserted i
    INNER JOIN deleted d ON i.LeaveId = d.LeaveId
    WHERE ISNULL(i.Status, '') <> ISNULL(d.Status, '');
END
GO

CREATE OR ALTER TRIGGER trg_PreventMedicalHistoryUpdate
ON MedicalHistories
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51001, 'Medical history records are immutable and cannot be updated or deleted.', 1;
END
GO

CREATE OR ALTER TRIGGER trg_PreventPrescriptionUpdate
ON Prescriptions
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51002, 'Prescription records are immutable and cannot be updated or deleted.', 1;
END
GO
