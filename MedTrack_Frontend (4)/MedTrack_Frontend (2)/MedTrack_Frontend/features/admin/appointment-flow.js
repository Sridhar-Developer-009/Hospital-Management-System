// features/admin/appointment-flow.js

let _apptViewSearchQuery = '';
let _apptViewPage = 1;
const APPT_ITEMS_PER_PAGE = 10;
let _viewApptDetailId = null;
let _currentModifyApptId = null;

// ── Screen Navigation ─────────────────────────
function showScreen(screenId) {
  document.querySelectorAll('.flow-screen').forEach(el => el.style.display = 'none');
  document.getElementById(screenId).style.display = 'block';

  const backBtn = document.getElementById('btn-flow-back');
  const subtitle = document.getElementById('flow-subtitle');

  if (screenId === 'screen-home') {
    backBtn.style.display = 'none';
    subtitle.innerText = 'Select an action to proceed.';
    updateMicroBreadcrumb('');

    const form = document.getElementById('form-register-appointment');
    if (form) {
      form.reset();
      document.querySelectorAll('#form-register-appointment .text-danger.small').forEach(el => el.classList.add('d-none'));
    }
    const overlay = document.getElementById('appt-reg-success-overlay');
    if (overlay) {
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      const icon = document.getElementById('appt-reg-success-icon');
      if (icon) icon.style.transform = 'scale(0)';
      const tick = document.getElementById('appt-reg-success-tick');
      if (tick) tick.style.strokeDashoffset = '40';
    }
  } else {
    backBtn.style.display = 'block';
  }

  if (screenId === 'screen-register') {
    subtitle.innerText = 'Register New Appointment';
    updateMicroBreadcrumb('Register Appointment');
    const form = document.getElementById('form-register-appointment');
    if (form) {
      form.reset();
      document.querySelectorAll('#form-register-appointment .text-danger.small').forEach(el => el.classList.add('d-none'));
    }
    const overlay = document.getElementById('appt-reg-success-overlay');
    if (overlay) {
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      const icon = document.getElementById('appt-reg-success-icon');
      if (icon) icon.style.transform = 'scale(0)';
      const tick = document.getElementById('appt-reg-success-tick');
      if (tick) tick.style.strokeDashoffset = '40';
    }
    populateApptFormDropdowns();
  }
  if (screenId === 'screen-view') {
    subtitle.innerText = 'View Appointments';
    updateMicroBreadcrumb('View Appointments');
    document.getElementById('screen-view').style.display = '';
    document.getElementById('screen-view-detail').style.display = 'none';
    renderViewAppts();
  }
  if (screenId === 'screen-view-detail') {
    subtitle.innerText = 'View Appointment';
    if (_viewApptDetailId) {
      const a = StorageDB.getAppointmentById(_viewApptDetailId);
      if (a) {
        updateMicroBreadcrumb(a.id);
        renderApptViewDetail(a);
      }
    }
  }
  if (screenId === 'screen-modify') {
    subtitle.innerText = 'Modify Appointment';
    updateMicroBreadcrumb('Modify Appointment');
    showApptModifyList();
  }
}

function updateMicroBreadcrumb(label) {
  const sep = document.getElementById('crumb-mic-sep');
  const crumb = document.getElementById('crumb-mic');
  if (!label) {
    sep.style.display = 'none';
    crumb.style.display = 'none';
    crumb.innerText = '';
  } else {
    sep.style.display = '';
    crumb.style.display = '';
    crumb.innerText = label;
  }
}

