using Microsoft.Data.SqlClient;
namespace HospitalManagementSystem.Database.Helpers;
public static class SqlParameterHelper
{
    public static SqlParameter Param(string name, object? value) => new(name, value ?? DBNull.Value);
    public static SqlParameter Output(string name, System.Data.SqlDbType type, int size = 0)
    {
        var parameter = size > 0 ? new SqlParameter(name, type, size) : new SqlParameter(name, type);
        parameter.Direction = System.Data.ParameterDirection.Output;
        return parameter;
    }
}
