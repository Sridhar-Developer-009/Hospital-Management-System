using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.DoctorManagement.Services;
public class LeaveService
{
    private readonly LeaveRepository _repository;
    public LeaveService(LeaveRepository repository) => _repository = repository;
    public Task<int> ApplyAsync(int doctorId, DateTime start, DateTime end, string reason) => _repository.ApplyAsync(doctorId, start, end, reason);
    public Task<List<LeaveRow>> GetByDoctorAsync(int doctorId) => _repository.GetByDoctorAsync(doctorId);
    public Task<List<LeaveRow>> GetPendingAsync() => _repository.GetPendingAsync();
    public Task<bool> ApproveAsync(int leaveId, int userId) => _repository.ApproveAsync(leaveId, userId);
    public Task<bool> RejectAsync(int leaveId, int userId) => _repository.RejectAsync(leaveId, userId);
}
