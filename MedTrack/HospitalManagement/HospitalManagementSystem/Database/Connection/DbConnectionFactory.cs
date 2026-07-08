using Microsoft.Data.SqlClient;
using HospitalManagementSystem.Shared.Constants;

namespace HospitalManagementSystem.Database.Connection;

public sealed class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(string? connectionString = null)
    {
        _connectionString = connectionString
            ?? Environment.GetEnvironmentVariable("HMS_CONNECTION_STRING")
            ?? ApplicationConstants.DEFAULT_CONNECTION_STRING;
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync()
    {
        var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqlCommand("SET QUOTED_IDENTIFIER ON;", connection);
        await cmd.ExecuteNonQueryAsync();
        return connection;
    }
}
