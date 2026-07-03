using Microsoft.Data.SqlClient;
using System.Data;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Shared.Interfaces;
using HospitalManagementSystem.Shared.Exceptions;

namespace HospitalManagementSystem.Shared.Repositories;

public abstract class GenericRepository<T> : IRepository<T>
{
    protected readonly DbConnectionFactory ConnectionFactory;
    protected GenericRepository(DbConnectionFactory connectionFactory) => ConnectionFactory = connectionFactory;

    public virtual Task<int> AddAsync(T entity) => throw new NotSupportedException("Use entity-specific stored procedure repository method.");
    public virtual Task<bool> DeleteAsync(int id) => throw new NotSupportedException("Use entity-specific stored procedure repository method.");
    public virtual Task<IReadOnlyList<T>> GetAllAsync() => throw new NotSupportedException("Use entity-specific stored procedure repository method.");
    public virtual Task<T?> GetByIdAsync(int id) => throw new NotSupportedException("Use entity-specific stored procedure repository method.");
    public virtual Task<bool> UpdateAsync(T entity) => throw new NotSupportedException("Use entity-specific stored procedure repository method.");

    protected async Task<SqlCommand> CreateStoredProcedureCommandAsync(string storedProcedureName)
    {
        var connection = await ConnectionFactory.CreateOpenConnectionAsync();
        return new SqlCommand(storedProcedureName, connection) { CommandType = CommandType.StoredProcedure };
    }

    protected async Task<SqlCommand> CreateTextCommandAsync(string query)
    {
        var connection = await ConnectionFactory.CreateOpenConnectionAsync();
        return new SqlCommand(query, connection) { CommandType = CommandType.Text };
    }

    protected static async Task<List<TResult>> ReadListAsync<TResult>(SqlCommand command, Func<SqlDataReader, TResult> map)
    {
        try
        {
            await using var connection = command.Connection;
            await using var reader = await command.ExecuteReaderAsync();
            var list = new List<TResult>();
            while (await reader.ReadAsync()) list.Add(map(reader));
            return list;
        }
        catch (SqlException ex) { throw new DataAccessException("Database operation failed.", ex); }
    }

    protected static async Task<int> ExecuteNonQueryAsync(SqlCommand command)
    {
        try { await using var connection = command.Connection; return await command.ExecuteNonQueryAsync(); }
        catch (SqlException ex) { throw new DataAccessException("Database operation failed.", ex); }
    }

    protected static async Task<object?> ExecuteScalarAsync(SqlCommand command)
    {
        try { await using var connection = command.Connection; return await command.ExecuteScalarAsync(); }
        catch (SqlException ex) { throw new DataAccessException("Database operation failed.", ex); }
    }
}
