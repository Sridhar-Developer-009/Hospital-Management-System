using HospitalManagementSystem.AppointmentManagement.Models;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.Shared.Repositories;
namespace HospitalManagementSystem.AppointmentManagement.Repositories;
public class HolidayRepository : GenericRepository<HospitalHoliday>
{
    public HolidayRepository(DbConnectionFactory factory) : base(factory) { }

    public async Task<(int CancelledAppointments, int ReleasedSlots)> DeclareWithCascadeAsync(DateTime date, string name, string description)
    {
        await using var cmd = await CreateStoredProcedureCommandAsync(StoredProcedureNames.DeclareHolidayWithCascade);
        cmd.Parameters.Add(SqlParameterHelper.Param("@HolidayDate", date));
        cmd.Parameters.Add(SqlParameterHelper.Param("@HolidayName", name));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Description", (object?)description ?? DBNull.Value));
        var rows = await ReadListAsync(cmd, r => (r.Int("CancelledAppointmentCount"), r.Int("ReleasedSlotCount")));
        var first = rows.FirstOrDefault();
        return first == default ? (0, 0) : first;
    }

    public async Task DeclareAsync(DateTime date, string name, string description)
    {
        await using var cmd = await CreateTextCommandAsync("""
DECLARE @TableName sysname =
    CASE
        WHEN OBJECT_ID('HospitalHolidays', 'U') IS NOT NULL THEN 'HospitalHolidays'
        WHEN OBJECT_ID('HospitalHoliday', 'U') IS NOT NULL THEN 'HospitalHoliday'
        ELSE NULL
    END;

IF @TableName IS NULL
    THROW 51000, 'Holiday table was not found in the HMS database.', 1;

DECLARE @Columns nvarchar(max) = N'HolidayDate';
DECLARE @Values nvarchar(max) = N'@HolidayDate';

IF COL_LENGTH(@TableName, 'HolidayName') IS NOT NULL
BEGIN
    SET @Columns += N', HolidayName';
    SET @Values += N', @HolidayName';
END
ELSE IF COL_LENGTH(@TableName, 'HolidayTitle') IS NOT NULL
BEGIN
    SET @Columns += N', HolidayTitle';
    SET @Values += N', @HolidayName';
END;

IF COL_LENGTH(@TableName, 'Description') IS NOT NULL
BEGIN
    SET @Columns += N', Description';
    SET @Values += N', @Description';
END
ELSE IF COL_LENGTH(@TableName, 'Reason') IS NOT NULL
BEGIN
    SET @Columns += N', Reason';
    SET @Values += N', @Description';
END;

IF COL_LENGTH(@TableName, 'IsActive') IS NOT NULL
BEGIN
    SET @Columns += N', IsActive';
    SET @Values += N', 1';
END;

IF COL_LENGTH(@TableName, 'CreatedDate') IS NOT NULL
BEGIN
    SET @Columns += N', CreatedDate';
    SET @Values += N', GETDATE()';
END;

DECLARE @Sql nvarchar(max) = N'INSERT INTO ' + QUOTENAME(@TableName) + N' (' + @Columns + N') VALUES (' + @Values + N')';
EXEC sp_executesql @Sql, N'@HolidayDate date, @HolidayName nvarchar(200), @Description nvarchar(500)', @HolidayDate, @HolidayName, @Description;
""");
        cmd.Parameters.Add(SqlParameterHelper.Param("@HolidayDate", date));
        cmd.Parameters.Add(SqlParameterHelper.Param("@HolidayName", name));
        cmd.Parameters.Add(SqlParameterHelper.Param("@Description", description));
        await ExecuteNonQueryAsync(cmd);
    }
}
