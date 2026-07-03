using HospitalManagementSystem.Database.Connection;
using Microsoft.Data.SqlClient;

namespace HospitalManagementSystem.Dashboards;

public class DashboardService
{
    private readonly DbConnectionFactory _factory;
    public DashboardService(DbConnectionFactory factory) => _factory = factory;

    public async Task<AdminDashboardMetrics> GetAdminMetricsAsync()
    {
        await using var c = await _factory.CreateOpenConnectionAsync();
        return new AdminDashboardMetrics
        {
            ActiveDepartments = await ScalarAsync(c, "SELECT COUNT(*) FROM Departments WHERE IsActive=1"),
            RegisteredPatients = await ScalarAsync(c, "SELECT COUNT(*) FROM Patients WHERE IsActive=1"),
            TotalActiveDoctors = await ScalarAsync(c, "SELECT COUNT(*) FROM Doctors WHERE IsActive=1"),
            Scheduled = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE Status='Booked'"),
            Completed = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE Status='Completed'"),
            NoShows = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE Status='NoShow'"),
            Cancelled = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE Status='Cancelled'")
        };
    }

    public async Task<DoctorDashboardMetrics> GetDoctorMetricsAsync(int doctorId)
    {
        await using var c = await _factory.CreateOpenConnectionAsync();
        return new DoctorDashboardMetrics
        {
            PendingConsultations = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE DoctorId=@DoctorId AND AppointmentDate=CAST(GETDATE() AS DATE) AND Status='Booked'", ("@DoctorId", doctorId)),
            CompletedTreatments = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE DoctorId=@DoctorId AND AppointmentDate=CAST(GETDATE() AS DATE) AND Status='Completed'", ("@DoctorId", doctorId)),
            UnresolvedNoShows = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE DoctorId=@DoctorId AND AppointmentDate=CAST(GETDATE() AS DATE) AND Status='NoShow'", ("@DoctorId", doctorId)),
            ActiveProfileStatus = (await ScalarAsync(c, "SELECT COUNT(*) FROM Doctors WHERE DoctorId=@DoctorId AND IsActive=1", ("@DoctorId", doctorId))) > 0 ? "ACTIVE" : "INACTIVE"
        };
    }

    public async Task<PatientDashboardMetrics> GetPatientMetricsAsync(int patientId)
    {
        await using var c = await _factory.CreateOpenConnectionAsync();
        return new PatientDashboardMetrics
        {
            ScheduledUpcomingBookings = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE PatientId=@PatientId AND Status='Booked' AND AppointmentDate>=CAST(GETDATE() AS DATE)", ("@PatientId", patientId)),
            PastCompletedVisits = await ScalarAsync(c, "SELECT COUNT(*) FROM Appointments WHERE PatientId=@PatientId AND Status='Completed'", ("@PatientId", patientId)),
            AccountStatus = (await ScalarAsync(c, "SELECT COUNT(*) FROM Patients WHERE PatientId=@PatientId AND IsActive=1", ("@PatientId", patientId))) > 0 ? "ACTIVE" : "INACTIVE"
        };
    }

    private static async Task<int> ScalarAsync(SqlConnection c, string sql, params (string, object)[] parameters)
    {
        await using var cmd = new SqlCommand(sql, c);
        foreach (var (name, value) in parameters) cmd.Parameters.AddWithValue(name, value);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
