using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.AppointmentManagement.Services;
public class MedicalHistoryService
{
    private readonly MedicalHistoryRepository _repository;
    public MedicalHistoryService(MedicalHistoryRepository repository) => _repository = repository;
    public Task<List<MedicalHistoryRow>> GetPatientHistoryAsync(int patientId) => _repository.GetPatientHistoryAsync(patientId);
}
