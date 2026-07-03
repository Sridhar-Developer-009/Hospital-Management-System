namespace HospitalManagementSystem.AppointmentManagement.Events;

public sealed class AppointmentNoShowEvent : EventArgs
{
    public AppointmentNoShowEvent(int appointmentId, string appointmentNumber, string triggeredBy = "Doctor")
    {
        AppointmentId = appointmentId;
        AppointmentNumber = appointmentNumber;
        TriggeredBy = triggeredBy;
    }

    public int AppointmentId { get; }
    public string AppointmentNumber { get; }
    public string TriggeredBy { get; }
}
