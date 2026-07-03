namespace HospitalManagementSystem.Dashboards;
public class AdminDashboardMetrics
{
    public int ActiveDepartments { get; set; }
    public int RegisteredPatients { get; set; }
    public int TotalActiveDoctors { get; set; }
    public int Scheduled { get; set; }
    public int Completed { get; set; }
    public int NoShows { get; set; }
    public int Cancelled { get; set; }
}
