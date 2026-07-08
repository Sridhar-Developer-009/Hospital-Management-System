using System.Globalization;
using System.Text.RegularExpressions;
using HospitalManagementSystem.Shared.Exceptions;
using Spectre.Console;

namespace HospitalManagementSystem.Shared.Utilities;

public static class InputHelper
{
    private const string BackHint = "Type 0 to go back or # for Home.";

    public static string SelectFromMenu(string title, params string[] options)
    {
        return SelectFromMenuInternal(title, true, options);
    }

    public static string SelectFromMenu(string title, bool includeMainMenu, params string[] options)
    {
        return SelectFromMenuInternal(title, includeMainMenu, options);
    }

    private static string SelectFromMenuInternal(string title, bool includeMainMenu, string[] options)
    {
        if (includeMainMenu && !options.Any(o => o.Contains("Home", StringComparison.OrdinalIgnoreCase)))
            options = options.Concat(new[] { "Home" }).ToArray();
        var result = ConsoleManager.ShowSelectionPrompt(title, options);
        if (result == "Home") throw new MainMenuException();
        return result;
    }

    public static bool ConfirmSelection(string prompt)
    {
        var result = ConsoleManager.ShowSelectionPrompt(prompt, "No", "Yes");
        return result == "Yes";
    }

    public static int ReadInt(string prompt, int min, int max)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForInt(min, max));
            ConsoleManager.Prompt(prompt);
            var raw = Console.ReadLine()?.Trim();

            if (string.IsNullOrWhiteSpace(raw))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }

            if (raw == "0")
            {
                if (min == 0) return 0;
                throw new MenuBackException();
            }
            if (raw == "#") throw new MainMenuException();

            if (!int.TryParse(raw, out var value))
            {
                ConsoleManager.Warning("Please enter digits only.");
                continue;
            }

            if (value >= min && value <= max) return value;

            ConsoleManager.Warning($"Please enter a number between {min} and {max}.");
        }
    }

    public static string ReadRequired(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForText());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();

            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (!string.IsNullOrWhiteSpace(value)) return value;

            ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
        }
    }

    public static string ReadRequiredWithFormat(string prompt, string rules)
    {
        while (true)
        {
            ConsoleManager.InputGuide(rules);
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();

            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (!string.IsNullOrWhiteSpace(value)) return value;

            ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
        }
    }

    public static string ReadOptional(string prompt)
    {
        ConsoleManager.InputGuide(ValidationRules.ForOptional());
        ConsoleManager.Prompt(prompt);
        var value = Console.ReadLine()?.Trim() ?? string.Empty;
        if (value == "0") throw new MenuBackException();
        if (value == "#") throw new MainMenuException();
        return value;
    }

    public static DateTime ReadDate(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForDate());
            ConsoleManager.Prompt(prompt);
            var input = Console.ReadLine()?.Trim();

            if (string.IsNullOrWhiteSpace(input))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid date.");
                continue;
            }

            if (input == "0") throw new MenuBackException();
            if (input == "#") throw new MainMenuException();

            if (DateTime.TryParseExact(input,
                    new[] { "dd-MM-yyyy", "dd-MMM-yyyy", "yyyy-MM-dd", "dd/MM/yyyy" },
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var date))
            {
                return date.Date;
            }

            ConsoleManager.Warning("Invalid date format. Use DD-MM-YYYY.");
        }
    }

    public static TimeSpan ReadTime(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForTime());
            ConsoleManager.Prompt(prompt);
            var input = Console.ReadLine()?.Trim();

            if (string.IsNullOrWhiteSpace(input))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid time.");
                continue;
            }

            if (input == "0") throw new MenuBackException();
            if (input == "#") throw new MainMenuException();

            if (DateTime.TryParseExact(input,
                    new[] { "hh:mm tt", "h:mm tt", "HH:mm", "H:mm" },
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var time))
            {
                return time.TimeOfDay;
            }

            ConsoleManager.Warning("Invalid time format. Use HH:MM AM/PM (12-hour) or HH:MM (24-hour), for example 09:30 AM or 14:00.");
        }
    }

    public static bool Confirm(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForYesNo());
            ConsoleManager.Prompt(prompt);
            var input = Console.ReadLine()?.Trim().ToUpperInvariant();

            if (input == "Y" || input == "YES") return true;
            if (input == "N" || input == "NO") return false;
            if (input == "0") throw new MenuBackException();

            ConsoleManager.Warning("Enter Y or N.");
        }
    }

    public static string ReadName(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForName());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();
            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }
            if (Regex.IsMatch(value, @"^[A-Za-z. ]{2,100}$")) return value;
            ConsoleManager.Warning("Name should contain only alphabets, spaces, and dots.");
        }
    }

    public static string ReadPhone(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForPhone());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();
            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }
            if (Regex.IsMatch(value, @"^[6-9]\d{9}$")) return value;
            ConsoleManager.Warning("Phone must be exactly 10 digits and start with 6, 7, 8, or 9.");
        }
    }

    public static string ReadEmail(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForEmail());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();
            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }
            if (Regex.IsMatch(value, @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) return value;
            ConsoleManager.Warning("Please enter a valid email address, for example user@example.com.");
        }
    }

    public static string ReadUsername(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForUsername());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();
            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }
            if (Regex.IsMatch(value, @"^[A-Za-z0-9_]{4,50}$")) return value;
            ConsoleManager.Warning("Username must be 4-50 characters and may contain letters, numbers, and underscore only.");
        }
    }

    public static string ReadPassword(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForPassword());
            var value = SecurePasswordReader.Read(prompt);

            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }

            if (value.Length >= 8 &&
                Regex.IsMatch(value, "[A-Z]") &&
                Regex.IsMatch(value, "[a-z]") &&
                Regex.IsMatch(value, @"\d") &&
                Regex.IsMatch(value, @"[^A-Za-z0-9]"))
            {
                return value;
            }

            ConsoleManager.Warning("Password must contain uppercase, lowercase, digit, special character, and at least 8 characters.");
        }
    }

    public static string ReadGender(string prompt)
    {
        while (true)
        {
            ConsoleManager.InputGuide(ValidationRules.ForGender());
            ConsoleManager.Prompt(prompt);
            var value = Console.ReadLine()?.Trim();
            if (value == "0") throw new MenuBackException();
            if (value == "#") throw new MainMenuException();
            if (string.IsNullOrWhiteSpace(value))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }
            var normalized = CultureInfo.InvariantCulture.TextInfo.ToTitleCase(value.ToLowerInvariant());
            if (normalized is "Male" or "Female" or "Other") return normalized;
            ConsoleManager.Warning("Gender must be Male, Female, or Other.");
        }
    }
}