// ── Register Helpers ───────────────────────────
function populateApptFormDropdowns() {
  const patientSelect = document.getElementById('reg-appt-patient');
  const doctorSelect = document.getElementById('reg-appt-doctor');
  const deptInput = document.getElementById('reg-appt-dept');
  if (!patientSelect || !doctorSelect) return;

  const patients = StorageDB.getActivePatients();
  patientSelect.innerHTML = '<option value="">Select Patient</option>' +
    patients.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.id})</option>`).join('');

  const doctors = StorageDB.getActiveDoctors();
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>' +
    doctors.map(d => `<option value="${d.id}" data-name="${d.name}" data-dept="${d.department}">${d.name} (${d.id})</option>`).join('');

  if (deptInput) deptInput.value = '';

  const updateDept = () => {
    const selected = doctorSelect.options[doctorSelect.selectedIndex];
    if (selected && selected.dataset.dept) {
      if (deptInput) deptInput.value = selected.dataset.dept;
    } else {
      if (deptInput) deptInput.value = '';
    }
  };
  doctorSelect.removeEventListener('change', updateDept);
  doctorSelect.addEventListener('change', updateDept);
}

function handleApptRegisterSave() {
  const patientEl = document.getElementById('reg-appt-patient');
  const doctorEl = document.getElementById('reg-appt-doctor');
  const dateEl = document.getElementById('reg-appt-date');
  const timeEl = document.getElementById('reg-appt-time');
  const reasonEl = document.getElementById('reg-appt-reason');

  const patientId = patientEl.value;
  const doctorId = doctorEl.value;
  const apptDate = dateEl.value;
  const apptTime = timeEl.value;
  const reason = reasonEl.value.trim();

  let valid = true;
  const showErr = (id, cond) => {
    const el = document.getElementById(id);
    if (cond) { el.classList.remove('d-none'); valid = false; }
    else el.classList.add('d-none');
  };
  showErr('reg-appt-patient-error', !patientId);
  showErr('reg-appt-doctor-error', !doctorId);
  showErr('reg-appt-date-error', !apptDate);
  showErr('reg-appt-time-error', !apptTime);
  if (!valid) return;

  const patient = StorageDB.getPatientById(patientId);
  const doctor = StorageDB.getDoctorById(doctorId);
  if (!patient || !doctor) return;

  const timeParts = apptTime.split(':');
  const h = parseInt(timeParts[0], 10);
  const m = parseInt(timeParts[1], 10);
  const endH = m + 30 >= 60 ? h + 1 : h;
  const endM = (m + 30) % 60;

  const appt = {
    id: StorageDB.generateAppointmentCode(),
    patientId: patient.id,
    patientName: patient.name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    department: doctor.department,
    appointmentDate: apptDate,
    startTime: apptTime,
    endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    status: 'Booked',
    reasonForVisit: reason || 'General checkup',
    notes: '',
    createdAt: new Date().toISOString()
  };

  StorageDB.registerAppointment(appt);

  const info = document.getElementById('appt-reg-success-info');
  info.innerText = `${appt.id} — ${patient.name} with ${doctor.name} on ${apptDate} at ${apptTime}`;
  const overlay = document.getElementById('appt-reg-success-overlay');
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  requestAnimationFrame(() => {
    const icon = document.getElementById('appt-reg-success-icon');
    const tick = document.getElementById('appt-reg-success-tick');
    if (icon) icon.style.transform = 'scale(1)';
    if (tick) tick.style.strokeDashoffset = '0';
  });
}

function resetApptRegisterForm() {
  document.getElementById('form-register-appointment').reset();
  const overlay = document.getElementById('appt-reg-success-overlay');
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  const icon = document.getElementById('appt-reg-success-icon');
  const tick = document.getElementById('appt-reg-success-tick');
  if (icon) icon.style.transform = 'scale(0)';
  if (tick) tick.style.strokeDashoffset = '40';
  document.querySelectorAll('#form-register-appointment .text-danger.small').forEach(el => el.classList.add('d-none'));
  populateApptFormDropdowns();
}

// ── View Appointments ──────────────────────────
function renderViewAppts() {
  const all = StorageDB.getAppointments();
  const q = (_apptViewSearchQuery || '').toLowerCase().trim();

  let working = all;
  if (q) {
    working = all.map(a => {
      let score = 0;
      const idL = (a.id || '').toLowerCase();
      const pn = (a.patientName || '').toLowerCase();
      const dn = (a.doctorName || '').toLowerCase();
      const d = (a.department || '').toLowerCase();
      const s = (a.status || '').toLowerCase();
      if (idL === q || pn === q || dn === q) score = 100;
      else if (idL.startsWith(q) || pn.startsWith(q) || dn.startsWith(q)) score = 80;
      else if (idL.includes(q) || pn.includes(q) || dn.includes(q)) score = 60;
      if (d.includes(q)) score += 30;
      if (s.includes(q)) score += 20;
      if (a.appointmentDate && a.appointmentDate.includes(q)) score += 25;
      return { doc: a, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.doc);
  }

  const tbody = document.getElementById('view-appt-tbody');
  tbody.innerHTML = '';

  const start = (_apptViewPage - 1) * APPT_ITEMS_PER_PAGE;
  const end = start + APPT_ITEMS_PER_PAGE;
  const page = working.slice(start, end);

  page.forEach((a, idx) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => showApptViewDetail(a.id);
    const statusClass = a.status === 'Booked' ? 'bg-warning text-dark' :
      a.status === 'Completed' ? 'bg-success' :
      a.status === 'Cancelled' ? 'bg-secondary' :
      a.status === 'NoShow' ? 'bg-danger' : 'bg-info';
    const displayTime = formatTime12(a.startTime);
    tr.innerHTML = `
      <td class="text-muted fw-medium">${start + idx + 1}</td>
      <td class="fw-bold">${a.id}</td>
      <td>${a.patientName}</td>
      <td>${a.doctorName}</td>
      <td class="text-muted">${a.department}</td>
      <td>${a.appointmentDate}</td>
      <td>${displayTime}</td>
      <td><span class="badge ${statusClass}">${a.status}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();showApptViewDetail('${a.id}')">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('view-appt-page-info').innerText =
    q ? `Found ${working.length} result${working.length !== 1 ? 's' : ''} for "${_apptViewSearchQuery}"`
      : `Showing ${working.length ? start + 1 : 0}-${Math.min(end, working.length)} of ${working.length} appointment${working.length !== 1 ? 's' : ''}`;

  const prev = document.getElementById('btn-appt-prev-page');
  const next = document.getElementById('btn-appt-next-page');
  if (prev) { prev.disabled = _apptViewPage === 1; prev.onclick = () => { if (_apptViewPage > 1) { _apptViewPage--; renderViewAppts(); } }; }
  if (next) { next.disabled = end >= working.length; next.onclick = () => { if (end < working.length) { _apptViewPage++; renderViewAppts(); } }; }
}

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function showApptViewList() {
  showScreen('screen-view');
}

