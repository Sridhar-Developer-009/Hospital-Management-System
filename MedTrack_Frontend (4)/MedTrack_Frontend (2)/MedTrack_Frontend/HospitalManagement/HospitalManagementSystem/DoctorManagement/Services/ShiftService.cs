using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.DoctorManagement.Models;
namespace HospitalManagementSystem.DoctorManagement.Services;
public class ShiftService
{
    private readonly ShiftRepository _repository;
    public ShiftService(ShiftRepository repository) => _repository = repository;
    public Task<List<DoctorShift>> GetByDoctorAsync(int doctorId) => _repository.GetByDoctorAsync(doctorId);
    public Task<int> AddAsync(DoctorShift shift) => _repository.AddAsync(shift);
    public Task<bool> UpdateAsync(DoctorShift shift) => _repository.UpdateAsync(shift);
}
