namespace HospitalManagementSystem.Database.StoredProcedures;
public static class StoredProcedureNames
{
    public const string Login = "usp_Login";
    public const string AddDoctor = "usp_AddDoctor";
    public const string UpdateDoctor = "usp_UpdateDoctor";
    public const string DeleteDoctor = "usp_DeleteDoctor";
    public const string GetDoctorById = "usp_GetDoctorById";
    public const string GetAllDoctors = "usp_GetAllDoctors";
    public const string RegisterPatient = "usp_RegisterPatient";
    public const string UpdatePatient = "usp_UpdatePatient";
    public const string GetPatientByUHID = "usp_GetPatientByUHID";
    public const string GetAllPatients = "usp_GetAllPatients";
    public const string GenerateDoctorSlots = "usp_GenerateDoctorSlots";
    public const string GetAvailableSlots = "usp_GetAvailableSlots";
    public const string BookAppointment = "usp_BookAppointment";
    public const string CancelAppointment = "usp_CancelAppointment";
    public const string CompleteAppointment = "usp_CompleteAppointment";
    public const string GetAppointmentsByDoctor = "usp_GetAppointmentsByDoctor";
    public const string GetAppointmentsByPatient = "usp_GetAppointmentsByPatient";
    public const string ApplyDoctorLeave = "usp_ApplyDoctorLeave";
    public const string ApproveDoctorLeave = "usp_ApproveDoctorLeave";
    public const string RejectDoctorLeave = "usp_RejectDoctorLeave";
    public const string DailyAppointmentReport = "usp_DailyAppointmentReport";
    public const string DoctorWiseAppointmentReport = "usp_DoctorWiseAppointmentReport";
    public const string DepartmentWiseAppointmentReport = "usp_DepartmentWiseAppointmentReport";
    public const string NoShowAppointmentReport = "usp_NoShowAppointmentReport";
    public const string DeclareHolidayWithCascade = "usp_DeclareHolidayWithCascade";
}
