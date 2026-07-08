using HospitalManagementSystem.AuditManagement.Repositories;

namespace HospitalManagementSystem.AuditManagement.Services;
public class AuditLogService
{
    private readonly AuditLogRepository _repository;
    public AuditLogService(AuditLogRepository repository) => _repository = repository;
    public async Task LogAsync(int userId, string action, string entity, int? entityId, string description)
    {
        try { await _repository.AddAsync(userId, action, entity, entityId, description); } catch { }
    }
}
