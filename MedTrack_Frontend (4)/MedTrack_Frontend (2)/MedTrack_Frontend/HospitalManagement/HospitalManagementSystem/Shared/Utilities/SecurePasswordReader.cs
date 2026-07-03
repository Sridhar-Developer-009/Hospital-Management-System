using System.Text;
using HospitalManagementSystem.Shared.Exceptions;
using Spectre.Console;

namespace HospitalManagementSystem.Shared.Utilities;

public static class SecurePasswordReader
{
    public static string Read(string prompt)
    {
        Console.WriteLine();
        AnsiConsole.Markup($"  [black on {ConsoleManager.Accent} bold] HINT [/] [{ConsoleManager.Muted}]Right arrow shows password | Left arrow hides password[/]");
        ConsoleManager.Prompt(prompt);

        var password = new StringBuilder();
        var visible = false;

        while (true)
        {
            var keyInfo = Console.ReadKey(true);

            if (keyInfo.Key == ConsoleKey.Enter)
            {
                Console.WriteLine();
                var result = password.ToString();
                if (result.Trim() == "0") throw new MenuBackException();
                if (result.Trim() == "#") throw new MainMenuException();
                return result;
            }

            if (keyInfo.Key == ConsoleKey.Backspace)
            {
                if (password.Length > 0)
                {
                    password.Length--;
                    Console.Write("\b \b");
                }
                continue;
            }

            if (keyInfo.Key == ConsoleKey.RightArrow && !visible)
            {
                visible = true;
                if (password.Length > 0)
                {
                    Console.Write(new string('\b', password.Length));
                    Console.Write(password.ToString());
                }
                continue;
            }

            if (keyInfo.Key == ConsoleKey.LeftArrow && visible)
            {
                visible = false;
                if (password.Length > 0)
                {
                    Console.Write(new string('\b', password.Length));
                    Console.Write(new string('*', password.Length));
                }
                continue;
            }

            if (!char.IsControl(keyInfo.KeyChar))
            {
                password.Append(keyInfo.KeyChar);
                Console.Write(visible ? keyInfo.KeyChar : '*');
            }
        }
    }
}
