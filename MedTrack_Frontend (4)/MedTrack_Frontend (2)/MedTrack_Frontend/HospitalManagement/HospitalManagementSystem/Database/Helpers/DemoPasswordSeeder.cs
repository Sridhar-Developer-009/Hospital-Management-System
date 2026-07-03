using Microsoft.Data.SqlClient;
using HospitalManagementSystem.Database.Connection;

namespace HospitalManagementSystem.Database.Helpers;

public static class DemoPasswordSeeder
{
    private static string GetPassword(string envVar, string fallback)
        => Environment.GetEnvironmentVariable(envVar) ?? fallback;

    public static async Task EnsureDemoPasswordsAsync(DbConnectionFactory factory)
    {
        try
        {
            await using var connection = await factory.CreateOpenConnectionAsync();
            await FixAsync(connection, "admin_root", GetPassword("HMS_DEMO_ADMIN_PASSWORD", "Admin@123"));
            await FixAsync(connection, "dr_arvind", GetPassword("HMS_DEMO_DOCTOR_PASSWORD", "Doctor@123"));
            await FixAsync(connection, "sridhar_v", GetPassword("HMS_DEMO_PATIENT_PASSWORD", "Patient@123"));
        }
        catch
        {
            // Do not block application startup. Login screen will show DB errors if DB is unavailable.
        }
    }

    private static async Task FixAsync(SqlConnection connection, string username, string password)
    {
        const string selectSql = "SELECT PasswordHash FROM Users WHERE Username=@Username";
        await using var select = new SqlCommand(selectSql, connection);
        select.Parameters.AddWithValue("@Username", username);
        var current = Convert.ToString(await select.ExecuteScalarAsync()) ?? string.Empty;
        if (current != "DEMO_HASH_REPLACE_FROM_CSHARP") return;

        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        const string updateSql = "UPDATE Users SET PasswordHash=@PasswordHash, ModifiedDate=GETDATE() WHERE Username=@Username";
        await using var update = new SqlCommand(updateSql, connection);
        update.Parameters.AddWithValue("@PasswordHash", hash);
        update.Parameters.AddWithValue("@Username", username);
        await update.ExecuteNonQueryAsync();
    }
}
