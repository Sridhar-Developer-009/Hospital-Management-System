/*
    HMS Notification Module Upgrade Script
    Run this if you already have the old HMS database with the old CHECK constraints.

    Old constraints:
        CK_NotificationLogs_NotificationType: NotificationType IN ('SMS', 'Email', 'System')
        CK_NotificationLogs_Status:           Status IN ('Sent', 'Failed', 'Pending')

    New constraints:
        CK_NotificationLogs_NotificationType: NotificationType IN ('System', 'Admin', 'Scheduler')
        CK_NotificationLogs_Status:           Status IN ('AppointmentConfirmed', 'AppointmentCancelled',
                                                  'AppointmentRescheduled', 'Reminder',
                                                  'AdminAnnouncement', 'SystemAlert')
*/

USE HMS_DB;
GO

-- Drop old constraints (if they exist)
IF OBJECT_ID('CK_NotificationLogs_NotificationType') IS NOT NULL
    ALTER TABLE NotificationLogs DROP CONSTRAINT CK_NotificationLogs_NotificationType;
GO

IF OBJECT_ID('CK_NotificationLogs_Status') IS NOT NULL
    ALTER TABLE NotificationLogs DROP CONSTRAINT CK_NotificationLogs_Status;
GO

-- (Optional) Widen columns for longer category/source names
ALTER TABLE NotificationLogs ALTER COLUMN NotificationType VARCHAR(30) NOT NULL;
ALTER TABLE NotificationLogs ALTER COLUMN Status VARCHAR(30) NOT NULL;
GO

-- Add new constraints
ALTER TABLE NotificationLogs ADD CONSTRAINT CK_NotificationLogs_NotificationType
    CHECK (NotificationType IN ('System', 'Admin', 'Scheduler'));
GO

ALTER TABLE NotificationLogs ADD CONSTRAINT CK_NotificationLogs_Status
    CHECK (Status IN ('AppointmentConfirmed', 'AppointmentCancelled', 'AppointmentRescheduled',
                      'Reminder', 'AdminAnnouncement', 'SystemAlert'));
GO

PRINT 'Notification module constraints upgraded successfully.';
GO
