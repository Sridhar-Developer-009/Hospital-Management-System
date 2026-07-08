using HospitalManagementSystem.AppointmentManagement.DTOs;
using HospitalManagementSystem.AppointmentManagement.Events;
using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.Shared.Constants;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Models;

namespace HospitalManagementSystem.AppointmentManagement.Services;

public class AppointmentService
{
    private readonly AppointmentRepository _repository;
    public event EventHandler<AppointmentBookedEvent>? AppointmentBooked;
    public event EventHandler<AppointmentCancelledEvent>? AppointmentCancelled;
    public event EventHandler<AppointmentCompletedEvent>? AppointmentCompleted;
    public event EventHandler<AppointmentNoShowEvent>? AppointmentNoShow;

    public AppointmentService(AppointmentRepository repository) => _repository = repository;

    public Task<List<AppointmentRow>> GetDoctorAppointmentsAsync(int doctorId, DateTime? from, DateTime? to) => _repository.GetByDoctorAsync(doctorId, from, to);
    public Task<List<AppointmentRow>> GetPatientAppointmentsAsync(int patientId) => _repository.GetByPatientAsync(patientId);
    public Task<AppointmentRow?> GetAppointmentBySlotIdAsync(int slotId) => _repository.GetBySlotIdAsync(slotId);
    public Task<List<AppointmentOversightRow>> GetAllForAdminAsync() => _repository.GetAllForAdminAsync();
    public Task<AppointmentOversightRow?> GetByNumberForAdminAsync(string appointmentNumber) => _repository.GetByNumberForAdminAsync(appointmentNumber);
    public Task<List<AppointmentOversightRow>> GetByDateForAdminAsync(DateTime date) => _repository.GetByDateForAdminAsync(date);
    public Task<List<AppointmentOversightRow>> GetByStatusForAdminAsync(string status) => _repository.GetByStatusForAdminAsync(status);

    public async Task<AppointmentRow?> BookAsync(int patientId, int doctorId, int slotId, string reason, string triggeredBy = "Patient")
    {
        var booked = await _repository.BookAsync(patientId, doctorId, slotId, reason);
        if (booked != null) AppointmentBooked?.Invoke(this, new AppointmentBookedEvent(booked.AppointmentId, booked.AppointmentNumber, booked.PatientName, triggeredBy));
        return booked;
    }

    public async Task CancelAsync(AppointmentRow appointment, string triggeredBy = "Patient")
    {
        var start = appointment.AppointmentDate.Date + appointment.StartTime;
        if (start <= DateTime.Now.AddHours(ApplicationConstants.MIN_CANCELLATION_HOURS))
            throw new BusinessRuleException("Appointments cannot be cancelled within 2 hours of the scheduled time.");
        await _repository.CancelAsync(appointment.AppointmentId);
        AppointmentCancelled?.Invoke(this, new AppointmentCancelledEvent(appointment.AppointmentId, appointment.AppointmentNumber, triggeredBy));
    }

    public async Task<int> CompleteAsync(AppointmentRow appointment, string diagnosis, string notes, string triggeredBy = "Doctor")
    {
        var historyId = await _repository.CompleteAsync(appointment.AppointmentId, diagnosis, notes);
        AppointmentCompleted?.Invoke(this, new AppointmentCompletedEvent(appointment.AppointmentId, appointment.AppointmentNumber, historyId, triggeredBy));
        return historyId;
    }

    public async Task<int> CompleteWithPrescriptionsAsync(AppointmentRow appointment, string diagnosis, string notes, List<PrescriptionDto> prescriptions, string triggeredBy = "Doctor")
    {
        var historyId = await _repository.CompleteAsync(appointment.AppointmentId, diagnosis, notes);
        foreach (var p in prescriptions)
            await _repository.AddPrescriptionAsync(historyId, p.MedicineName, p.Dosage, p.Frequency, p.DurationDays, p.Instructions);
        AppointmentCompleted?.Invoke(this, new AppointmentCompletedEvent(appointment.AppointmentId, appointment.AppointmentNumber, historyId, triggeredBy));
        return historyId;
    }

    public async Task MarkNoShowAsync(AppointmentRow appointment, string triggeredBy = "Doctor")
    {
        await _repository.MarkNoShowAsync(appointment.AppointmentId);
        AppointmentNoShow?.Invoke(this, new AppointmentNoShowEvent(appointment.AppointmentId, appointment.AppointmentNumber, triggeredBy));
    }
}
