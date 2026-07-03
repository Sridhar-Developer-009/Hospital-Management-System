using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.Shared.Services;
using HospitalManagementSystem.Shared.Utilities;
using HospitalManagementSystem.UserManagement.Menus;

try
{
    ConsoleManager.Initialize();
    try { await StartupAnimationService.PlayAsync(); } catch { /* skip animation in non-interactive terminals */ }
    var factory = new DbConnectionFactory();
    await DemoPasswordSeeder.EnsureDemoPasswordsAsync(factory);
    var loginMenu = new LoginMenu(factory);
    await loginMenu.ShowRootAsync();
    Console.WriteLine("Thank you for using Hospital Management System.");
}
catch (Exception ex)
{
    Logger.Error("Unhandled application error", ex);
    Console.WriteLine("Something went wrong. Please restart the application and try again.");
}
