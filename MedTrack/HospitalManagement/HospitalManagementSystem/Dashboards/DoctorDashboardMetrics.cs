namespace HospitalManagementSystem.Dashboards;
public class DoctorDashboardMetrics
{
    public int PendingConsultations { get; set; }
    public int CompletedTreatments { get; set; }
    public int UnresolvedNoShows { get; set; }
    public string ActiveProfileStatus { get; set; } = "ACTIVE";
}
