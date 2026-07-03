using Microsoft.Data.SqlClient;

namespace HospitalManagementSystem.Database.Helpers;

public static class DataReaderExtensions
{
    public static bool HasColumn(this SqlDataReader reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
    public static string Str(this SqlDataReader r, string name) => r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)) ? Convert.ToString(r[name]) ?? string.Empty : string.Empty;
    public static int Int(this SqlDataReader r, string name) => r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)) ? Convert.ToInt32(r[name]) : 0;
    public static bool Bool(this SqlDataReader r, string name) => r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)) && Convert.ToBoolean(r[name]);
    public static DateTime Date(this SqlDataReader r, string name) => r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)) ? Convert.ToDateTime(r[name]) : DateTime.MinValue;
    public static TimeSpan Time(this SqlDataReader r, string name) => r.HasColumn(name) && !r.IsDBNull(r.GetOrdinal(name)) ? (TimeSpan)r[name] : TimeSpan.Zero;
}
