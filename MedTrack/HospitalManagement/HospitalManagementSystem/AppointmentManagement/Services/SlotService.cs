using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.AppointmentManagement.Services;
public class SlotService
{
    private readonly SlotRepository _repository;
    public SlotService(SlotRepository repository) => _repository = repository;
    public Task<int> GenerateAsync(int doctorId, DateTime start, DateTime end, TimeSpan startTime, TimeSpan endTime, int duration) => _repository.GenerateSlotsAsync(doctorId, start, end, startTime, endTime, duration);
    public async Task<(int Created, int BreakSlotsRemoved)> GenerateWithBreakAsync(int doctorId, DateTime start, DateTime end, TimeSpan startTime, TimeSpan endTime, int duration, TimeSpan? breakStart, TimeSpan? breakEnd)
    {
        var created = await _repository.GenerateSlotsAsync(doctorId, start, end, startTime, endTime, duration);
        var removed = breakStart.HasValue && breakEnd.HasValue && breakEnd > breakStart
            ? await _repository.RemoveBreakSlotsAsync(doctorId, start, end, breakStart.Value, breakEnd.Value)
            : 0;
        return (created, removed);
    }
    public async Task<List<SlotRow>> GetAvailableAsync(int doctorId, DateTime date)
    {
        var all = await _repository.GetAvailableSlotsAsync(doctorId, date);
        var now = DateTime.Now;
        var available = all.Where(s => s.SlotDate.Date > now.Date
                                    || (s.SlotDate.Date == now.Date && s.StartTime > now.TimeOfDay)).ToList();
        return available.Take(5).ToList();
    }
    public Task<List<SlotRow>> GetWeekAsync(int doctorId, DateTime start, DateTime end) => _repository.GetDoctorSlotsForWeekAsync(doctorId, start, end);
    public Task<List<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)>> GetDoctorSlotsWithDetailsAsync(int doctorId, DateTime start, DateTime end) => _repository.GetDoctorSlotsWithDetailsAsync(doctorId, start, end);
    public Task<bool> ToggleSlotBlockAsync(int slotId, bool block) => _repository.ToggleSlotBlockAsync(slotId, block);
    public Task<bool> UpdateSlotTimeAsync(int slotId, TimeSpan newStart, TimeSpan newEnd) => _repository.UpdateSlotTimeAsync(slotId, newStart, newEnd);
    public Task<List<SlotRow>> GetDaySlotsAsync(int doctorId, DateTime date, int excludeSlotId) => _repository.GetDaySlotsAsync(doctorId, date, excludeSlotId);
    public Task<int> DeleteFutureUnbookedSlotsAsync(int doctorId, DateTime from, DateTime to) => _repository.DeleteFutureUnbookedSlotsAsync(doctorId, from, to);
    public Task<SlotRow?> EnsureSlotAsync(int doctorId, DateTime date, TimeSpan startTime, int durationMinutes) => _repository.EnsureSlotAsync(doctorId, date, startTime, durationMinutes);
    public async Task<int> SetDayCustomSlotsAsync(int doctorId, DateTime date, List<TimeSpan> slotStartTimes, int durationMinutes)
    {
        await _repository.DeleteFutureUnbookedSlotsForDayAsync(doctorId, date);
        return await _repository.InsertCustomSlotsForWeekAsync(doctorId, date, date, slotStartTimes, durationMinutes);
    }

    public async Task<int> SetWeeklyCustomSlotsAsync(int doctorId, List<TimeSpan> slotStartTimes, int durationMinutes)
    {
        var from = DateTime.Today.AddDays(1);
        var to = DateTime.Today.AddDays(7);
        await _repository.DeleteFutureUnbookedSlotsAsync(doctorId, from, to);
        return await _repository.InsertCustomSlotsForWeekAsync(doctorId, from, to, slotStartTimes, durationMinutes);
    }
}
