namespace HospitalManagementSystem.AppointmentManagement.Events;
public sealed class AppointmentCompletedEvent : EventArgs
{
    public AppointmentCompletedEvent(int appointmentId, string appointmentNumber, int historyId, string triggeredBy = "Doctor") { AppointmentId = appointmentId; AppointmentNumber = appointmentNumber; HistoryId = historyId; TriggeredBy = triggeredBy; }
    public int AppointmentId { get; }
    public string AppointmentNumber { get; }
    public int HistoryId { get; }
    public string TriggeredBy { get; }
}
