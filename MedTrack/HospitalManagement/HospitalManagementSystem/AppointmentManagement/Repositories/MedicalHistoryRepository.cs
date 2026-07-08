using HospitalManagementSystem.AppointmentManagement.Models;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.AppointmentManagement.Repositories;

public class MedicalHistoryRepository : GenericRepository<MedicalHistory>
{
    public MedicalHistoryRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<List<MedicalHistoryRow>> GetPatientHistoryAsync(int patientId)
    {
        await using var cmd = await CreateTextCommandAsync("SELECT * FROM vw_PatientMedicalHistory WHERE PatientId=@PatientId ORDER BY AppointmentDate DESC");
        cmd.Parameters.Add(SqlParameterHelper.Param("@PatientId", patientId));
        return await ReadListAsync(cmd, r => new MedicalHistoryRow(r.Int("HistoryId"), r.Int("AppointmentId"), r.Str("AppointmentNumber"), r.Date("AppointmentDate"), r.Str("DoctorName"), r.Str("DepartmentName"), r.Str("Diagnosis"), r.Str("ClinicalNotes"), r.Str("MedicineName"), r.Str("Dosage"), r.Str("Frequency"), r.Int("DurationDays"), r.Str("Instructions")));
    }
}
