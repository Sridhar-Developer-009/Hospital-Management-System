namespace HospitalManagementSystem.Shared.Exceptions;

/// <summary>
/// Internal control-flow exception used by console input screens.
/// Typing 0 in any data-entry prompt returns to the previous menu without crashing.
/// </summary>
public sealed class MenuBackException : Exception
{
    public MenuBackException() : base("User requested to go back to the previous menu.") { }
}
