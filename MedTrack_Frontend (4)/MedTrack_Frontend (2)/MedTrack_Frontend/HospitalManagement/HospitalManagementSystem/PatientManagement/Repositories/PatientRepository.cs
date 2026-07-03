using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.PatientManagement.Models;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.PatientManagement.Repositories;

public class PatientRepository : GenericRepository<Patient>
{
    public PatientRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<(int PatientId, string UHID)> RegisterPatientAsync(string name, string gender, DateTime dob, string email, string phone, string address, string bloodGroup, string emergency, string username, string passwordHash)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.RegisterPatient);
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientName", name));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Gender", gender));
        cmd.Parameters.Add(SqlParameterHelper.Param("@DateOfBirth", dob));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Email", email));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Phone", phone));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Address", address));
        cmd.Parameters.Add(SqlParameterHelper.Param("@BloodGroup", bloodGroup));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EmergencyContact", emergency));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Username", username));
        cmd.Parameters.Add(SqlParameterHelper.Param("@PasswordHash", passwordHash));
        var list = await ReadListAsync(cmd, r => (r.Int("PatientId"), r.Str("UHID")));
        return list.Count == 0 ? (0, string.Empty) : list.First();
    }

    public async Task<PatientRow?> GetByUhidAsync(string uhid)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.GetPatientByUHID);
        cmd.Parameters.Add(SqlParameterHelper.Param("@UHID", uhid));
        return (await ReadListAsync(cmd, Map)).FirstOrDefault();
    }

    public async Task<PatientRow?> GetByPhoneAsync(string phone)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_PatientDetails WHERE Phone=@Phone");
        cmd.Parameters.Add(SqlParameterHelper.Param("@Phone", phone));
        return (await ReadListAsync(cmd, Map)).FirstOrDefault();
    }

    public async Task<List<PatientRow>> GetAllPatientRowsAsync()
    {
        await using var cmd = await CreateTextCommandAsync("SELECT PatientId, UHID, PatientName, Gender, DateOfBirth, Email, Phone, Address, BloodGroup, EmergencyContact, IsActive FROM Patients WHERE IsActive = 1 ORDER BY PatientName");
        return await ReadListAsync(cmd, Map);
    }

    public async Task<PatientRow?> GetByIdAsync2(int patientId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_PatientDetails WHERE PatientId=@PatientId");
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
        return (await ReadListAsync(cmd, Map)).FirstOrDefault();
    }

    private static PatientRow Map(Microsoft.Data.SqlClient.SqlDataReader r) => new(
        r.Int("PatientId"), r.Str("UHID"), r.Str("PatientName"), r.Str("Gender"), r.Date("DateOfBirth"), r.Str("Email"), r.Str("Phone"), r.Str("Address"), r.Str("BloodGroup"), r.Str("EmergencyContact"), r.Bool("IsActive"));
}
