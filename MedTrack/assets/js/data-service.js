/* CityCare Data Service — abstraction layer over StorageDB
   Swap USE_MOCK = false to route all calls through CityCareAPI */

const DataService = (function() {

  var USE_MOCK = true; // toggle this to switch to real API

  var mock = window.StorageDB;

  function withFallback(fnName, args) {
    if (USE_MOCK) {
      if (!mock) throw new Error('StorageDB not loaded');
      return mock[fnName].apply(mock, args);
    }
    return CityCareAPI.call(fnName, args);
  }

  return {
    setUseMock: function(v) { USE_MOCK = v; },

    // Patients
    getPatients: function() { return withFallback('getPatients', arguments); },
    getPatientById: function(id) { return withFallback('getPatientById', [id]); },
    getActivePatients: function() { return withFallback('getActivePatients', arguments); },
    savePatient: function(p) { return withFallback('savePatient', [p]); },
    updatePatient: function(p) { return withFallback('updatePatient', [p]); },
    generatePatientCode: function() { return withFallback('generatePatientCode', arguments); },
    getPatientByUsername: function(u) { return withFallback('getPatientByUsername', [u]); },

    // Doctors
    getDoctors: function() { return withFallback('getDoctors', arguments); },
    getActiveDoctors: function() { return withFallback('getActiveDoctors', arguments); },
    getDoctorById: function(id) { return withFallback('getDoctorById', [id]); },
    saveDoctor: function(d) { return withFallback('saveDoctor', [d]); },
    updateDoctor: function(d) { return withFallback('updateDoctor', [d]); },
    generateDoctorCode: function() { return withFallback('generateDoctorCode', arguments); },
    getDoctorByUsername: function(u) { return withFallback('getDoctorByUsername', [u]); },
    getDoctorShifts: function(id) { return withFallback('getDoctorShifts', [id]); },
    getDoctorSlots: function(id) { return withFallback('getDoctorSlots', [id]); },
    saveDoctorSlots: function(id, s) { return withFallback('saveDoctorSlots', [id, s]); },

    // Appointments
    getAppointments: function() { return withFallback('getAppointments', arguments); },
    getAppointmentById: function(id) { return withFallback('getAppointmentById', [id]); },
    saveAppointment: function(a) { return withFallback('saveAppointment', [a]); },
    updateAppointment: function(a) { return withFallback('updateAppointment', [a]); },
    registerAppointment: function(a) { return withFallback('registerAppointment', [a]); },
    cancelAppointment: function(id) { return withFallback('cancelAppointment', [id]); },
    completeAppointment: function(id) { return withFallback('completeAppointment', [id]); },
    noShowAppointment: function(id) { return withFallback('noShowAppointment', [id]); },
    generateAppointmentCode: function() { return withFallback('generateAppointmentCode', arguments); },

    // Notifications
    getNotifications: function() { return withFallback('getNotifications', arguments); },
    saveNotification: function(n) { return withFallback('saveNotification', [n]); },
    dispatchNotification: function(t, m, rt, ri, ty) { return withFallback('dispatchNotification', [t, m, rt, ri, ty]); },
    getNotificationsForRecipient: function(rt, ri) { return withFallback('getNotificationsForRecipient', [rt, ri]); },
    markNotificationRead: function(id) { return withFallback('markNotificationRead', [id]); },
    markAllNotificationsRead: function(rt, ri) { return withFallback('markAllNotificationsRead', [rt, ri]); },
    getUnreadNotificationCount: function(rt, ri) { return withFallback('getUnreadNotificationCount', [rt, ri]); },

    // Audit
    getAuditLogs: function() { return withFallback('getAuditLogs', arguments); },
    addAuditLog: function(u, a, r, d, s) { return withFallback('addAuditLog', [u, a, r, d, s]); },

    // Departments
    getDepartments: function() { return withFallback('getDepartments', arguments); },

    // Settings
    getSettings: function() { return withFallback('getSettings', arguments); },
    saveSettings: function(s) { return withFallback('saveSettings', [s]); },
  };
})();