function showApptViewDetail(id) {
  _viewApptDetailId = id;
  showScreen('screen-view-detail');
}

function renderApptViewDetail(a) {
  const card = document.getElementById('view-appt-detail-card');
  const statusClass = a.status === 'Booked' ? 'bg-warning text-dark' :
    a.status === 'Completed' ? 'bg-success' :
    a.status === 'Cancelled' ? 'bg-secondary' :
    a.status === 'NoShow' ? 'bg-danger' : 'bg-info';
  card.innerHTML = `
    <div class="row g-4">
      <div class="col-12 d-flex align-items-center gap-3 pb-2 border-bottom">
        <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:48px;height:48px;background:var(--primary-brand);font-size:1.1rem;">${(a.patientName || 'A').substring(0, 2).toUpperCase()}</div>
        <div>
          <h5 class="fw-bold mb-0">${a.patientName}</h5>
          <span class="text-muted small">${a.id} &bull; ${a.department}</span>
        </div>
        <div class="ms-auto">
          <span class="badge ${statusClass} fs-6">${a.status}</span>
        </div>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Doctor</p>
        <h6>${a.doctorName}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Department</p>
        <h6>${a.department}</h6>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Date</p>
        <h6>${a.appointmentDate}</h6>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Start Time</p>
        <h6>${formatTime12(a.startTime)}</h6>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>End Time</p>
        <h6>${formatTime12(a.endTime)}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Patient</p>
        <h6>${a.patientName} (${a.patientId})</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Reason for Visit</p>
        <h6>${a.reasonForVisit || 'Not specified'}</h6>
      </div>
      ${a.notes ? `<div class="col-12"><p class="text-muted small mb-1">Notes</p><h6>${a.notes}</h6></div>` : ''}
    </div>
  `;
}

let _modifyApptSearchQuery = '';

