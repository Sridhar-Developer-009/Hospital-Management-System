namespace HospitalManagementSystem.AppointmentManagement.Events;
public sealed class AppointmentCancelledEvent : EventArgs
{
    public AppointmentCancelledEvent(int appointmentId, string appointmentNumber, string triggeredBy = "Patient") { AppointmentId = appointmentId; AppointmentNumber = appointmentNumber; TriggeredBy = triggeredBy; }
    public int AppointmentId { get; }
    public string AppointmentNumber { get; }
    public string TriggeredBy { get; }
}
