using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.DoctorManagement.Models;
using HospitalManagementSystem.Shared.Repositories;
namespace HospitalManagementSystem.DoctorManagement.Repositories;
public class ShiftRepository : GenericRepository<DoctorShift>
{
    public ShiftRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<List<DoctorShift>> GetByDoctorAsync(int doctorId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT ShiftId, DoctorId, ShiftName, StartTime, EndTime, SlotDurationMinutes, IsActive FROM DoctorShifts WHERE DoctorId = @DoctorId AND IsActive = 1");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        return await ReadListAsync(cmd, r => new DoctorShift
        {
            ShiftId = r.Int("ShiftId"),
            DoctorId = r.Int("DoctorId"),
            ShiftName = r.Str("ShiftName"),
            StartTime = r.Time("StartTime"),
            EndTime = r.Time("EndTime"),
            SlotDurationMinutes = r.Int("SlotDurationMinutes"),
            IsActive = r.Bool("IsActive")
        });
    }

    public override async Task<int> AddAsync(DoctorShift shift)
    {
        await using var cmd = await CreateTextCommandAsync("INSERT INTO DoctorShifts(DoctorId, ShiftName, StartTime, EndTime, SlotDurationMinutes) VALUES(@DoctorId,@ShiftName,@StartTime,@EndTime,@SlotDurationMinutes); SELECT CAST(SCOPE_IDENTITY() AS int);");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", shift.DoctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ShiftName", shift.ShiftName));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartTime", shift.StartTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndTime", shift.EndTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotDurationMinutes", shift.SlotDurationMinutes));
        return Convert.ToInt32(await ExecuteScalarAsync(cmd));
    }

    public override async Task<bool> UpdateAsync(DoctorShift shift)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE DoctorShifts SET ShiftName=@ShiftName, StartTime=@StartTime, EndTime=@EndTime, SlotDurationMinutes=@SlotDurationMinutes, ModifiedDate=GETDATE() WHERE ShiftId=@ShiftId AND DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@ShiftName", shift.ShiftName));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartTime", shift.StartTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndTime", shift.EndTime));
        cmd.Parameters.Add(SqlParameterHelper.Param("@SlotDurationMinutes", shift.SlotDurationMinutes));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ShiftId", shift.ShiftId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", shift.DoctorId));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }
}
