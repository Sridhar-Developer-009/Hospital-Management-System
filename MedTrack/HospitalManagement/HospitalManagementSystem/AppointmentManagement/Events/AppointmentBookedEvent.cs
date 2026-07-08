namespace HospitalManagementSystem.AppointmentManagement.Events;
public sealed class AppointmentBookedEvent : EventArgs
{
    public AppointmentBookedEvent(int appointmentId, string appointmentNumber, string patientName, string triggeredBy = "Patient") { AppointmentId = appointmentId; AppointmentNumber = appointmentNumber; PatientName = patientName; TriggeredBy = triggeredBy; }
    public int AppointmentId { get; }
    public string AppointmentNumber { get; }
    public string PatientName { get; }
    public string TriggeredBy { get; }
}
