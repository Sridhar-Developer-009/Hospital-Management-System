using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.NotificationManagement.Models;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.NotificationManagement.Repositories;

public class NotificationRepository : GenericRepository<NotificationLog>
{
    public NotificationRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<List<NotificationRow>> GetByPatientIdAsync(int patientId, int count = 50)
    {
        await using var cmd = await CreateTextCommandAsync("""
SELECT TOP (@Count) n.NotificationId, n.Recipient, n.NotificationType, n.Message, n.Status, n.SentDate
FROM NotificationLogs n
JOIN Appointments a ON n.AppointmentId = a.AppointmentId
WHERE a.PatientId = @PatientId
ORDER BY n.NotificationId DESC
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Count", count));
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
        return await ReadListAsync(cmd, r => new NotificationRow(r.Int("NotificationId"), r.Str("Recipient"), r.Str("NotificationType"), r.Str("Message"), r.Str("Status"), r.Date("SentDate")));
    }

    public async Task<List<NotificationRow>> GetByDoctorIdAsync(int doctorId, int count = 50)
    {
        await using var cmd = await CreateTextCommandAsync("""
SELECT TOP (@Count) n.NotificationId, n.Recipient, n.NotificationType, n.Message, n.Status, n.SentDate, p.UHID, s.SlotDate, s.StartTime
FROM NotificationLogs n
JOIN Appointments a ON n.AppointmentId = a.AppointmentId
JOIN Patients p ON a.PatientId = p.PatientId
JOIN Slots s ON a.SlotId = s.SlotId
WHERE a.DoctorId = @DoctorId
ORDER BY n.NotificationId DESC
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Count", count));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        return await ReadListAsync(cmd, r => new NotificationRow(r.Int("NotificationId"), r.Str("Recipient"), r.Str("NotificationType"), r.Str("Message"), r.Str("Status"), r.Date("SentDate"), r.Str("UHID"), r.Date("SlotDate"), r.Time("StartTime")));
    }

    public async Task AddAsync(int appointmentId, string recipient, string source, string message, string category)
    {
        await using var cmd = await CreateTextCommandAsync("INSERT INTO NotificationLogs(AppointmentId, Recipient, NotificationType, Message, Status, SentDate) VALUES(@AppointmentId,@Recipient,@NotificationType,@Message,@Status,GETDATE())");
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", appointmentId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Recipient", recipient));
        cmd.Parameters.Add(SqlParameterHelper.Param("@NotificationType", source == "Admin" ? "Admin" : "System"));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Message", message));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Status", category));
        await ExecuteNonQueryAsync(cmd);
    }

    public async Task<List<NotificationRow>> GetRecentAsync(int count = 20)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT TOP (@Count) NotificationId, Recipient, NotificationType, Message, Status, SentDate FROM NotificationLogs ORDER BY NotificationId DESC");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Count", count));
        return await ReadListAsync(cmd, r => new NotificationRow(r.Int("NotificationId"), r.Str("Recipient"), r.Str("NotificationType"), r.Str("Message"), r.Str("Status"), r.Date("SentDate")));
    }

    public async Task<RecipientLookupResult> LookupRecipientAsync(string value)
    {
        await using var cmd = await CreateTextCommandAsync("""
SELECT RecipientType, Id, FullName, Email, Phone FROM (
    SELECT 'Patient' AS RecipientType, PatientId AS Id, PatientName AS FullName, Email, Phone, 0 AS Pref
    FROM Patients WHERE (Email = @Value OR Phone = @Value) AND IsActive = 1
    UNION ALL
    SELECT 'Doctor' AS RecipientType, DoctorId AS Id, DoctorName AS FullName, Email, Phone, 1 AS Pref
    FROM Doctors WHERE (Email = @Value OR Phone = @Value) AND IsActive = 1
) t ORDER BY Pref
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Value", value));
        var rows = await ReadListAsync(cmd, r => new RecipientLookupResult(
            true,
            r.Str("RecipientType"),
            r.Int("Id"),
            r.Str("FullName"),
            r.Str("Email"),
            r.Str("Phone")));
        return rows.FirstOrDefault() ?? new RecipientLookupResult(false, string.Empty, 0, string.Empty, string.Empty, string.Empty);
    }

    public async Task<bool> AddTestAsync(string recipient, string message)
    {
        await using var connection = await ConnectionFactory.CreateOpenConnectionAsync();
        await using var tx = connection.BeginTransaction();
        try
        {
            await using var checkCmd = connection.CreateCommand();
            checkCmd.Transaction = tx;
            checkCmd.CommandText = "SELECT ISNULL((SELECT TOP (1) AppointmentId FROM Appointments ORDER BY AppointmentId DESC), 0)";
            var apptId = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
            if (apptId == 0) return false;

            await using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = "INSERT INTO NotificationLogs(AppointmentId, Recipient, NotificationType, Message, Status) VALUES(@AppointmentId, @Recipient, 'Admin', @Message, 'AdminAnnouncement')";
            cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", apptId));
            cmd.Parameters.Add(SqlParameterHelper.Param("@Recipient", recipient));
            cmd.Parameters.Add(SqlParameterHelper.Param("@Message", message));
            await cmd.ExecuteNonQueryAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> SendToPatientAsync(int patientId, string recipient, string message)
    {
        await using var connection = await ConnectionFactory.CreateOpenConnectionAsync();
        await using var tx = connection.BeginTransaction();
        try
        {
            await using var checkCmd = connection.CreateCommand();
            checkCmd.Transaction = tx;
            checkCmd.CommandText = "SELECT ISNULL((SELECT TOP (1) AppointmentId FROM Appointments WHERE PatientId = @PatientId ORDER BY AppointmentId DESC), 0)";
            checkCmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
            var apptId = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
            if (apptId == 0) return false;

            await using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = "INSERT INTO NotificationLogs(AppointmentId, Recipient, NotificationType, Message, Status) VALUES(@AppointmentId, @Recipient, 'Admin', @Message, 'AdminAnnouncement')";
            cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", apptId));
            cmd.Parameters.Add(SqlParameterHelper.Param("@Recipient", recipient));
            cmd.Parameters.Add(SqlParameterHelper.Param("@Message", message));
            await cmd.ExecuteNonQueryAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
