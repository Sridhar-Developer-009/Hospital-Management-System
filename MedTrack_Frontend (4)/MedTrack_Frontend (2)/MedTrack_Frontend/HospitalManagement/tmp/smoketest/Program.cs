using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.Dashboards;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.NotificationManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Repositories;
using HospitalManagementSystem.ReportManagement.Services;
using HospitalManagementSystem.UserManagement.DTOs;
using HospitalManagementSystem.UserManagement.Repositories;
using HospitalManagementSystem.UserManagement.Services;

var factory = new DbConnectionFactory();
var checks = new List<(string Name, Func<Task> Run)>
{
    ("Database opens", async () =>
    {
        await using var connection = await factory.CreateOpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT DB_NAME()";
        var dbName = Convert.ToString(await command.ExecuteScalarAsync());
        Require(dbName == "HMS_DB", $"Expected HMS_DB, got {dbName}");
    }),
    ("Admin login", () => LoginAsync("admin_root", "Admin@123", "Admin")),
    ("Doctor login", () => LoginAsync("dr_arvind", "Doctor@123", "Doctor")),
    ("Patient login", () => LoginAsync("sridhar_v", "Patient@123", "Patient")),
    ("Admin dashboard metrics", async () =>
    {
        var metrics = await new DashboardService(factory).GetAdminMetricsAsync();
        Require(metrics.ActiveDepartments >= 0, "Metrics did not load.");
    }),
    ("Doctor repository list", async () =>
    {
        var doctors = await new DoctorRepository(factory).GetAllDoctorRowsAsync();
        Require(doctors.Count > 0, "No doctors returned.");
    }),
    ("Department lookup", async () =>
    {
        var departments = await new DoctorRepository(factory).GetDepartmentsAsync();
        Require(departments.Count > 0, "No departments returned.");
    }),
    ("Patient repository list", async () =>
    {
        var patients = await new PatientRepository(factory).GetAllPatientRowsAsync();
        Require(patients.Count > 0, "No patients returned.");
    }),
    ("Appointment oversight list", async () =>
    {
        _ = await new AppointmentRepository(factory).GetAllForAdminAsync();
    }),
    ("Notification log list", async () =>
    {
        _ = await new NotificationRepository(factory).GetRecentAsync(10);
    }),
    ("Reports execute", async () =>
    {
        var reportService = new ReportService(factory);
        _ = await reportService.ExecuteReportAsync(
            HospitalManagementSystem.Database.StoredProcedures.StoredProcedureNames.DailyAppointmentReport,
            DateTime.Today.AddDays(-30),
            DateTime.Today.AddDays(30));
    })
};

var failed = 0;
foreach (var check in checks)
{
    try
    {
        await check.Run();
        Console.WriteLine($"PASS {check.Name}");
    }
    catch (Exception exception)
    {
        failed++;
        Console.WriteLine($"FAIL {check.Name}");
        Console.WriteLine($"     {exception.GetBaseException().Message}");
    }
}

Console.WriteLine();
Console.WriteLine(failed == 0 ? "SMOKE TEST PASSED" : $"SMOKE TEST FAILED: {failed} check(s)");
return failed == 0 ? 0 : 1;

async Task LoginAsync(string username, string password, string role)
{
    var auth = new AuthenticationService(new UserRepository(factory));
    var user = await auth.LoginAsync(new LoginRequest { Username = username, Password = password }, role);
    Require(user.IsAuthenticated, $"{username} was not authenticated.");
    Require(user.RoleName.Equals(role, StringComparison.OrdinalIgnoreCase), $"{username} role mismatch.");
}

static void Require(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}
