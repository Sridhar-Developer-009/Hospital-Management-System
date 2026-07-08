using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.DoctorManagement.Models;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.DoctorManagement.Repositories;

public class LeaveRepository : GenericRepository<DoctorLeave>
{
    public LeaveRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<int> ApplyAsync(int doctorId, DateTime start, DateTime end, string reason)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.ApplyDoctorLeave);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@StartDate", start));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EndDate", end));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Reason", reason));
        var list = await ReadListAsync(cmd, r => r.Int("LeaveId"));
        return list.FirstOrDefault();
    }

    public async Task<bool> ApproveAsync(int leaveId, int userId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.ApproveDoctorLeave);
        cmd.Parameters.Add(SqlParameterHelper.Param("@LeaveId", leaveId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ApprovedByUserId", userId));
        var rows = await ReadListAsync(cmd, r => r.Int("RowsAffected"));
        return rows.FirstOrDefault() > 0;
    }

    public async Task<bool> RejectAsync(int leaveId, int userId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.RejectDoctorLeave);
        cmd.Parameters.Add(SqlParameterHelper.Param("@LeaveId", leaveId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ApprovedByUserId", userId));
        var rows = await ReadListAsync(cmd, r => r.Int("RowsAffected"));
        return rows.FirstOrDefault() > 0;
    }

    public async Task<List<LeaveRow>> GetByDoctorAsync(int doctorId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT LeaveId, DoctorId, StartDate, EndDate, Reason, Status FROM DoctorLeaves WHERE DoctorId=@DoctorId ORDER BY CreatedDate DESC");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        return await ReadListAsync(cmd, r => new LeaveRow(r.Int("LeaveId"), r.Int("DoctorId"), r.Date("StartDate"), r.Date("EndDate"), r.Str("Reason"), r.Str("Status")));
    }

    public async Task<List<LeaveRow>> GetPendingAsync()
    {
        await using var cmd = await CreateTextCommandAsync("SELECT LeaveId, DoctorId, StartDate, EndDate, Reason, Status FROM DoctorLeaves WHERE Status='Pending' ORDER BY CreatedDate");
        return await ReadListAsync(cmd, r => new LeaveRow(r.Int("LeaveId"), r.Int("DoctorId"), r.Date("StartDate"), r.Date("EndDate"), r.Str("Reason"), r.Str("Status")));
    }
}
