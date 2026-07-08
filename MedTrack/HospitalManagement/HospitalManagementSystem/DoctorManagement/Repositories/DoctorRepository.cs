using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.DoctorManagement.Models;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.DoctorManagement.Repositories;

public class DoctorRepository : GenericRepository<Doctor>
{
    public DoctorRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<List<DepartmentRow>> GetDepartmentsAsync()
    {
        await using var cmd = await CreateTextCommandAsync("SELECT DepartmentId, DepartmentName FROM Departments WHERE IsActive=1 ORDER BY DepartmentName");
        return await ReadListAsync(cmd, r => new DepartmentRow(r.Int("DepartmentId"), r.Str("DepartmentName")));
    }

    public async Task<List<DoctorRow>> GetAllDoctorRowsAsync()
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetAllDoctors);
        return await ReadListAsync(cmd, MapDoctor);
    }

    public async Task<DoctorRow?> GetDoctorByIdAsync(int doctorId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetDoctorById);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        return (await ReadListAsync(cmd, MapDoctor)).FirstOrDefault();
    }

    public async Task<int> AddDoctorAsync(string name, int departmentId, string email, string phone, string qualification, int experienceYears, string username, string passwordHash)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.AddDoctor);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorName", name));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DepartmentId", departmentId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Email", email));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Phone", phone));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Qualification", qualification));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ExperienceYears", experienceYears));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Username", username));
        cmd.Parameters.Add(SqlParameterHelper.Param("@PasswordHash", passwordHash));
        var rows = await ReadListAsync(cmd, r => r.Int("DoctorId"));
        return rows.FirstOrDefault();
    }

    public async Task<bool> UpdateDoctorAsync(int doctorId, string name, int departmentId, string email, string phone, string qualification, int experienceYears)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.UpdateDoctor);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorName", name));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DepartmentId", departmentId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Email", email));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Phone", phone));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Qualification", qualification));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ExperienceYears", experienceYears));
        var rows = await ReadListAsync(cmd, r => r.Int("RowsAffected"));
        return rows.FirstOrDefault() > 0;
    }

    public async Task<bool> UpdateDoctorNameAsync(int doctorId, string name)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE Doctors SET DoctorName=@DoctorName, ModifiedDate=GETDATE() WHERE DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorName", name));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<bool> UpdateDoctorDepartmentAsync(int doctorId, int departmentId)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE Doctors SET DepartmentId=@DepartmentId, ModifiedDate=GETDATE() WHERE DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DepartmentId", departmentId));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<bool> UpdateDoctorPhoneAsync(int doctorId, string phone)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE Doctors SET Phone=@Phone, ModifiedDate=GETDATE() WHERE DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Phone", phone));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<bool> UpdateDoctorEmailAsync(int doctorId, string email)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE Doctors SET Email=@Email, ModifiedDate=GETDATE() WHERE DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Email", email));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public async Task<bool> UpdateDoctorStatusAsync(int doctorId, bool isActive)
    {
        await using var cmd = await CreateTextCommandAsync("UPDATE Doctors SET IsActive=@IsActive, ModifiedDate=GETDATE() WHERE DoctorId=@DoctorId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@IsActive", isActive));
        return await ExecuteNonQueryAsync(cmd) > 0;
    }

    public override async Task<bool> DeleteAsync(int doctorId)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.DeleteDoctor);
        cmd.Parameters.Add(SqlParameterHelper.Param("@DoctorId", doctorId));
        await ExecuteNonQueryAsync(cmd);
        return true;
    }

    private static DoctorRow MapDoctor(Microsoft.Data.SqlClient.SqlDataReader r) => new(
        r.Int("DoctorId"), r.Str("DoctorCode"), r.Str("DoctorName"), r.Int("DepartmentId"), r.Str("DepartmentName"), r.Str("Email"), r.Str("Phone"), r.Str("Qualification"), r.Int("ExperienceYears"), r.Bool("IsActive"));
}
