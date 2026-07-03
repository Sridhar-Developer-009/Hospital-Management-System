namespace HospitalManagementSystem.Shared.Constants;

public static class ApplicationConstants
{
public const string DEFAULT_CONNECTION_STRING =
"Server=MSI\\SQLEXPRESS;Database=HMS_DB;Trusted_Connection=True;TrustServerCertificate=True;";
    public const int MIN_CANCELLATION_HOURS = 2;
    public const int UHID_LENGTH = 8;
    public const string DOCTOR_CODE_PREFIX = "DR";
    public const string APPOINTMENT_PREFIX = "APPT";
    public const int PAGE_SIZE = 5;
    public const int PASSWORD_MIN_LENGTH = 8;
    public const int DEFAULT_SLOT_START_HOUR = 9;
    public const int DEFAULT_SLOT_START_MINUTE = 0;
    public const int DEFAULT_SLOT_END_HOUR = 13;
    public const int DEFAULT_SLOT_END_MINUTE = 0;
    public const int DEFAULT_SLOT_DURATION_MINUTES = 30;
}
