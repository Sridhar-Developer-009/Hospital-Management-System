using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using Microsoft.Data.SqlClient;
using System.Data;

namespace HospitalManagementSystem.ReportManagement.Services;

public class ReportService
{
    private readonly DbConnectionFactory _factory;
    public ReportService(DbConnectionFactory factory) => _factory = factory;

    public async Task<ReportResult> ExecuteReportAsync(string procedureName, DateTime from, DateTime to)
    {
        await using var connection = await _factory.CreateOpenConnectionAsync();
        await using var cmd = new SqlCommand(procedureName, connection) { CommandType = CommandType.StoredProcedure };
        if (procedureName == StoredProcedureNames.DailyAppointmentReport) cmd.Parameters.Add(SqlParameterHelper.Param("@ReportDate", from));
        else { cmd.Parameters.Add(SqlParameterHelper.Param("@FromDate", from)); cmd.Parameters.Add(SqlParameterHelper.Param("@ToDate", to)); }
        await using var reader = await cmd.ExecuteReaderAsync();

        // Capture real column names from the schema
        var headers = new string[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++) headers[i] = reader.GetName(i);

        var rows = new List<string[]>();
        while (await reader.ReadAsync())
        {
            var arr = new string[reader.FieldCount];
            for (int i = 0; i < reader.FieldCount; i++) arr[i] = Convert.ToString(reader.GetValue(i)) ?? string.Empty;
            rows.Add(arr);
        }
        return new ReportResult(headers, rows);
    }
}

public record ReportResult(string[] Headers, List<string[]> Rows);
