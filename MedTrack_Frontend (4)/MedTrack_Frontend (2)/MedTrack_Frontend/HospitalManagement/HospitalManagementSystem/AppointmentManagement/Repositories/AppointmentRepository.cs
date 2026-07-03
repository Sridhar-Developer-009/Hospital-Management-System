using HospitalManagementSystem.AppointmentManagement.Models;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.AppointmentManagement.Repositories;

public class AppointmentRepository : GenericRepository<Appointment>
{
    public AppointmentRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<AppointmentRow?> BookAsync(int patientId, int doctorId, int slotId, string reason)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.BookAppointment);
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotId", slotId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ReasonForVisit", reason));
        var inserted = await ReadListAsync(cmd, r => r.Int("AppointmentId"));
        var id = inserted.FirstOrDefault();
        return id == 0 ? null : await GetByIdAsync2(id);
    }

    public async Task<AppointmentRow?> GetByIdAsync2(int appointmentId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_AppointmentSummary WHERE AppointmentId=@AppointmentId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", appointmentId));
        return (await ReadListAsync(cmd, Map)).FirstOrDefault();
    }

    public async Task<List<AppointmentRow>> GetByDoctorAsync(int doctorId, DateTime? from, DateTime? to)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetAppointmentsByDoctor);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@FromDate", from));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ToDate", to));
        return await ReadListAsync(cmd, Map);
    }

    public async Task<List<AppointmentRow>> GetByPatientAsync(int patientId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetAppointmentsByPatient);
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
        return await ReadListAsync(cmd, Map);
    }

    public async Task<List<AppointmentOversightRow>> GetAllForAdminAsync()
    {
        await using var cmd = await CreateTextCommandAsync("SELECT TOP (500) * FROM vw_AppointmentSummary ORDER BY AppointmentDate DESC, StartTime DESC");
        return await ReadListAsync(cmd, MapOversight);
    }

    public async Task<AppointmentOversightRow?> GetByNumberForAdminAsync(string appointmentNumber)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_AppointmentSummary WHERE AppointmentNumber=@AppointmentNumber");
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentNumber", appointmentNumber));
        return (await ReadListAsync(cmd, MapOversight)).FirstOrDefault();
    }

    public async Task<List<AppointmentOversightRow>> GetByDateForAdminAsync(DateTime date)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_AppointmentSummary WHERE AppointmentDate=@AppointmentDate ORDER BY StartTime");
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentDate", date));
        return await ReadListAsync(cmd, MapOversight);
    }

    public async Task<List<AppointmentOversightRow>> GetByStatusForAdminAsync(string status)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT TOP (500) * FROM vw_AppointmentSummary WHERE Status=@Status ORDER BY AppointmentDate DESC, StartTime DESC");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Status", status));
        return await ReadListAsync(cmd, MapOversight);
    }

    public async Task<AppointmentRow?> GetBySlotIdAsync(int slotId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT TOP (1) * FROM vw_AppointmentSummary WHERE SlotId=@SlotId AND Status='Booked' ORDER BY AppointmentDate DESC");
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotId", slotId));
        return (await ReadListAsync(cmd, Map)).FirstOrDefault();
    }

    public async Task CancelAsync(int appointmentId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.CancelAppointment);
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", appointmentId));
        await ExecuteNonQueryAsync(cmd);
    }

    public async Task<int> CompleteAsync(int appointmentId, string diagnosis, string notes)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.CompleteAppointment);
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", appointmentId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Diagnosis", diagnosis));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ClinicalNotes", notes));
        cmd.Parameters.Add(SqlParameterHelper.Param("@FollowUpDate", DBNull.Value));
        var list = await ReadListAsync(cmd, r => r.Int("HistoryId"));
        return list.FirstOrDefault();
    }

    public async Task AddPrescriptionAsync(int historyId, string medicineName, string dosage, string frequency, int durationDays, string? instructions)
    {
        await using var cmd = await CreateTextCommandAsync("""
INSERT INTO Prescriptions(HistoryId, MedicineName, Dosage, Frequency, DurationDays, Instructions)
VALUES(@HistoryId, @MedicineName, @Dosage, @Frequency, @DurationDays, @Instructions)
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@HistoryId", historyId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@MedicineName", medicineName));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Dosage", dosage));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Frequency", frequency));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DurationDays", durationDays));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Instructions", (object?)instructions ?? DBNull.Value));
        await ExecuteNonQueryAsync(cmd);
    }

    public async Task MarkNoShowAsync(int appointmentId)
    {
        await using var cmd = await CreateTextCommandAsync(@"
            DECLARE @SlotId INT;
            SELECT @SlotId = SlotId FROM Appointments WHERE AppointmentId = @AppointmentId AND Status = 'Booked';
            IF @SlotId IS NOT NULL
            BEGIN
                UPDATE Appointments SET Status = 'NoShow', ModifiedDate = GETDATE() WHERE AppointmentId = @AppointmentId AND Status = 'Booked';
                UPDATE Slots SET IsBooked = 0, ModifiedDate = GETDATE() WHERE SlotId = @SlotId;
            END
        ");
        cmd.Parameters.Add(SqlParameterHelper.Param("@AppointmentId", appointmentId));
        await ExecuteNonQueryAsync(cmd);
    }

    private static AppointmentRow Map(Microsoft.Data.SqlClient.SqlDataReader r) => new(
        r.Int("AppointmentId"), r.Str("AppointmentNumber"), r.Int("PatientId"), r.Str("UHID"), r.Str("PatientName"), r.Int("DoctorId"), r.Str("DoctorCode"), r.Str("DoctorName"), r.Str("DepartmentName"), r.Int("SlotId"), r.Date("AppointmentDate"), r.Time("StartTime"), r.Time("EndTime"), r.Str("Status"), r.Str("ReasonForVisit"));

    private static AppointmentOversightRow MapOversight(Microsoft.Data.SqlClient.SqlDataReader r) => new(
        r.Int("AppointmentId"),
        r.Str("AppointmentNumber"),
        r.Int("PatientId"),
        r.Str("UHID"),
        r.Str("PatientName"),
        r.Int("DoctorId"),
        r.Str("DoctorCode"),
        r.Str("DoctorName"),
        r.Str("DepartmentName"),
        r.Int("SlotId"),
        r.Date("AppointmentDate"),
        r.Time("StartTime"),
        r.Time("EndTime"),
        r.Str("Status"),
        r.Str("ReasonForVisit"),
        ReadOptionalDate(r, "BookingDate", "BookingDateTime", "BookedAt", "BookedOn", "CreatedDate", "CreatedAt", "CreatedOn"));

    private static DateTime? ReadOptionalDate(Microsoft.Data.SqlClient.SqlDataReader r, params string[] names)
    {
        foreach (var name in names)
        {
            if (r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)))
            {
                return Convert.ToDateTime(r[name]);
            }
        }

        return null;
    }
}
