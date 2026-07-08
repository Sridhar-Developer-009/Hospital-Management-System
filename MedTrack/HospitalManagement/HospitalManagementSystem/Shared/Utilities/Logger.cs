namespace HospitalManagementSystem.Shared.Utilities;

public static class Logger
{
    public static void Info(string message) => Write("INFO", message, null);
    public static void Error(string message, Exception? ex = null) => Write("ERROR", message, ex);

    private static void Write(string level, string message, Exception? ex)
    {
        try
        {
            Directory.CreateDirectory("Logs");
            var line = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} [{level}] {message} {ex}\n";
            File.AppendAllText(Path.Combine("Logs", "hms.log"), line);
        }
        catch { }
    }
}
