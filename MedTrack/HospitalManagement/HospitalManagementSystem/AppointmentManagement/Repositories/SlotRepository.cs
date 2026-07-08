using HospitalManagementSystem.AppointmentManagement.Models;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.AppointmentManagement.Repositories;

public class SlotRepository : GenericRepository<Slot>
{
    public SlotRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<int> GenerateSlotsAsync(int doctorId, DateTime startDate, DateTime endDate, TimeSpan startTime, TimeSpan endTime, int duration)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GenerateDoctorSlots);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartDate", startDate));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndDate", endDate));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartTime", startTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndTime", endTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotDurationMinutes", duration));
        var list = await ReadListAsync(cmd, r => r.Int("RowsCreated"));
        return list.FirstOrDefault();
    }

    public async Task<List<SlotRow>> GetAvailableSlotsAsync(int doctorId, DateTime date)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetAvailableSlots);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotDate", date));
        return await ReadListAsync(cmd, r => new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")));
    }

    public async Task<List<SlotRow>> GetDoctorSlotsForWeekAsync(int doctorId, DateTime start, DateTime end)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT SlotId, DoctorId, SlotDate, StartTime, EndTime, IsBooked FROM Slots WHERE DoctorId=@DoctorId AND SlotDate BETWEEN @Start AND @End ORDER BY SlotDate, StartTime");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Start", start));
        cmd.Parameters.Add(SqlParameterHelper.Param("@End", end));
        return await ReadListAsync(cmd, r => new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")));
    }

    public async Task<List<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)>> GetDoctorSlotsWithDetailsAsync(int doctorId, DateTime start, DateTime end)
    {
        await using var cmd = await CreateTextCommandAsync("""
SELECT s.SlotId, s.DoctorId, s.SlotDate, s.StartTime, s.EndTime, s.IsBooked,
       CASE WHEN ba.AppointmentId IS NOT NULL AND ba.Status = 'Booked' THEN 1 ELSE 0 END as HasActiveAppointment,
       CASE WHEN ca.AppointmentId IS NOT NULL AND ca.Status = 'Completed' THEN 1 ELSE 0 END as HasCompletedAppointment
FROM Slots s
LEFT JOIN Appointments ba ON s.SlotId = ba.SlotId AND ba.Status = 'Booked'
LEFT JOIN Appointments ca ON s.SlotId = ca.SlotId AND ca.Status = 'Completed'
WHERE s.DoctorId = @DoctorId AND s.SlotDate BETWEEN @Start AND @End
ORDER BY s.SlotDate, s.StartTime
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Start", start));
        cmd.Parameters.Add(SqlParameterHelper.Param("@End", end));
        return await ReadListAsync(cmd, r => (
            new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")),
            r.Bool("HasActiveAppointment"),
            r.Bool("HasCompletedAppointment")));
    }

    public async Task<bool> ToggleSlotBlockAsync(int slotId, bool block)
    {
        await using var cmd = await CreateTextCommandAsync("""
UPDATE Slots SET IsBooked = @Block
WHERE SlotId = @SlotId
  AND NOT EXISTS (SELECT 1 FROM Appointments WHERE SlotId = @SlotId AND Status = 'Booked')
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotId", slotId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Block", block));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<int> DeleteFutureUnbookedSlotsAsync(int doctorId, DateTime fromDate, DateTime toDate)
    {
        await using var cmd = await CreateTextCommandAsync("DELETE FROM Slots WHERE DoctorId=@DoctorId AND SlotDate BETWEEN @From AND @To AND IsBooked=0");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@From", fromDate));
        cmd.Parameters.Add(SqlParameterHelper.Param("@To", toDate));
        return await ExecuteNonQueryAsync(cmd);
    }

    public async Task<int> InsertCustomSlotsForWeekAsync(int doctorId, DateTime fromDate, DateTime toDate, List<TimeSpan> slotStartTimes, int durationMinutes)
    {
        var total = 0;
        for (var d = fromDate; d <= toDate; d = d.AddDays(1))
        {
            var sb = new System.Text.StringBuilder();
            for (var s = 0; s < slotStartTimes.Count; s++)
            {
                var start = slotStartTimes[s];
                var end = start.Add(TimeSpan.FromMinutes(durationMinutes));
                sb.Append($"IF NOT EXISTS (SELECT 1 FROM Slots WHERE DoctorId=@DoctorId AND SlotDate=@Date AND StartTime=@Start{s}) ");
                sb.Append($"INSERT INTO Slots(DoctorId, SlotDate, StartTime, EndTime, IsBooked) VALUES(@DoctorId, @Date, @Start{s}, @End{s}, 0); ");
            }
            await using var cmd = await CreateTextCommandAsync(sb.ToString());
            cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
            cmd.Parameters.Add(SqlParameterHelper.Param("@Date", d.Date));
            for (var s = 0; s < slotStartTimes.Count; s++)
            {
                var start = slotStartTimes[s];
                var end = start.Add(TimeSpan.FromMinutes(durationMinutes));
                cmd.Parameters.Add(SqlParameterHelper.Param($"@Start{s}", start));
                cmd.Parameters.Add(SqlParameterHelper.Param($"@End{s}", end));
            }
            total += await ExecuteNonQueryAsync(cmd);
        }
        return total;
    }

    public async Task<int> DeleteFutureUnbookedSlotsForDayAsync(int doctorId, DateTime date)
    {
        await using var cmd = await CreateTextCommandAsync("DELETE FROM Slots WHERE DoctorId=@DoctorId AND SlotDate=@Date AND IsBooked=0");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Date", date.Date));
        return await ExecuteNonQueryAsync(cmd);
    }

    public async Task<bool> UpdateSlotTimeAsync(int slotId, TimeSpan newStart, TimeSpan newEnd)
    {
        await using var cmd = await CreateTextCommandAsync("""
UPDATE Slots SET StartTime=@Start, EndTime=@End
WHERE SlotId=@SlotId
  AND NOT EXISTS (SELECT 1 FROM Appointments WHERE SlotId=@SlotId AND Status='Booked')
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotId", slotId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Start", newStart));
        cmd.Parameters.Add(SqlParameterHelper.Param("@End", newEnd));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<List<SlotRow>> GetDaySlotsAsync(int doctorId, DateTime date, int excludeSlotId)
    {
        await using var cmd = await CreateTextCommandAsync("""
SELECT SlotId, DoctorId, SlotDate, StartTime, EndTime, IsBooked
FROM Slots
WHERE DoctorId=@DoctorId AND SlotDate=@Date AND SlotId!=@ExcludeSlotId
ORDER BY StartTime
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Date", date.Date));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ExcludeSlotId", excludeSlotId));
        return await ReadListAsync(cmd, r => new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")));
    }

    public async Task<SlotRow?> EnsureSlotAsync(int doctorId, DateTime date, TimeSpan startTime, int durationMinutes)
    {
        var endTime = startTime.Add(TimeSpan.FromMinutes(durationMinutes));

        await using var checkCmd = await CreateTextCommandAsync("SELECT SlotId, DoctorId, SlotDate, StartTime, EndTime, IsBooked FROM Slots WHERE DoctorId=@DoctorId AND SlotDate=@Date AND StartTime=@StartTime");
        checkCmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        checkCmd.Parameters.Add(SqlParameterHelper.Param("@Date", date.Date));
        checkCmd.Parameters.Add(SqlParameterHelper.Param("@StartTime", startTime));
        var existing = (await ReadListAsync(checkCmd, r => new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")))).FirstOrDefault();
        if (existing != null) return existing;

        await using var insertCmd = await CreateTextCommandAsync("INSERT INTO Slots(DoctorId, SlotDate, StartTime, EndTime, IsBooked) OUTPUT INSERTED.SlotId, INSERTED.DoctorId, INSERTED.SlotDate, INSERTED.StartTime, INSERTED.EndTime, INSERTED.IsBooked VALUES(@DoctorId, @Date, @StartTime, @EndTime, 0)");
        insertCmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        insertCmd.Parameters.Add(SqlParameterHelper.Param("@Date", date.Date));
        insertCmd.Parameters.Add(SqlParameterHelper.Param("@StartTime", startTime));
        insertCmd.Parameters.Add(SqlParameterHelper.Param("@EndTime", endTime));
        return (await ReadListAsync(insertCmd, r => new SlotRow(r.Int("SlotId"), r.Int("DoctorId"), r.Date("SlotDate"), r.Time("StartTime"), r.Time("EndTime"), r.Bool("IsBooked")))).FirstOrDefault();
    }

    public async Task<int> RemoveBreakSlotsAsync(int doctorId, DateTime startDate, DateTime endDate, TimeSpan breakStart, TimeSpan breakEnd)
    {
        await using var cmd = await CreateTextCommandAsync("""
DELETE FROM Slots
WHERE DoctorId=@DoctorId
  AND SlotDate BETWEEN @StartDate AND @EndDate
  AND IsBooked=0
  AND StartTime < @BreakEnd
  AND EndTime > @BreakStart
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartDate", startDate));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndDate", endDate));
        cmd.Parameters.Add(SqlParameterHelper.Param("@BreakStart", breakStart));
        cmd.Parameters.Add(SqlParameterHelper.Param("@BreakEnd", breakEnd));
        return await ExecuteNonQueryAsync(cmd);
    }
}
