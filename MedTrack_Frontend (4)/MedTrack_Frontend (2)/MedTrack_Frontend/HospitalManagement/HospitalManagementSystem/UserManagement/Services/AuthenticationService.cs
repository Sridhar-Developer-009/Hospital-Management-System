using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.UserManagement.DTOs;
using HospitalManagementSystem.UserManagement.Repositories;

namespace HospitalManagementSystem.UserManagement.Services;

public class AuthenticationService
{
    private readonly UserRepository _repository;
    public AuthenticationService(UserRepository repository) => _repository = repository;

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string expectedRole)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            throw new AuthenticationException("We couldn't sign you in. Please check your details and try again.");

        var response = await _repository.LoginAsync(request.Username);
        if (response == null) throw new AuthenticationException("We couldn't sign you in. Please check your details and try again.");

        bool valid;
        try { valid = BCrypt.Net.BCrypt.Verify(request.Password, response.PasswordHash); }
        catch { valid = false; }

        if (!valid || !response.RoleName.Equals(expectedRole, StringComparison.OrdinalIgnoreCase))
            throw new AuthenticationException("We couldn't sign you in. Please check your details and try again.");

        response.IsAuthenticated = true;
        response.PasswordHash = string.Empty;
        return response;
    }
}
