namespace HospitalManagementSystem.Dashboards;
public class PatientDashboardMetrics
{
    public int ScheduledUpcomingBookings { get; set; }
    public int PastCompletedVisits { get; set; }
    public string AccountStatus { get; set; } = "ACTIVE";
}
