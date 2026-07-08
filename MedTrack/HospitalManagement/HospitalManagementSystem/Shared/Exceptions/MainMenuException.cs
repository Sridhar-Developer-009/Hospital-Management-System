namespace HospitalManagementSystem.Shared.Exceptions;

/// <summary>
/// Internal control-flow exception used by console input screens.
/// Typing # in any input prompt navigates to the role Home/Dashboard.
/// </summary>
public sealed class MainMenuException : Exception
{
    public MainMenuException() : base("User requested to return to the role home dashboard.") { }
}
