namespace HospitalManagementSystem.NotificationManagement.Events;
public delegate Task NotificationSentHandler(object sender, NotificationSentEventArgs args);
public class NotificationSentEventArgs : EventArgs
{
    public int NotificationId { get; init; }
    public string Recipient { get; init; } = string.Empty;
    public bool IsSuccess { get; init; }
}
