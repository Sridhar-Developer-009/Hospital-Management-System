using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.Shared.Repositories;
using HospitalManagementSystem.UserManagement.DTOs;
using HospitalManagementSystem.UserManagement.Models;

namespace HospitalManagementSystem.UserManagement.Repositories;

public class UserRepository : GenericRepository<User>
{
    public UserRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<LoginResponse?> LoginAsync(string username)
    {
        await using var command = await CreateStoredProcedureCommandAsync(StoredProcedureNames.Login);
        command.Parameters.Add(SqlParameterHelper.Param("@Username", username));

        var users = await ReadListAsync(command, r => new LoginResponse
        {
            UserId = r.Int("UserId"),
            Username = r.Str("Username"),
            PasswordHash = r.Str("PasswordHash"),
            RoleName = r.Str("RoleName"),
            IsAuthenticated = false
        });
        var response = users.FirstOrDefault();
        if (response == null) return null;

        await HydrateRoleProfileAsync(response);
        return response;
    }

    private async Task HydrateRoleProfileAsync(LoginResponse response)
    {
        if (response.RoleName.Equals("Doctor", StringComparison.OrdinalIgnoreCase))
        {
            await using var cmd = await CreateTextCommandAsync("SELECT DoctorId, DoctorCode, DoctorName, DepartmentName FROM vw_DoctorDetails WHERE UserId=@UserId AND IsActive=1");
            cmd.Parameters.Add(SqlParameterHelper.Param("@UserId", response.UserId));
            var list = await ReadListAsync(cmd, r => new { DoctorId = r.Int("DoctorId"), Code = r.Str("DoctorCode"), Name = r.Str("DoctorName"), Dept = r.Str("DepartmentName") });
            var d = list.FirstOrDefault();
            if (d != null) { response.DoctorId = d.DoctorId; response.CodeOrUhid = d.Code; response.DisplayName = d.Name; response.DepartmentName = d.Dept; }
        }
        else if (response.RoleName.Equals("Patient", StringComparison.OrdinalIgnoreCase))
        {
            await using var cmd = await CreateTextCommandAsync("SELECT PatientId, UHID, PatientName FROM vw_PatientDetails WHERE UserId=@UserId AND IsActive=1");
            cmd.Parameters.Add(SqlParameterHelper.Param("@UserId", response.UserId));
            var list = await ReadListAsync(cmd, r => new { PatientId = r.Int("PatientId"), UHID = r.Str("UHID"), Name = r.Str("PatientName") });
            var p = list.FirstOrDefault();
            if (p != null) { response.PatientId = p.PatientId; response.CodeOrUhid = p.UHID; response.DisplayName = p.Name; }
        }
        else
        {
            response.DisplayName = "System Administrator";
        }
    }
}
