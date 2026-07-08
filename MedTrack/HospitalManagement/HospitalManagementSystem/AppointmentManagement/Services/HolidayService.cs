using HospitalManagementSystem.AppointmentManagement.Repositories;
namespace HospitalManagementSystem.AppointmentManagement.Services;
public class HolidayService
{
    private readonly HolidayRepository _repository;
    public HolidayService(HolidayRepository repository) => _repository = repository;
    public Task DeclareAsync(DateTime date, string name, string description) => _repository.DeclareAsync(date, name, description);
    public Task<(int CancelledAppointments, int ReleasedSlots)> DeclareWithCascadeAsync(DateTime date, string name, string description) => _repository.DeclareWithCascadeAsync(date, name, description);
}
