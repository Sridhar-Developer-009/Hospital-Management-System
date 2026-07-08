using HospitalManagementSystem.NotificationManagement.Repositories;

namespace HospitalManagementSystem.NotificationManagement.Services;
public class NotificationService
{
    private readonly NotificationRepository _repository;
    public NotificationService(NotificationRepository repository) => _repository = repository;
    public async Task NotifyAsync(int appointmentId, string recipient, string message, string triggeredBy = "System", string category = "SystemAlert")
    {
        await _repository.AddAsync(appointmentId, recipient, triggeredBy, message, category);
    }
}
