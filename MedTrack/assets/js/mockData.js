/* CityCare Mock Data Bridge — connects StorageDB to patient dashboard/appointments views */

function getUpcomingAppointments() {
  if (!window.StorageDB) return [];

  var patientId = sessionStorage.getItem('currentPatientId') || 'PAT-1001';
  var all = window.StorageDB.getAppointments();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  return all
    .filter(function (a) {
      return a.patientId === patientId && a.status === 'Booked';
    })
    .filter(function (a) {
      var d = new Date(a.appointmentDate + 'T00:00:00');
      return d >= today;
    })
    .sort(function (a, b) { return a.appointmentDate.localeCompare(b.appointmentDate); })
    .map(function (a) {
      var d = new Date(a.appointmentDate + 'T00:00:00');
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return {
        id: a.id,
        doctorName: a.doctorName,
        doctorSpecialty: a.department,
        doctorImg: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(a.doctorName) + '&background=047857&color=fff&size=150',
        dateStr: days[d.getDay()] + ', ' + String(d.getDate()).padStart(2,'0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(),
        time: a.startTime,
        location: a.department + ' OPD'
      };
    });
}
