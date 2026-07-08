using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.DoctorManagement.Services;
public class DoctorService
{
    private readonly DoctorRepository _repository;
    public DoctorService(DoctorRepository repository) => _repository = repository;
    public Task<List<DepartmentRow>> GetDepartmentsAsync() => _repository.GetDepartmentsAsync();
    public Task<List<DoctorRow>> GetDoctorsAsync() => _repository.GetAllDoctorRowsAsync();
    public Task<DoctorRow?> GetDoctorAsync(int id) => _repository.GetDoctorByIdAsync(id);
    public Task<int> RegisterDoctorAsync(string name, int deptId, string email, string phone, string qualification, int exp, string username, string password)
        => _repository.AddDoctorAsync(name, deptId, email, phone, qualification, exp, username, BCrypt.Net.BCrypt.HashPassword(password));
    public Task<bool> UpdateDoctorAsync(int id, string name, int deptId, string email, string phone, string qualification, int exp)
        => _repository.UpdateDoctorAsync(id, name, deptId, email, phone, qualification, exp);
    public Task<bool> DeactivateDoctorAsync(int id) => _repository.DeleteAsync(id);
    public Task<bool> UpdateDoctorNameAsync(int id, string name) => _repository.UpdateDoctorNameAsync(id, name);
    public Task<bool> UpdateDoctorDepartmentAsync(int id, int deptId) => _repository.UpdateDoctorDepartmentAsync(id, deptId);
    public Task<bool> UpdateDoctorPhoneAsync(int id, string phone) => _repository.UpdateDoctorPhoneAsync(id, phone);
    public Task<bool> UpdateDoctorEmailAsync(int id, string email) => _repository.UpdateDoctorEmailAsync(id, email);
    public Task<bool> UpdateDoctorStatusAsync(int id, bool isActive) => _repository.UpdateDoctorStatusAsync(id, isActive);
}