// ── Modify Appointments ────────────────────────
function showApptModifyList() {
  document.getElementById('modify-appt-field-view').style.display = 'none';
  document.getElementById('modify-appt-list-view').style.display = 'block';
  _currentModifyApptId = null;

  const all = StorageDB.getAppointments();
  const q = (_modifyApptSearchQuery || '').toLowerCase().trim();

  let filtered = all;
  if (q) {
    filtered = all.map(a => {
      let score = 0;
      const idL = (a.id || '').toLowerCase();
      const pn = (a.patientName || '').toLowerCase();
      const dn = (a.doctorName || '').toLowerCase();
      const s = (a.status || '').toLowerCase();
      if (idL === q || pn === q || dn === q) score = 100;
      else if (idL.startsWith(q) || pn.startsWith(q) || dn.startsWith(q)) score = 80;
      else if (idL.includes(q) || pn.includes(q) || dn.includes(q)) score = 60;
      if (s.includes(q)) score += 20;
      if (a.appointmentDate && a.appointmentDate.includes(q)) score += 15;
      return { doc: a, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.doc);
  }

  const tbody = document.getElementById('modify-appt-tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No appointments found.</td></tr>';
    return;
  }

  filtered.forEach(a => {
    const tr = document.createElement('tr');
    const statusClass = a.status === 'Booked' ? 'bg-warning text-dark' :
      a.status === 'Completed' ? 'bg-success' :
      a.status === 'Cancelled' ? 'bg-secondary' :
      a.status === 'NoShow' ? 'bg-danger' : 'bg-info';
    tr.innerHTML = `
      <td class="fw-bold">${a.id}</td>
      <td>${a.patientName}</td>
      <td>${a.doctorName}</td>
      <td>${a.appointmentDate}</td>
      <td><span class="badge ${statusClass}">${a.status}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="openApptModify('${a.id}')">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function openApptModify(id) {
  _currentModifyApptId = id;
  const a = StorageDB.getAppointmentById(id);
  if (!a) return;

  document.getElementById('modify-appt-list-view').style.display = 'none';
  document.getElementById('modify-appt-field-view').style.display = 'block';

  document.getElementById('modify-appt-avatar').innerText = (a.patientName || 'A').substring(0, 2).toUpperCase();
  document.getElementById('modify-appt-id-label').innerText = `${a.id} - ${a.patientName}`;
  document.getElementById('modify-appt-summary-label').innerText = `${a.doctorName} \u2022 ${a.appointmentDate} \u2022 ${formatTime12(a.startTime)}`;

  const statusSelect = document.getElementById('modify-appt-status-select');
  statusSelect.value = a.status;
  document.getElementById('modify-appt-status-warning').style.display = 'none';

  renderApptModifyFields(a);
}

function renderApptModifyFields(a) {
  const container = document.getElementById('modify-appt-fields');
  const fields = [
    { label: 'Patient', key: 'patientName', value: a.patientName, type: 'text', readonly: true },
    { label: 'Doctor', key: 'doctorName', value: a.doctorName, type: 'text', readonly: true },
    { label: 'Department', key: 'department', value: a.department, type: 'text', readonly: true },
    { label: 'Appointment Date', key: 'appointmentDate', value: a.appointmentDate, type: 'date' },
    { label: 'Start Time', key: 'startTime', value: a.startTime, type: 'time' },
    { label: 'Reason for Visit', key: 'reasonForVisit', value: a.reasonForVisit || 'Not specified', type: 'text' },
    { label: 'Notes', key: 'notes', value: a.notes || '', type: 'textarea' }
  ];

  container.innerHTML = fields.map(f => {
    const currentDisplay = f.type === 'time' ? formatTime12(f.value) : f.value || 'Not set';
    return `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <span class="text-muted small">${f.label}</span>
          <div class="fw-medium">${f.readonly ? currentDisplay : (currentDisplay)}</div>
        </div>
        ${f.readonly ? '' : `<button class="btn btn-sm btn-outline-secondary" onclick="openApptFieldEditor('${f.key}', '${f.label}', '${f.type}')">Edit</button>`}
      </div>
    `;
  }).join('');
}

function openApptFieldEditor(field, label, type) {
  const a = StorageDB.getAppointmentById(_currentModifyApptId);
  if (!a) return;

  const modalTitle = document.getElementById('actionModalLabel');
  const modalBody = document.getElementById('actionModalBody');
  const modalSubmit = document.getElementById('actionModalSubmit');
  const modal = new bootstrap.Modal(document.getElementById('actionModal'));

  modalTitle.innerText = `Edit ${label}`;
  const currentValue = a[field] || '';

  let inputHtml = '';
  let validationFn = () => true;
  let errorMsg = '';

  if (type === 'date') {
    inputHtml = `<input type="date" class="form-control" id="modal-appt-field-input" value="${currentValue}">`;
    validationFn = v => !!v;
    errorMsg = 'Date is required.';
  } else if (type === 'time') {
    const timeOpts = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'];
    inputHtml = `<select class="form-control" id="modal-appt-field-input">${timeOpts.map(t => `<option value="${t}" ${t === currentValue ? 'selected' : ''}>${formatTime12(t)}</option>`).join('')}</select>`;
    validationFn = v => !!v;
    errorMsg = 'Time is required.';
  } else if (type === 'textarea') {
    inputHtml = `<textarea class="form-control" id="modal-appt-field-input" rows="3">${currentValue}</textarea>`;
  } else {
    inputHtml = `<input type="text" class="form-control" id="modal-appt-field-input" value="${currentValue.replace(/"/g, '&quot;')}">`;
    if (field === 'reasonForVisit') {
      validationFn = v => v.trim().length > 0;
      errorMsg = 'Reason is required.';
    }
  }

  modalBody.innerHTML = `
    <p class="text-muted small mb-2">Current: <strong>${currentValue || 'Not set'}</strong></p>
    <div class="mb-2">${inputHtml}</div>
    <div class="text-danger small d-none" id="modal-appt-field-error">${errorMsg}</div>
  `;

  const newSubmit = modalSubmit.cloneNode(true);
  modalSubmit.parentNode.replaceChild(newSubmit, modalSubmit);

  newSubmit.addEventListener('click', () => {
    const input = document.getElementById('modal-appt-field-input');
    const errorEl = document.getElementById('modal-appt-field-error');
    const newVal = input.value;

    if (!validationFn(newVal)) {
      if (errorEl) errorEl.classList.remove('d-none');
      return;
    }
    if (errorEl) errorEl.classList.add('d-none');

    if (!confirm(`Update ${label} to "${newVal}"?`)) return;

    const updated = StorageDB.getAppointmentById(_currentModifyApptId);
    if (!updated) return;

    if (field === 'startTime') {
      const parts = newVal.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const endH = m + 30 >= 60 ? h + 1 : h;
      const endM = (m + 30) % 60;
      updated.endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    updated[field] = newVal;

    StorageDB.updateAppointment(updated);
    modal.hide();
    openApptModify(_currentModifyApptId);
  });

  modal.show();
}

function handleApptStatusChange() {
  const a = StorageDB.getAppointmentById(_currentModifyApptId);
  if (!a) return;

  const select = document.getElementById('modify-appt-status-select');
  const newStatus = select.value;
  const warning = document.getElementById('modify-appt-status-warning');

  if (newStatus === a.status) {
    warning.style.display = 'none';
    return;
  }

  if (!confirm(`Change status from "${a.status}" to "${newStatus}"?`)) {
    select.value = a.status;
    return;
  }

  warning.style.display = 'block';
  var slotMarker = null;
  if (newStatus === 'Cancelled') slotMarker = 'A';
  else if (newStatus === 'Completed') slotMarker = 'C';
  else if (newStatus === 'NoShow') slotMarker = 'R';
  StorageDB.setApptStatusAndSlot(a.id, newStatus, slotMarker);
  document.getElementById('modify-appt-summary-label').innerText = `${a.doctorName} \u2022 ${a.appointmentDate} \u2022 ${formatTime12(a.startTime)}`;
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('view-appt-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _apptViewSearchQuery = searchInput.value;
      _apptViewPage = 1;
      renderViewAppts();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = _apptViewSearchQuery.toLowerCase().trim();
        if (!q) return;
        const best = StorageDB.getAppointments().map(a => {
          let score = 0;
          const idL = (a.id || '').toLowerCase();
          const pn = (a.patientName || '').toLowerCase();
          const dn = (a.doctorName || '').toLowerCase();
          if (idL === q || pn === q || dn === q) score = 100;
          else if (idL.startsWith(q) || pn.startsWith(q) || dn.startsWith(q)) score = 80;
          else if (idL.includes(q) || pn.includes(q) || dn.includes(q)) score = 60;
          return { doc: a, score };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
        if (best.length > 0) showApptViewDetail(best[0].doc.id);
        e.preventDefault();
      }
    });
  }

  const modifySearchInput = document.getElementById('modify-appt-search-input');
  if (modifySearchInput) {
    modifySearchInput.addEventListener('input', () => {
      _modifyApptSearchQuery = modifySearchInput.value;
      showApptModifyList();
    });
  }

  showScreen('screen-home');
});
