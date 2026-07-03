using HospitalManagementSystem.Shared.Utilities;
namespace HospitalManagementSystem.Shared.Services;

public static class StartupAnimationService
{
    public static async Task PlayAsync()
    {
        await Task.CompletedTask;
        ShowBranding();
    }

    private static void ShowBranding()
    {
        ConsoleManager.Clear();

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("============================================================");
        Console.WriteLine("                 HOSPITAL MANAGEMENT SYSTEM                 ");
        Console.WriteLine("============================================================");
        Console.ResetColor();
        Console.WriteLine();
        Console.WriteLine("Console Application");
        Console.WriteLine("Secure - Reliable - Efficient");
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("Care team workspace ready");
        Console.WriteLine("Patient access ready");
        Console.WriteLine("Appointments ready");
        Console.WriteLine("Notifications ready");
        Console.ResetColor();
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Write("Press Enter to continue...");
        Console.ResetColor();
        if (!Console.IsInputRedirected)
        {
            Console.ReadLine();
        }
    }
}
