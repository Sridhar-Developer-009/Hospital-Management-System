// shared/utils/storage.js

(function() {
  function _simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'h$' + Math.abs(hash).toString(36);
  }

  var SEED_HASHES = {
    doctor:  _simpleHash('Password@123'),
    patient: _simpleHash('Patient@123'),
    admin:   _simpleHash('Admin@123')
  };

  const StorageDB = {
    init: function() {
      var currentVersion = localStorage.getItem('medtrack_version');
      if (!currentVersion || parseInt(currentVersion) < 3) {
        localStorage.removeItem('medtrack_departments');
        localStorage.removeItem('medtrack_doctors');
        localStorage.removeItem('medtrack_patients');
        localStorage.removeItem('medtrack_appointments');
        localStorage.removeItem('medtrack_landing_content');
        localStorage.removeItem('medtrack_landing_status');
        localStorage.removeItem('citycare_admin_creds');
        localStorage.setItem('medtrack_version', '3');
      }
      if (!localStorage.getItem('medtrack_departments')) {
        localStorage.setItem('medtrack_departments', JSON.stringify([
          { id: 'dept-1', name: 'Cardiology' },
          { id: 'dept-2', name: 'Orthopedics' },
          { id: 'dept-3', name: 'Dermatology' },
          { id: 'dept-4', name: 'General Medicine' },
          { id: 'dept-5', name: 'Neurology' },
          { id: 'dept-6', name: 'Pediatrics' }
        ]));
      }

      if (!localStorage.getItem('medtrack_doctors')) {
        localStorage.setItem('medtrack_doctors', JSON.stringify([
          {
            id: 'DOC-1001',
            name: 'Dr. Arvind Kumar',
            department: 'Cardiology',
            contact: '9876543210',
            email: 'arvind@citycarehospital.com',
            qualification: 'MBBS, MD',
            experience: 15,
            username: 'arvind_k',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1002',
            name: 'Dr. Meena Iyer',
            department: 'General Medicine',
            contact: '8765432109',
            email: 'meena@citycarehospital.com',
            qualification: 'MBBS, DNB',
            experience: 8,
            username: 'meena_i',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1003',
            name: 'Dr. Sridhar Rao',
            department: 'Orthopedics',
            contact: '9988776655',
            email: 'sridhar@citycarehospital.com',
            qualification: 'MS, MCh',
            experience: 12,
            username: 'sridhar_r',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1004',
            name: 'Dr. Priya Sharma',
            department: 'Pediatrics',
            contact: '8877665544',
            email: 'priya@citycarehospital.com',
            qualification: 'MBBS, MD',
            experience: 6,
            username: 'priya_s',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1005',
            name: 'Dr. Venkatesh Joshi',
            department: 'Dermatology',
            contact: '7766554433',
            email: 'venkatesh@citycarehospital.com',
            qualification: 'MBBS, DVD',
            experience: 10,
            username: 'venkatesh_j',
            password: SEED_HASHES.doctor,
            status: 'INACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1006',
            name: 'Dr. Lakshmi Nair',
            department: 'Cardiology',
            contact: '6655443322',
            email: 'lakshmi@citycarehospital.com',
            qualification: 'MBBS, DM',
            experience: 18,
            username: 'lakshmi_n',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1007',
            name: 'Dr. Ravi Kumar',
            department: 'General Medicine',
            contact: '9988001122',
            email: 'ravi@citycarehospital.com',
            qualification: 'MBBS, MD',
            experience: 4,
            username: 'ravi_k',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1008',
            name: 'Dr. Ananya Gupta',
            department: 'Orthopedics',
            contact: '8899001122',
            email: 'ananya@citycarehospital.com',
            qualification: 'MS, DNB',
            experience: 7,
            username: 'ananya_g',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1009',
            name: 'Dr. Sundar Rajan',
            department: 'Pediatrics',
            contact: '9900112233',
            email: 'sundar@citycarehospital.com',
            qualification: 'MBBS, DCH',
            experience: 20,
            username: 'sundar_r',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1010',
            name: 'Dr. Deepika Menon',
            department: 'Cardiology',
            contact: '7711223344',
            email: 'deepika@citycarehospital.com',
            qualification: 'MBBS, MD, DM',
            experience: 14,
            username: 'deepika_m',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1011',
            name: 'Dr. Ramesh Babu',
            department: 'Dermatology',
            contact: '8822334455',
            email: 'ramesh@citycarehospital.com',
            qualification: 'MBBS, DVD',
            experience: 9,
            username: 'ramesh_b',
            password: SEED_HASHES.doctor,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString()
          },
          {
            id: 'DOC-1012',
            name: 'Dr. Kavitha Krishnan',
            department: 'General Medicine',
            contact: '9933445566',
            email: 'kavitha@citycarehospital.com',
            qualification: 'MBBS, MD',
            experience: 11,
            username: 'kavitha_k',
            password: SEED_HASHES.doctor,
            status: 'INACTIVE',
            registeredAt: new Date().toISOString()
          }
        ]));
      }

      if (!localStorage.getItem('medtrack_shifts')) {
         localStorage.setItem('medtrack_shifts', JSON.stringify([
             { doctorId: 'DOC-1001', shiftName: 'Morning Shift', start: '09:00 AM', end: '01:00 PM', duration: '4h' },
             { doctorId: 'DOC-1001', shiftName: 'Evening Shift', start: '05:00 PM', end: '08:00 PM', duration: '3h' },
             { doctorId: 'DOC-1003', shiftName: 'Morning Shift', start: '08:00 AM', end: '12:00 PM', duration: '4h' },
             { doctorId: 'DOC-1004', shiftName: 'General Shift', start: '10:00 AM', end: '04:00 PM', duration: '6h' },
             { doctorId: 'DOC-1006', shiftName: 'Morning Shift', start: '09:00 AM', end: '01:00 PM', duration: '4h' }
         ]));
      }

      if (!localStorage.getItem('medtrack_slots')) {
         const defaultSlots = {
             'DOC-1001': {
                 'Monday': ['A', 'A', 'A', 'A', 'A'],
                 'Tuesday': ['A', 'A', 'A', 'A', 'A'],
                 'Wednesday': ['A', 'A', 'A', 'A', 'A'],
                 'Thursday': ['A', 'A', 'A', 'A', 'A'],
                 'Friday': ['A', 'A', 'A', 'A', 'A'],
                 'Saturday': ['-', '-', '-', '-', '-'],
                 'Sunday': ['-', '-', '-', '-', '-']
             },
             'DOC-1002': {
                 'Monday': ['A', 'A', 'A', 'A', 'A'],
                 'Tuesday': ['A', 'A', 'A', 'A', 'A'],
                 'Wednesday': ['A', 'A', 'A', 'A', 'A'],
                 'Thursday': ['A', 'A', 'A', 'A', 'A'],
                 'Friday': ['A', 'A', 'A', 'A', 'A'],
                 'Saturday': ['-', '-', '-', '-', '-'],
                 'Sunday': ['-', '-', '-', '-', '-']
             },
             'DOC-1003': {
                 'Monday': ['A', 'A', 'A', 'A', 'A'],
                 'Tuesday': ['A', 'A', 'A', 'A', 'A'],
                 'Wednesday': ['A', 'A', 'A', 'A', 'A'],
                 'Thursday': ['A', 'A', 'A', 'A', 'A'],
                 'Friday': ['A', 'A', 'A', 'A', 'A'],
                 'Saturday': ['-', '-', '-', '-', '-'],
                 'Sunday': ['-', '-', '-', '-', '-']
             },
             'DOC-1004': {
                 'Monday': ['A', 'A', 'A', 'A', 'A'],
                 'Tuesday': ['A', 'A', 'A', 'A', 'A'],
                 'Wednesday': ['A', 'A', 'A', 'A', 'A'],
                 'Thursday': ['A', 'A', 'A', 'A', 'A'],
                 'Friday': ['A', 'A', 'A', 'A', 'A'],
                 'Saturday': ['-', '-', '-', '-', '-'],
                 'Sunday': ['-', '-', '-', '-', '-']
             },
             'DOC-1006': {
                 'Monday': ['A', 'A', 'A', 'A', 'A'],
                 'Tuesday': ['A', 'A', 'A', 'A', 'A'],
                 'Wednesday': ['A', 'A', 'A', 'A', 'A'],
                 'Thursday': ['A', 'A', 'A', 'A', 'A'],
                 'Friday': ['A', 'A', 'A', 'A', 'A'],
                 'Saturday': ['-', '-', '-', '-', '-'],
                 'Sunday': ['-', '-', '-', '-', '-']
             }
         };
         localStorage.setItem('medtrack_slots', JSON.stringify(defaultSlots));
      }
    },

    getDepartments: function() {
      return JSON.parse(localStorage.getItem('medtrack_departments') || '[]');
    },

    getDoctors: function() {
      return JSON.parse(localStorage.getItem('medtrack_doctors') || '[]');
    },

    getActiveDoctors: function() {
      return this.getDoctors().filter(doc => doc.status === 'ACTIVE');
    },

    getDoctorById: function(id) {
      return this.getDoctors().find(doc => doc.id === id);
    },

    saveDoctor: function(doctor) {
      const doctors = this.getDoctors();
      doctors.push(doctor);
      localStorage.setItem('medtrack_doctors', JSON.stringify(doctors));
    },

    updateDoctor: function(updatedDoc) {
      let doctors = this.getDoctors();
      const idx = doctors.findIndex(d => d.id === updatedDoc.id);
      if (idx !== -1) {
        doctors[idx] = updatedDoc;
        localStorage.setItem('medtrack_doctors', JSON.stringify(doctors));
      }
    },

    getDoctorShifts: function(doctorId) {
        const shifts = JSON.parse(localStorage.getItem('medtrack_shifts') || '[]');
        return shifts.filter(s => s.doctorId === doctorId);
    },

    getDoctorByUsername: function(username) {
        return this.getDoctors().find(doc => doc.username === username);
    },

    getDoctorSlots: function(doctorId) {
        const slots = JSON.parse(localStorage.getItem('medtrack_slots') || '{}');
        return slots[doctorId] || null;
    },

    saveDoctorSlots: function(doctorId, slotData) {
        const slots = JSON.parse(localStorage.getItem('medtrack_slots') || '{}');
        slots[doctorId] = slotData;
        localStorage.setItem('medtrack_slots', JSON.stringify(slots));
    },

    generateDoctorCode: function() {
      const doctors = this.getDoctors();
      if (doctors.length === 0) return 'DOC-1001';
      // Extract numeric part of latest DOC id
      let maxId = 1000;
      doctors.forEach(d => {
         const num = parseInt(d.id.replace('DOC-', ''), 10);
         if (!isNaN(num) && num > maxId) maxId = num;
      });
      return `DOC-${maxId + 1}`;
    },

    resetDemoData: function() {
      localStorage.removeItem('medtrack_departments');
      localStorage.removeItem('medtrack_doctors');
      localStorage.removeItem('medtrack_shifts');
      localStorage.removeItem('medtrack_slots');
      localStorage.removeItem('medtrack_patients');
      localStorage.removeItem('medtrack_appointments');
      this.init();
    }
  };

  // ── Patient Helpers ───────────────────────────
  StorageDB.getPatients = function() {
    const data = localStorage.getItem('medtrack_patients');
    return data ? JSON.parse(data) : [];
  };

  StorageDB.getPatientById = function(id) {
    return this.getPatients().find(p => p.id === id);
  };

  StorageDB.getActivePatients = function() {
    return this.getPatients().filter(p => p.status === 'ACTIVE');
  };

  StorageDB.savePatient = function(patient) {
    const patients = this.getPatients();
    patients.push(patient);
    localStorage.setItem('medtrack_patients', JSON.stringify(patients));
  };

  StorageDB.updatePatient = function(updated) {
    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.id === updated.id);
    if (idx === -1) return;
    patients[idx] = updated;
    localStorage.setItem('medtrack_patients', JSON.stringify(patients));
  };

  StorageDB.getPatientByUsername = function(username) {
    return this.getPatients().find(p => p.username === username);
  };

  StorageDB.generatePatientCode = function() {
    const patients = this.getPatients();
    let maxId = 1000;
    patients.forEach(p => {
      const num = parseInt(p.id.replace('PAT-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return `PAT-${maxId + 1}`;
  };

  StorageDB.seedPatientData = function() {
    if (localStorage.getItem('medtrack_patients')) return;
    const DOCTORS = [
      'Dr. Arvind Kumar', 'Dr. Priya Sharma', 'Dr. Suresh Patel', 'Dr. Ananya Reddy',
      'Dr. Ravi Deshmukh', 'Dr. Meera Nair', 'Dr. Vikram Joshi', 'Dr. Deepa Iyer',
      'Dr. Rajesh Gupta', 'Dr. Kavita Singh', 'Dr. Manoj Tiwari', 'Dr. Sunita Verma'
    ];
    const patients = [
      { id:'PAT-1001', name:'Arun Sharma', age:45, gender:'Male', contact:'9876543210', email:'arun.s@email.com', bloodGroup:'O+', department:'Cardiology', assignedDoctor: DOCTORS[0], address:'12, Lake View Road, Chennai', emergencyContact:'9876543001', medicalHistory:'Hypertension since 2023. No allergies.', status:'ACTIVE', registeredAt:'2026-01-15T10:30:00Z', dateOfBirth:'1981-05-20', username:'arun_s', password:SEED_HASHES.patient },
      { id:'PAT-1002', name:'Lakshmi Narayanan', age:32, gender:'Female', contact:'9876543211', email:'lakshmi.n@email.com', bloodGroup:'B+', department:'General Medicine', assignedDoctor: DOCTORS[2], address:'45, MG Nagar, Bangalore', emergencyContact:'9876543002', medicalHistory:'Type 2 diabetes (2024).', status:'ACTIVE', registeredAt:'2026-02-03T14:15:00Z', dateOfBirth:'1994-08-12', username:'lakshmi_n', password:SEED_HASHES.patient },
      { id:'PAT-1003', name:'Venkatesh Rao', age:58, gender:'Male', contact:'9876543212', email:'venky.r@email.com', bloodGroup:'A-', department:'Orthopaedics', assignedDoctor: DOCTORS[3], address:'8, Nehru Street, Hyderabad', emergencyContact:'9876543003', medicalHistory:'Knee replacement (2022). Arthritis.', status:'FOLLOWUP', registeredAt:'2026-01-20T09:00:00Z', dateOfBirth:'1968-11-03', username:'venkatesh_r', password:SEED_HASHES.patient },
      { id:'PAT-1004', name:'Priya Karthikeyan', age:29, gender:'Female', contact:'9876543213', email:'priya.k@email.com', bloodGroup:'AB+', department:'Dermatology', assignedDoctor: DOCTORS[1], address:'23, East Coast Road, Puducherry', emergencyContact:'9876543004', medicalHistory:'Eczema. Allergic to sulfa drugs.', status:'ACTIVE', registeredAt:'2026-03-10T11:45:00Z', dateOfBirth:'1997-07-18', username:'priya_k', password:SEED_HASHES.patient },
      { id:'PAT-1005', name:'Rajan Menon', age:62, gender:'Male', contact:'9876543214', email:'rajan.m@email.com', bloodGroup:'O-', department:'Cardiology', assignedDoctor: DOCTORS[0], address:'67, Marine Drive, Kochi', emergencyContact:'9876543005', medicalHistory:'Coronary artery disease. Stent placed 2023.', status:'INPATIENT', registeredAt:'2026-04-01T08:00:00Z', dateOfBirth:'1964-02-28', username:'rajan_m', password:SEED_HASHES.patient },
      { id:'PAT-1006', name:'Divya Nair', age:8, gender:'Female', contact:'9876543215', email:'divya.n@email.com', bloodGroup:'B-', department:'Paediatrics', assignedDoctor: DOCTORS[4], address:'5, Temple Street, Madurai', emergencyContact:'9876543006', medicalHistory:'Asthma. Allergic to peanuts.', status:'ACTIVE', registeredAt:'2026-03-22T16:30:00Z', dateOfBirth:'2018-06-14', username:'divya_n', password:SEED_HASHES.patient },
      { id:'PAT-1007', name:'Suresh Babu', age:41, gender:'Male', contact:'9876543216', email:'suresh.b@email.com', bloodGroup:'A+', department:'General Medicine', assignedDoctor: DOCTORS[5], address:'34, Railway Colony, Trichy', emergencyContact:'9876543007', medicalHistory:'Hyperthyroidism. On medication.', status:'ACTIVE', registeredAt:'2026-02-18T13:00:00Z', dateOfBirth:'1985-09-30', username:'suresh_b', password:SEED_HASHES.patient },
      { id:'PAT-1008', name:'Anitha Joseph', age:36, gender:'Female', contact:'9876543217', email:'anitha.j@email.com', bloodGroup:'O+', department:'Cardiology', assignedDoctor: DOCTORS[6], address:'89, Church Road, Kottayam', emergencyContact:'9876543008', medicalHistory:'Mitral valve prolapse. Routine checkup.', status:'FOLLOWUP', registeredAt:'2026-04-05T10:15:00Z', dateOfBirth:'1990-03-11', username:'anitha_j', password:SEED_HASHES.patient },
      { id:'PAT-1009', name:'Ganesh Iyer', age:55, gender:'Male', contact:'9876543218', email:'ganesh.i@email.com', bloodGroup:'AB-', department:'Orthopaedics', assignedDoctor: DOCTORS[7], address:'101, Gandhi Nagar, Salem', emergencyContact:'9876543009', medicalHistory:'Lumbar spondylosis. Physiotherapy ongoing.', status:'ACTIVE', registeredAt:'2026-01-30T09:30:00Z', dateOfBirth:'1971-12-05', username:'ganesh_i', password:SEED_HASHES.patient },
      { id:'PAT-1010', name:'Meenalochini Devi', age:27, gender:'Female', contact:'9876543219', email:'meena.d@email.com', bloodGroup:'B+', department:'Dermatology', assignedDoctor: DOCTORS[8], address:'56, North Car Street, Tirunelveli', emergencyContact:'9876543010', medicalHistory:'Acne vulgaris. Skin sensitivity.', status:'ACTIVE', registeredAt:'2026-04-12T15:45:00Z', dateOfBirth:'1999-01-22', username:'meena_d', password:SEED_HASHES.patient },
      { id:'PAT-1011', name:'Kathirvel Pandian', age:48, gender:'Male', contact:'9876543220', email:'kathir.p@email.com', bloodGroup:'A-', department:'General Medicine', assignedDoctor: DOCTORS[9], address:'3A, Velachery Main Road, Chennai', emergencyContact:'9876543011', medicalHistory:'Hypertension & high cholesterol.', status:'DISCHARGED', registeredAt:'2026-03-05T07:00:00Z', dateOfBirth:'1978-07-16', username:'kathirvel_p', password:SEED_HASHES.patient },
      { id:'PAT-1012', name:'Revathi Krishnan', age:34, gender:'Female', contact:'9876543221', email:'revathi.k@email.com', bloodGroup:'O+', department:'Paediatrics', assignedDoctor: DOCTORS[10], address:'78, South Street, Thanjavur', emergencyContact:'9876543012', medicalHistory:'Postnatal checkup. Mother of twins.', status:'ACTIVE', registeredAt:'2026-04-20T12:00:00Z', dateOfBirth:'1992-04-08', username:'revathi_k', password:SEED_HASHES.patient }
    ];
    localStorage.setItem('medtrack_patients', JSON.stringify(patients));
  };

  // ── Appointment Helpers ─────────────────────────

  StorageDB.DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  StorageDB.getSlotTimes = function(doctorId) {
    var key = 'medtrack_config_' + doctorId;
    try {
      var saved = localStorage.getItem(key);
      if (saved) {
        var p = JSON.parse(saved);
        if (p.slotTimes && p.slotTimes.length === 5) return p.slotTimes;
      }
    } catch (e) {}
    return ['09:00', '10:00', '11:00', '14:00', '16:00'];
  };

  StorageDB.getSlotIndex = function(doctorId, appointmentDate, startTime) {
    var slotTimes = this.getSlotTimes(doctorId);
    var m = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) {
      m = startTime.match(/(\d+):(\d+)/);
      if (!m) return -1;
      var h = parseInt(m[1], 10);
      var min = m[2];
      return slotTimes.indexOf(String(h).padStart(2,'0') + ':' + min);
    }
    var h = parseInt(m[1], 10);
    var min = m[2];
    if ((m[3].toUpperCase() === 'PM') && h !== 12) h += 12;
    if ((m[3].toUpperCase() === 'AM') && h === 12) h = 0;
    return slotTimes.indexOf(String(h).padStart(2,'0') + ':' + min);
  };

  StorageDB.setSlotMarker = function(doctorId, appointmentDate, startTime, marker) {
    var dayName = this.DAY_NAMES[new Date(appointmentDate + 'T00:00:00').getDay()];
    var slotIdx = this.getSlotIndex(doctorId, appointmentDate, startTime);
    if (slotIdx === -1) return;
    var slots = JSON.parse(localStorage.getItem('medtrack_slots') || '{}');
    if (!slots[doctorId]) slots[doctorId] = {};
    if (!slots[doctorId][dayName]) slots[doctorId][dayName] = ['-','-','-','-','-'];
    if (slotIdx >= 0 && slotIdx < slots[doctorId][dayName].length) {
      slots[doctorId][dayName][slotIdx] = marker;
      localStorage.setItem('medtrack_slots', JSON.stringify(slots));
    }
  };

  var VALID_TRANSITIONS = {
    'Scheduled':  ['Cancelled', 'Completed', 'NoShow', 'InProgress'],
    'InProgress': ['Completed', 'NoShow'],
    'Completed':  [],
    'Cancelled':  [],
    'NoShow':     ['Scheduled']
  };

  StorageDB.setApptStatusAndSlot = function(apptId, newStatus, slotMarker) {
    var appts = this.getAppointments();
    var idx = appts.findIndex(function(a) { return a.id === apptId; });
    if (idx === -1) return false;
    var current = appts[idx].status || 'Scheduled';
    var allowed = VALID_TRANSITIONS[current];
    if (allowed && allowed.indexOf(newStatus) === -1) return false;
    appts[idx].status = newStatus;
    localStorage.setItem('medtrack_appointments', JSON.stringify(appts));
    if (slotMarker) {
      this.setSlotMarker(appts[idx].doctorId, appts[idx].appointmentDate, appts[idx].startTime, slotMarker);
    }
    return true;
  };

  StorageDB.isSlotAvailable = function(doctorId, appointmentDate, startTime) {
    var dayName = this.DAY_NAMES[new Date(appointmentDate + 'T00:00:00').getDay()];
    var slotIdx = this.getSlotIndex(doctorId, appointmentDate, startTime);
    if (slotIdx === -1) return false;
    var slots = JSON.parse(localStorage.getItem('medtrack_slots') || '{}');
    if (!slots[doctorId] || !slots[doctorId][dayName]) return true;
    var marker = slots[doctorId][dayName][slotIdx];
    return !marker || marker === '-' || marker === 'A';
  };

  StorageDB.registerAppointment = function(apptData) {
    if (this.isHoliday(apptData.appointmentDate)) {
      return false;
    }
    if (!this.isSlotAvailable(apptData.doctorId, apptData.appointmentDate, apptData.startTime)) {
      return false;
    }
    this.saveAppointment(apptData);
    this.setSlotMarker(apptData.doctorId, apptData.appointmentDate, apptData.startTime, 'K');
    return true;
  };

  // ── Hospital Holidays ───────────────────────────
  StorageDB.getHolidays = function() {
    const data = localStorage.getItem('medtrack_holidays');
    return data ? JSON.parse(data) : [];
  };

  StorageDB.getHolidayById = function(id) {
    return this.getHolidays().find(h => h.id === id);
  };

  // Accepts either YYYY-MM-DD or DD-MM-YYYY, returns canonical YYYY-MM-DD or null if invalid.
  StorageDB.normalizeHolidayDate = function(dateStr) {
    if (!dateStr) return null;
    dateStr = dateStr.trim();
    var isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var dmyMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    var y, m, d;
    if (isoMatch) {
      y = parseInt(isoMatch[1], 10); m = parseInt(isoMatch[2], 10); d = parseInt(isoMatch[3], 10);
    } else if (dmyMatch) {
      d = parseInt(dmyMatch[1], 10); m = parseInt(dmyMatch[2], 10); y = parseInt(dmyMatch[3], 10);
    } else {
      return null;
    }
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    var dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  };

  StorageDB.isHoliday = function(dateStr) {
    var iso = this.normalizeHolidayDate(dateStr) || dateStr;
    return this.getHolidays().some(h => h.date === iso);
  };

  StorageDB.generateHolidayId = function() {
    let maxId = 0;
    this.getHolidays().forEach(h => {
      const num = parseInt((h.id || '').replace('HOL-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return `HOL-${maxId + 1}`;
  };

  StorageDB.saveHoliday = function(holiday) {
    const holidays = this.getHolidays();
    holidays.push(holiday);
    holidays.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    localStorage.setItem('medtrack_holidays', JSON.stringify(holidays));
  };

  StorageDB.deleteHoliday = function(id) {
    const holidays = this.getHolidays().filter(h => h.id !== id);
    localStorage.setItem('medtrack_holidays', JSON.stringify(holidays));
  };

  StorageDB.cancelAppointment = function(apptId) {
    this.setApptStatusAndSlot(apptId, 'Cancelled', 'A');
  };

  StorageDB.completeAppointment = function(apptId) {
    this.setApptStatusAndSlot(apptId, 'Completed', 'C');
  };

  StorageDB.noShowAppointment = function(apptId) {
    this.setApptStatusAndSlot(apptId, 'NoShow', 'R');
  };

  StorageDB.getAppointments = function() {
    const data = localStorage.getItem('medtrack_appointments');
    return data ? JSON.parse(data) : [];
  };

  StorageDB.getAppointmentById = function(id) {
    return this.getAppointments().find(a => a.id === id);
  };

  StorageDB.saveAppointment = function(appt) {
    const appts = this.getAppointments();
    appts.push(appt);
    localStorage.setItem('medtrack_appointments', JSON.stringify(appts));
  };

  StorageDB.updateAppointment = function(updated) {
    const appts = this.getAppointments();
    const idx = appts.findIndex(a => a.id === updated.id);
    if (idx === -1) return;
    appts[idx] = updated;
    localStorage.setItem('medtrack_appointments', JSON.stringify(appts));
  };

  StorageDB.generateAppointmentCode = function() {
    let maxId = 1000;
    this.getAppointments().forEach(a => {
      const num = parseInt(a.id.replace('APT-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return `APT-${maxId + 1}`;
  };

  StorageDB.seedAppointmentData = function() {
    if (localStorage.getItem('medtrack_appointments')) return;
    const doctors = this.getDoctors();
    const patients = this.getPatients();
    if (!doctors.length || !patients.length) return;

    const slotTimes = ['09:00', '10:00', '11:00', '14:00', '16:00'];
    const statuses = ['Completed', 'Cancelled', 'Booked', 'NoShow', 'Completed'];
    const reasons = [
      'Annual checkup', 'Chest pain', 'Skin rash', 'Joint pain',
      'Fever and cough', 'Headache', 'Follow-up visit', 'Routine blood work',
      'Eye examination', 'Abdominal pain', 'Allergy consultation', 'Vaccination'
    ];
    const markerMap = { 'Booked': 'K', 'Completed': 'C', 'NoShow': 'R', 'Cancelled': 'A' };
    const appts = [];
    const today = new Date();

    for (let i = 0; i < 25; i++) {
      const pat = patients[i % patients.length];
      const doc = doctors[i % doctors.length];
      const dayOffset = Math.floor(i / doctors.length) % 3;
      const d = new Date(today);
      d.setDate(d.getDate() + (dayOffset - 1));
      const slotIdx = (i * 7) % 5;
      const startTime = slotTimes[slotIdx];
      const startH = parseInt(startTime.split(':')[0], 10);
      const endTime = `${String(startH + 1).padStart(2, '0')}:00`;
      const status = statuses[i % statuses.length];
      appts.push({
        id: `APT-${1024 + i}`,
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        doctorName: doc.name,
        department: doc.department,
        appointmentDate: d.toISOString().split('T')[0],
        startTime: startTime,
        endTime: endTime,
        status: status,
        reasonForVisit: reasons[i % reasons.length],
        notes: status === 'Completed' ? 'Patient responded well to treatment.' : '',
        createdAt: new Date(today.getTime() - (25 - i) * 3600000).toISOString()
      });
    }
    localStorage.setItem('medtrack_appointments', JSON.stringify(appts));

    // Sync slot markers for every seeded appointment
    const appts2 = JSON.parse(localStorage.getItem('medtrack_appointments') || '[]');
    appts2.forEach(function(a) {
      var marker = markerMap[a.status] || 'A';
      StorageDB.setSlotMarker(a.doctorId, a.appointmentDate, a.startTime, marker);
    });
  };

  StorageDB.releaseAllBookings = function() {
    var appts = this.getAppointments();
    appts.forEach(function(a) {
      if (a.status === 'Booked') {
        a.status = 'Cancelled';
        a.notes = 'Released by admin';
      }
    });
    localStorage.setItem('medtrack_appointments', JSON.stringify(appts));
    // Reset all slot markers to 'A' for every doctor
    var slots = JSON.parse(localStorage.getItem('medtrack_slots') || '{}');
    Object.keys(slots).forEach(function(docId) {
      Object.keys(slots[docId]).forEach(function(day) {
        for (var i = 0; i < slots[docId][day].length; i++) {
          if (slots[docId][day][i] !== '-') slots[docId][day][i] = 'A';
        }
      });
    });
    localStorage.setItem('medtrack_slots', JSON.stringify(slots));
  };

  // ── Prescription Helpers ─────────────────────────

  StorageDB.getPrescriptions = function() {
    const data = localStorage.getItem('medtrack_prescriptions');
    return data ? JSON.parse(data) : [];
  };

  StorageDB.savePrescription = function(rx) {
    const list = this.getPrescriptions();
    list.push(rx);
    localStorage.setItem('medtrack_prescriptions', JSON.stringify(list));
  };

  StorageDB.getPrescriptionsForPatient = function(patientId) {
    return this.getPrescriptions().filter(function(rx) { return rx.patientId === patientId; })
      .sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  };

  StorageDB.generatePrescriptionCode = function() {
    let maxId = 1000;
    this.getPrescriptions().forEach(function(rx) {
      const num = parseInt(rx.id.replace('PRX-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return 'PRX-' + (maxId + 1);
  };

  // ── Notification Helpers ─────────────────────────

  StorageDB.NOTIF_KEY = 'medtrack_notifications';

  StorageDB.getNotifications = function() {
    var data = localStorage.getItem(this.NOTIF_KEY);
    return data ? JSON.parse(data) : [];
  };

  StorageDB.saveNotification = function(notif) {
    var list = this.getNotifications();
    if (!notif.id) notif.id = this.generateNotificationId();
    if (!notif.createdAt) notif.createdAt = new Date().toISOString();
    list.unshift(notif);
    localStorage.setItem(this.NOTIF_KEY, JSON.stringify(list));
    return notif.id;
  };

  StorageDB.dispatchNotification = function(title, message, recipientType, recipientId, type) {
    this.saveNotification({
      type: type || 'info',
      title: title,
      message: message,
      recipientType: recipientType,
      recipientId: recipientId || null,
      read: false,
      senderId: 'system'
    });
  };

  StorageDB.getNotificationsForRecipient = function(recipientType, recipientId) {
    return this.getNotifications().filter(function(n) {
      if (n.recipientType === 'all' || n.recipientType === recipientType) {
        return !n.recipientId || n.recipientId === recipientId;
      }
      return false;
    });
  };

  StorageDB.markNotificationRead = function(id) {
    var list = this.getNotifications();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].read = true;
        break;
      }
    }
    localStorage.setItem(this.NOTIF_KEY, JSON.stringify(list));
  };

  StorageDB.markAllNotificationsRead = function(recipientType, recipientId) {
    var list = this.getNotifications();
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n.recipientType === 'all' || n.recipientType === recipientType) {
        if (!n.recipientId || n.recipientId === recipientId) {
          if (!n.read) changed = true;
          n.read = true;
        }
      }
    }
    if (changed) localStorage.setItem(this.NOTIF_KEY, JSON.stringify(list));
    return changed;
  };

  StorageDB.generateNotificationId = function() {
    var list = this.getNotifications();
    var max = 0;
    for (var i = 0; i < list.length; i++) {
      var parts = list[i].id.split('-');
      var num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return 'NOTIF-' + String(max + 1).padStart(3, '0');
  };

  StorageDB.getUnreadNotificationCount = function(recipientType, recipientId) {
    return this.getNotificationsForRecipient(recipientType, recipientId).filter(function(n) { return !n.read; }).length;
  };

  // On init, also seed patients and appointments if not present
  const origInit = StorageDB.init;
  StorageDB.init = function() {
    origInit.call(this);
    this.seedPatientData();
    this.seedAppointmentData();
    // One-time clear of all hardcoded notification data
    if (!localStorage.getItem('medtrack_notifications_cleared')) {
      localStorage.removeItem(this.NOTIF_KEY);
      localStorage.removeItem('medtrack_notifications_data');
      localStorage.setItem('medtrack_notifications_cleared', '1');
    }
  };

  // Migrate old doctor notification data into the central store on first load
  StorageDB.migrateOldDoctorNotifications = function() {
    var oldKey = 'medtrack_notifications_data';
    var oldData = localStorage.getItem(oldKey);
    if (!oldData) return;
    try {
      var oldList = JSON.parse(oldData);
      var currentList = this.getNotifications();
      var existingCount = currentList.length;
      if (existingCount > 20) return; // already migrated or has data
      var doctorId = sessionStorage.getItem('currentDoctorId') || 'DOC-1001';
      for (var i = 0; i < oldList.length; i++) {
        var o = oldList[i];
        var exists = currentList.some(function(n) { return n.id === o.id || (n.title === o.title && n.recipientId === doctorId); });
        if (!exists) {
          currentList.push({
            id: o.id || this.generateNotificationId(),
            type: o.type || 'info',
            title: o.title,
            message: o.desc,
            recipientType: 'doctor',
            recipientId: doctorId,
            read: !o.unread,
            createdAt: new Date().toISOString(),
            senderId: 'system'
          });
        }
      }
      localStorage.setItem(this.NOTIF_KEY, JSON.stringify(currentList));
    } catch (e) {}
    localStorage.removeItem(oldKey); // clean up old key
  };

  // ── Landing Page Content Management ─────────────────────────────────
  StorageDB.LANDING_KEY = 'medtrack_landing_content';
  StorageDB.LANDING_STATUS_KEY = 'medtrack_landing_status';

  StorageDB.DEFAULT_LANDING = {
    brand: { name: 'CityCare', subtitle: 'Hospital' },
    hero: {
      badge: 'Compassionate Care. Every Patient. Every Time.',
      heading: 'Welcome to CityCare Hospital',
      subheading: 'Delivering trusted healthcare with compassion, advanced technology, and a patient-first approach.',
      primaryCTA: 'Book Appointment',
      secondaryCTA: 'Patient Portal',
      bgImage: 'assets/images/hero_hospital.jpg'
    },
    about: {
      badge: 'About Us',
      heading: 'Caring for Our Community<br><span style="color: var(--primary-brand); white-space: nowrap;">Since 1995</span>',
      paras: [
        'CityCare Hospital has been a cornerstone of healthcare excellence, offering world-class medical services with a compassionate touch. Our team of dedicated professionals works tirelessly to ensure every patient receives personalized care.',
        'From advanced diagnostics to specialized treatments, we combine cutting-edge technology with a patient-first philosophy to deliver the best outcomes for our community.'
      ],
      stats: [
        { value: '500+', label: 'Staff Members' },
        { value: '50K+', label: 'Patients Treated' },
        { value: '30+', label: 'Years of Service' }
      ],
      values: [
        { icon: '❤️', title: 'Compassionate Care', desc: 'Every patient is treated with dignity, respect, and empathy.' },
        { icon: '🔬', title: 'Advanced Technology', desc: 'State-of-the-art medical equipment and modern treatment methods.' },
        { icon: '👨‍⚕️', title: 'Expert Team', desc: 'Highly qualified doctors and healthcare professionals at your service.' }
      ]
    },
    portals: [
      { title: 'Patient Portal', desc: 'Book appointments, view medical records, prescriptions and more.', link: 'features/auth/login.html?role=Patient' },
      { title: 'Doctor Portal', desc: 'Manage schedules, appointments and patients efficiently.', link: 'features/auth/login.html?role=Doctor' },
      { title: 'Administrator Portal', desc: 'Oversee hospital operations and manage administration.', link: 'features/auth/login.html?role=Admin' }
    ],
    departments: [
      { name: 'Cardiology', desc: 'Heart care, diagnostics, and cardiovascular treatments.', icon: '❤️' },
      { name: 'Orthopedics', desc: 'Bone, joint, and musculoskeletal treatments.', icon: '🦴' },
      { name: 'Dermatology', desc: 'Skin, hair, and nail health expert care.', icon: '🧴' },
      { name: 'General Medicine', desc: 'Comprehensive primary care and internal medicine.', icon: '🩺' },
      { name: 'Neurology', desc: 'Brain, spine, and nervous system expert care.', icon: '🧠' },
      { name: 'Pediatrics', desc: 'Specialized healthcare for infants, children, and adolescents.', icon: '👶' }
    ],
    facilities: [
      { name: 'ICU & Critical Care', desc: 'Advanced intensive care units with round-the-clock monitoring.', icon: '🏥' },
      { name: 'Diagnostic Labs', desc: 'Fully equipped pathology and radiology labs for accurate diagnosis.', icon: '🔬' },
      { name: 'Emergency & Trauma', desc: '24/7 emergency services with rapid response trauma care.', icon: '🚑' },
      { name: 'Pharmacy', desc: 'In-house pharmacy with a wide range of medications available.', icon: '💊' },
      { name: 'Inpatient Wards', desc: 'Comfortable private and shared rooms for patient recovery.', icon: '🛏️' },
      { name: 'Rehabilitation Center', desc: 'Physical therapy and rehabilitation programs for recovery.', icon: '🏋️' }
    ],
    stats: [
      { value: '25+', label: 'Doctors', icon: '🩺' },
      { value: '5', label: 'Departments', icon: '🏥' },
      { value: '500+', label: 'Patients Registered', icon: '👥' },
      { value: '1000+', label: 'Appointments Managed', icon: '📅' },
      { value: '24/7', label: 'Emergency Support', icon: '🚑' }
    ],
    standards: [
      { title: 'Safe & Hygienic', desc: 'Environment maintained to the highest health standards.' },
      { title: 'Secure Records', desc: 'Your patient records are kept strictly confidential.' },
      { title: 'Experienced Team', desc: 'Dedicated medical professionals for your care.' },
      { title: 'Patient-Centered', desc: 'Care focused entirely on your recovery and well-being.' }
    ],
    cta: {
      heading: 'Access CityCare Hospital Portal',
      desc: 'Manage your health seamlessly. Book appointments and view your medical records online.',
      buttonText: 'Book Appointment',
      button2Text: 'Patient Login',
      image: 'assets/images/cta_doctor_patient.jpg'
    },
    footer: {
      address: '123, Green Avenue, City Center, Your City, State - 123456',
      phone: '+91 98765 43210',
      email: 'info@citycarehospital.com',
      facebook: 'https://facebook.com/citycarehospital',
      twitter: 'https://twitter.com/citycarehospital',
      instagram: 'https://instagram.com/citycarehospital'
    }
  };

  StorageDB.getLandingContent = function() {
    var data = localStorage.getItem(this.LANDING_KEY);
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    var defaults = JSON.parse(JSON.stringify(this.DEFAULT_LANDING));
    localStorage.setItem(this.LANDING_KEY, JSON.stringify(defaults));
    return defaults;
  };

  StorageDB.saveLandingDraft = function(content) {
    localStorage.setItem(this.LANDING_KEY, JSON.stringify(content));
    localStorage.setItem(this.LANDING_STATUS_KEY, 'draft');
  };

  StorageDB.publishLanding = function(content) {
    localStorage.setItem(this.LANDING_KEY, JSON.stringify(content));
    localStorage.setItem(this.LANDING_STATUS_KEY, 'published');
    localStorage.setItem('medtrack_landing_published', JSON.stringify(content));
  };

  StorageDB.restoreDefaultLanding = function() {
    var defaults = JSON.parse(JSON.stringify(this.DEFAULT_LANDING));
    localStorage.setItem(this.LANDING_KEY, JSON.stringify(defaults));
    localStorage.setItem(this.LANDING_STATUS_KEY, 'default');
    localStorage.removeItem('medtrack_landing_published');
    return defaults;
  };

  StorageDB.getLandingStatus = function() {
    return localStorage.getItem(this.LANDING_STATUS_KEY) || 'default';
  };

  StorageDB.getPublishedLanding = function() {
    var data = localStorage.getItem('medtrack_landing_published');
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    return null;
  };

  // ── Audit Logs ───────────────────────────────────────────────────────
  StorageDB.AUDIT_KEY = 'citycare_audit_logs';

  StorageDB.DEFAULT_AUDIT_LOGS = [];

  StorageDB.getAuditLogs = function() {
    var data = localStorage.getItem(this.AUDIT_KEY);
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    var defaults = JSON.parse(JSON.stringify(this.DEFAULT_AUDIT_LOGS));
    localStorage.setItem(this.AUDIT_KEY, JSON.stringify(defaults));
    return defaults;
  };

  StorageDB.addAuditLog = function(user, action, resource, details, severity) {
    var logs = this.getAuditLogs();
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var ts = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) + ' ' +
             pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    logs.unshift({
      id: 'AUDIT-' + Date.now(),
      ts: ts,
      user: user || 'System',
      action: action || 'Unknown',
      resource: resource || '',
      details: details || '',
      severity: severity || 'Info'
    });
    localStorage.setItem(this.AUDIT_KEY, JSON.stringify(logs));
    return logs;
  };

  // ── Admin Credentials ────────────────────────────────────────────────
  StorageDB.ADMIN_KEY = 'citycare_admin_creds';

  StorageDB.getAdminCredentials = function() {
    var data = localStorage.getItem(this.ADMIN_KEY);
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    var creds = { username: 'admin_root', password: SEED_HASHES.admin };
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(creds));
    return creds;
  };

  StorageDB.hashPassword = function(plain) {
    return _simpleHash(plain);
  };

  StorageDB.escapeHtml = function(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  };

  StorageDB.validateAdmin = function(username, password) {
    var creds = this.getAdminCredentials();
    return creds.username === username && _simpleHash(password) === creds.password;
  };

  // ── System Settings ──────────────────────────────────────────────────
  StorageDB.SETTINGS_KEY = 'citycare_settings';

  StorageDB.DEFAULT_SETTINGS = {
    language: 'English (US)',
    theme: 'system',
    timezone: 'UTC-5 (Eastern)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD ($)',
    emailNotifications: true,
    smsAlerts: true,
    pushNotifications: false,
    autoBackup: true,
    sessionTimeout: 30,
    passwordPolicy: 'Standard (8+ chars, letters + numbers)',
    mfaEnabled: true
  };

  StorageDB.getSettings = function() {
    var data = localStorage.getItem(this.SETTINGS_KEY);
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    var defaults = JSON.parse(JSON.stringify(this.DEFAULT_SETTINGS));
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  };

  StorageDB.saveSettings = function(settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  };
  StorageDB.BACKUP_KEYS = [
    'medtrack_departments','medtrack_doctors','medtrack_patients','medtrack_appointments',
    'medtrack_shifts','medtrack_slots','medtrack_notifications','medtrack_landing_content',
    'medtrack_landing_status','medtrack_holidays','medtrack_version',
    'citycare_audit_logs','citycare_admin_creds','citycare_settings','citycare_theme'
  ];

  StorageDB.exportAllData = function() {
    var backup = {};
    this.BACKUP_KEYS.forEach(function(key) {
      var val = localStorage.getItem(key);
      if (val !== null) backup[key] = val;
    });
    backup._meta = { exportedAt: new Date().toISOString(), version: localStorage.getItem('medtrack_version') || '3' };
    return JSON.stringify(backup, null, 2);
  };

  StorageDB.importAllData = function(jsonString) {
    var data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object' || !data._meta) throw new Error('Invalid backup file format');
    var keys = Object.keys(data).filter(function(k) { return k !== '_meta'; });
    keys.forEach(function(key) { localStorage.setItem(key, data[key]); });
    return { keysRestored: keys.length, exportedAt: data._meta.exportedAt };
  };

  StorageDB.init();
  window.StorageDB = StorageDB;
})();
