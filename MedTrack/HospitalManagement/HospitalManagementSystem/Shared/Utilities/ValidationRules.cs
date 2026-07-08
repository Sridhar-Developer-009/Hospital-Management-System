using HospitalManagementSystem.Shared.Constants;

namespace HospitalManagementSystem.Shared.Utilities;

public static class ValidationRules
{
    public static string ForText() => "Text only | Required";
    public static string ForOptional() => "Optional | Press Enter to skip";
    public static string ForName() => "Letters, spaces, dots | 2-100 characters";
    public static string ForPhone() => "10 digits | Starts with 6-9";
    public static string ForEmail() => "Email address | Required";
    public static string ForUsername() => "Letters, numbers, underscore | 4-50 characters";
    public static string ForPassword() => $"Length \u2265 {ApplicationConstants.PASSWORD_MIN_LENGTH} | Uppercase | Lowercase | Digit | Special character";
    public static string ForGender() => "Male, Female, or Other";
    public static string ForDate() => "DD-MM-YYYY | Also accepts YYYY-MM-DD";
    public static string ForTime() => "HH:MM AM/PM | Also accepts 24-hour";
    public static string ForInt(int min, int max) => $"Digits only | From {min} to {max}";
    public static string ForYesNo() => "Y or N | Y = Yes, N = No";
    public static string ForAppointmentNumber() => "Format: APPT-YYYY-NNNN";
    public static string ForMaxChars(int max) => $"Text | Required | Max {max} characters";
}
