using HospitalManagementSystem.AuditManagement.Models;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Shared.Repositories;

namespace HospitalManagementSystem.AuditManagement.Repositories;

public class AuditLogRepository : GenericRepository<AuditLog>
{
    public AuditLogRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task AddAsync(int userId, string actionType, string entityName, int? entityId, string description)
    {
        await using var cmd = await CreateTextCommandAsync("INSERT INTO AuditLogs(UserId, ActionType, EntityName, EntityId, Description) VALUES(@UserId,@ActionType,@EntityName,@EntityId,@Description)");
        cmd.Parameters.Add(SqlParameterHelper.Param("@UserId", userId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@ActionType", actionType));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EntityName", entityName));
        cmd.Parameters.Add(SqlParameterHelper.Param("@EntityId", entityId));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Description", description));
        await ExecuteNonQueryAsync(cmd);
    }
}
