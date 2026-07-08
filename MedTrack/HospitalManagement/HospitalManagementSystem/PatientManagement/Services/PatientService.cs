using HospitalManagementSystem.PatientManagement.Repositories;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.PatientManagement.Services;
public class PatientService
{
    private readonly PatientRepository _repository;
    public PatientService(PatientRepository repository) => _repository = repository;
    public Task<(int PatientId, string UHID)> RegisterAsync(string name, string gender, DateTime dob, string email, string phone, string address, string blood, string emergency, string username, string password)
        => _repository.RegisterPatientAsync(name, gender, dob, email, phone, address, blood, emergency, username, BCrypt.Net.BCrypt.HashPassword(password));
    public Task<PatientRow?> GetByUhidAsync(string uhid) => _repository.GetByUhidAsync(uhid);
    public Task<PatientRow?> GetByPhoneAsync(string phone) => _repository.GetByPhoneAsync(phone);
    public Task<List<PatientRow>> GetAllAsync() => _repository.GetAllPatientRowsAsync();
    public Task<PatientRow?> GetByIdAsync(int id) => _repository.GetByIdAsync2(id);
}
