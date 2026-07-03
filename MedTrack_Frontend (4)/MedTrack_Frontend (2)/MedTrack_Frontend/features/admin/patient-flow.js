// features/admin/patient-flow.js

let _patientViewSearchQuery = '';
let _patientViewPage = 1;
const PATIENT_ITEMS_PER_PAGE = 10;
let _viewPatientDetailId = null;
let _currentModifyPatientId = null;

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
  } else {
    backBtn.style.display = 'block';
  }

  if (screenId === 'screen-register') {
    subtitle.innerText = 'Register New Patient';
    updateMicroBreadcrumb('Register Patient');
    populatePatientDoctorDropdown();
  }
  if (screenId === 'screen-view') {
    subtitle.innerText = 'View Patient Profiles';
    updateMicroBreadcrumb('View Patients');
    document.getElementById('screen-view').style.display = '';
    document.getElementById('screen-view-detail').style.display = 'none';
    renderViewPatients();
  }
  if (screenId === 'screen-view-detail') {
    subtitle.innerText = 'View Patient Profile';
    if (_viewPatientDetailId) {
      const p = StorageDB.getPatientById(_viewPatientDetailId);
      if (p) {
        updateMicroBreadcrumb(p.name);
        renderPatientViewDetail(p);
      }
    }
  }
  if (screenId === 'screen-modify') {
    subtitle.innerText = 'Modify Patient Record';
    updateMicroBreadcrumb('Modify Patient');
    showPatientModifyList();
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
function populatePatientDoctorDropdown() {
  const deptSelect = document.getElementById('reg-patient-dept');
  const docSelect = document.getElementById('reg-patient-doctor');
  if (!deptSelect || !docSelect) return;

  const updateDoctors = () => {
    const dept = deptSelect.value;
    docSelect.innerHTML = '<option value="">Select Doctor</option>';
    if (!dept) return;
    const docs = StorageDB.getDoctors().filter(d => d.department === dept && d.status === 'ACTIVE');
    docs.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = d.name;
      docSelect.appendChild(opt);
    });
  };
  deptSelect.removeEventListener('change', updateDoctors);
  deptSelect.addEventListener('change', updateDoctors);
}

function handlePatientRegisterSave() {
  const name = document.getElementById('reg-patient-name').value.trim();
  const dob = document.getElementById('reg-patient-dob').value;
  const gender = document.getElementById('reg-patient-gender').value;
  const contact = document.getElementById('reg-patient-contact').value.trim();
  const email = document.getElementById('reg-patient-email').value.trim();
  const blood = document.getElementById('reg-patient-blood').value;
  const dept = document.getElementById('reg-patient-dept').value;
  const doctor = document.getElementById('reg-patient-doctor').value;
  const address = document.getElementById('reg-patient-address').value.trim();
  const ec = document.getElementById('reg-patient-ec').value.trim();
  const history = document.getElementById('reg-patient-history').value.trim();

  let valid = true;
  const showErr = (id, cond) => {
    const el = document.getElementById(id);
    if (cond) { el.classList.remove('d-none'); valid = false; }
    else el.classList.add('d-none');
  };
  showErr('reg-patient-name-error', !name);
  showErr('reg-patient-gender-error', !gender);
  showErr('reg-patient-contact-error', !/^\d{10}$/.test(contact));
  showErr('reg-patient-dept-error', !dept);
  if (!valid) return;

  const age = dob ? Math.floor((new Date() - new Date(dob)) / 31557600000) : 0;

  const patient = {
    id: StorageDB.generatePatientCode(),
    name, age, gender, contact, email,
    bloodGroup: blood || 'Unknown',
    department: dept,
    assignedDoctor: doctor || 'Unassigned',
    address: address || 'N/A',
    emergencyContact: ec || 'N/A',
    medicalHistory: history || 'No records.',
    status: 'ACTIVE',
    registeredAt: new Date().toISOString(),
    dateOfBirth: dob || ''
  };

  StorageDB.savePatient(patient);

  const overlay = document.getElementById('patient-reg-success-overlay');
  const info = document.getElementById('patient-reg-success-info');
  info.innerText = `${patient.name} (${patient.id}) registered successfully.`;
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  requestAnimationFrame(() => {
    const icon = document.getElementById('patient-reg-success-icon');
    const tick = document.getElementById('patient-reg-success-tick');
    if (icon) icon.style.transform = 'scale(1)';
    if (tick) tick.style.strokeDashoffset = '0';
  });
}

function resetPatientRegisterForm() {
  document.getElementById('form-register-patient').reset();
  const overlay = document.getElementById('patient-reg-success-overlay');
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  const icon = document.getElementById('patient-reg-success-icon');
  const tick = document.getElementById('patient-reg-success-tick');
  if (icon) icon.style.transform = 'scale(0)';
  if (tick) tick.style.strokeDashoffset = '40';
  document.querySelectorAll('#form-register-patient .text-danger.small').forEach(el => el.classList.add('d-none'));
  populatePatientDoctorDropdown();
}

// ── View Patients ──────────────────────────────
function renderViewPatients() {
  const all = StorageDB.getPatients();
  const q = (_patientViewSearchQuery || '').toLowerCase().trim();

  let working = all;
  if (q) {
    working = all.map(p => {
      let score = 0;
      const n = (p.name || '').toLowerCase();
      const idL = (p.id || '').toLowerCase();
      const d = (p.department || '').toLowerCase();
      const c = p.contact || '';
      if (n === q || idL === q) score = 100;
      else if (n.startsWith(q) || idL.startsWith(q)) score = 80;
      else if (n.includes(q) || idL.includes(q)) score = 60;
      if (c === q) score = 90;
      else if (c.includes(q)) score = 50;
      if (p.email && p.email.toLowerCase().includes(q)) score += 45;
      if (d.includes(q)) score += 30;
      if (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(q)) score += 25;
      if (p.bloodGroup && p.bloodGroup.toLowerCase().includes(q)) score += 20;
      if (p.gender && p.gender.toLowerCase().includes(q)) score += 10;
      if (p.status && p.status.toLowerCase().includes(q)) score += 10;
      if (p.address && p.address.toLowerCase().includes(q)) score += 10;
      return { doc: p, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.doc);
  }

  const tbody = document.getElementById('view-patient-tbody');
  tbody.innerHTML = '';

  const start = (_patientViewPage - 1) * PATIENT_ITEMS_PER_PAGE;
  const end = start + PATIENT_ITEMS_PER_PAGE;
  const page = working.slice(start, end);

  page.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => showPatientViewDetail(p.id);
    tr.innerHTML = `
      <td class="text-muted fw-medium">${start + idx + 1}</td>
      <td class="fw-bold">${p.id}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:28px;height:28px;background:var(--primary-brand);font-size:0.7rem;">${p.name.substring(0, 2).toUpperCase()}</div>
          ${p.name}
        </div>
      </td>
      <td>${p.age}</td>
      <td>${p.gender || '-'}</td>
      <td>${p.department}</td>
      <td class="text-muted">${p.contact}</td>
      <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : p.status === 'INPATIENT' ? 'bg-warning text-dark' : p.status === 'FOLLOWUP' ? 'bg-info text-dark' : 'bg-secondary'}">${p.status}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();showPatientViewDetail('${p.id}')">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('view-patient-page-info').innerText =
    q ? `Found ${working.length} result${working.length !== 1 ? 's' : ''} for "${_patientViewSearchQuery}"`
      : `Showing ${working.length ? start + 1 : 0}-${Math.min(end, working.length)} of ${working.length} patient${working.length !== 1 ? 's' : ''}`;

  const prev = document.getElementById('btn-patient-prev-page');
  const next = document.getElementById('btn-patient-next-page');
  if (prev) { prev.disabled = _patientViewPage === 1; prev.onclick = () => { if (_patientViewPage > 1) { _patientViewPage--; renderViewPatients(); } }; }
  if (next) { next.disabled = end >= working.length; next.onclick = () => { if (end < working.length) { _patientViewPage++; renderViewPatients(); } }; }
}

function showPatientViewList() {
  showScreen('screen-view');
}

function showPatientViewDetail(id) {
  _viewPatientDetailId = id;
  showScreen('screen-view-detail');
}

function renderPatientViewDetail(p) {
  const card = document.getElementById('view-patient-detail-card');
  card.innerHTML = `
    <div class="row g-4">
      <div class="col-12 d-flex align-items-center gap-3 pb-2 border-bottom">
        <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:48px;height:48px;background:var(--primary-brand);font-size:1.1rem;">${p.name.substring(0, 2).toUpperCase()}</div>
        <div>
          <h5 class="fw-bold mb-0">${p.name}</h5>
          <span class="text-muted small">${p.id} &bull; ${p.department}</span>
        </div>
        <div class="ms-auto">
          <span class="badge ${p.status === 'ACTIVE' ? 'bg-success fs-6' : p.status === 'INPATIENT' ? 'bg-warning text-dark fs-6' : p.status === 'FOLLOWUP' ? 'bg-info text-dark fs-6' : 'bg-secondary fs-6'}">${p.status}</span>
        </div>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Date of Birth</p>
        <h6>${p.dateOfBirth || 'N/A'}</h6>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Age & Gender</p>
        <h6>${p.age} Yrs &bull; ${p.gender || 'N/A'}</h6>
      </div>
      <div class="col-md-4">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M12 22s-8-5.5-8-11.5A8 8 0 0 1 12 2a8 8 0 0 1 8 8.5c0 6-8 11.5-8 11.5z"/><circle cx="12" cy="10" r="2"/></svg>Blood Group</p>
        <h6>${p.bloodGroup || 'N/A'}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 16.92v3a1.5 1.5 0 0 1-1.63 1.5 14.84 14.84 0 0 1-6.47-2.3 14.63 14.63 0 0 1-4.5-4.5 14.84 14.84 0 0 1-2.3-6.47A1.5 1.5 0 0 1 5.1 2h3a1.5 1.5 0 0 1 1.5 1.5c.07.63.22 1.25.45 1.83a1.5 1.5 0 0 1-.34 1.58L8.3 8.3a12 12 0 0 0 4.5 4.5l1.42-1.42a1.5 1.5 0 0 1 1.58-.34c.58.23 1.2.38 1.83.45A1.5 1.5 0 0 1 17.5 12.5v3z"/></svg>Contact</p>
        <h6>${p.contact}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Email</p>
        <h6>${p.email || 'N/A'}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Department</p>
        <h6>${p.department}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Assigned Doctor</p>
        <h6>${p.assignedDoctor || 'Unassigned'}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>Address</p>
        <h6>${p.address || 'N/A'}</h6>
      </div>
      <div class="col-md-6">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Emergency Contact</p>
        <h6>${p.emergencyContact || 'N/A'}</h6>
      </div>
      <div class="col-12">
        <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Medical History</p>
        <h6>${p.medicalHistory || 'No records.'}</h6>
      </div>
    </div>
  `;
}

let _modifyPatientSearchQuery = '';

// ── Modify Patients ────────────────────────────
function showPatientModifyList() {
  document.getElementById('modify-patient-field-view').style.display = 'none';
  document.getElementById('modify-patient-list-view').style.display = 'block';
  _currentModifyPatientId = null;

  const all = StorageDB.getPatients();
  const q = (_modifyPatientSearchQuery || '').toLowerCase().trim();

  let filtered = all;
  if (q) {
    filtered = all.map(p => {
      let score = 0;
      const n = (p.name || '').toLowerCase();
      const idL = (p.id || '').toLowerCase();
      const d = (p.department || '').toLowerCase();
      const s = (p.status || '').toLowerCase();
      if (n === q || idL === q) score += 100;
      else if (n.startsWith(q) || idL.startsWith(q)) score += 80;
      else if (n.includes(q) || idL.includes(q)) score += 60;
      if (d.includes(q)) score += 30;
      if (s.includes(q)) score += 20;
      if (p.contact && p.contact.includes(q)) score += 50;
      return { doc: p, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.doc);
  }

  const tbody = document.getElementById('modify-patient-tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No patients found.</td></tr>';
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold">${p.id}</td>
      <td>${p.name}</td>
      <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : p.status === 'INPATIENT' ? 'bg-warning text-dark' : p.status === 'FOLLOWUP' ? 'bg-info text-dark' : 'bg-secondary'}">${p.status}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="openPatientModify('${p.id}')">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function openPatientModify(id) {
  _currentModifyPatientId = id;
  const p = StorageDB.getPatientById(id);
  if (!p) return;

  document.getElementById('modify-patient-list-view').style.display = 'none';
  document.getElementById('modify-patient-field-view').style.display = 'block';

  document.getElementById('modify-patient-avatar').innerText = p.name.substring(0, 2).toUpperCase();
  document.getElementById('modify-patient-name-label').innerText = p.name;
  document.getElementById('modify-patient-id-label').innerText = `${p.id} \u2022 ${p.department}`;

  const toggle = document.getElementById('modify-patient-status-toggle');
  toggle.checked = p.status === 'ACTIVE';
  document.getElementById('modify-patient-status-label').innerText = toggle.checked ? 'Active' : (p.status === 'INPATIENT' ? 'Inpatient' : p.status === 'FOLLOWUP' ? 'Follow-up' : 'Discharged');
  document.getElementById('modify-patient-status-warning').style.display = 'none';

  renderPatientModifyFields(p);
}

function renderPatientModifyFields(p) {
  const container = document.getElementById('modify-patient-fields');
  const fields = [
    { label: 'Full Name', key: 'name', value: p.name, type: 'text' },
    { label: 'Age', key: 'age', value: p.age, type: 'number' },
    { label: 'Gender', key: 'gender', value: p.gender, type: 'select', options: ['Male', 'Female', 'Other'] },
    { label: 'Contact', key: 'contact', value: p.contact, type: 'tel' },
    { label: 'Email', key: 'email', value: p.email, type: 'email' },
    { label: 'Blood Group', key: 'bloodGroup', value: p.bloodGroup, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { label: 'Department', key: 'department', value: p.department, type: 'select', options: ['Cardiology', 'Dermatology', 'General Medicine', 'Orthopedics', 'Pediatrics'] },
    { label: 'Assigned Doctor', key: 'assignedDoctor', value: p.assignedDoctor, type: 'select',
      options: () => StorageDB.getDoctors().filter(d => d.status === 'ACTIVE').map(d => d.name) },
    { label: 'Address', key: 'address', value: p.address, type: 'text' },
    { label: 'Emergency Contact', key: 'emergencyContact', value: p.emergencyContact, type: 'tel' },
    { label: 'Medical History', key: 'medicalHistory', value: p.medicalHistory, type: 'textarea' }
  ];

  container.innerHTML = fields.map(f => {
    const val = f.value || '';
    const currentDisplay = f.key === 'age' ? val + ' Yrs' : val || 'Not set';
    return `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <span class="text-muted small">${f.label}</span>
          <div class="fw-medium">${currentDisplay}</div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" onclick="openPatientFieldEditor('${f.key}', '${f.label}', '${f.type}', '${(f.options ? (typeof f.options === 'function' ? '' : f.options.join(',')) : '')}', '${(typeof f.options === 'function' ? 'dynamic' : '')}')">Edit</button>
      </div>
    `;
  }).join('');
}

function openPatientFieldEditor(field, label, type, optionsStr, dynamic) {
  const p = StorageDB.getPatientById(_currentModifyPatientId);
  if (!p) return;

  const modalTitle = document.getElementById('actionModalLabel');
  const modalBody = document.getElementById('actionModalBody');
  const modalSubmit = document.getElementById('actionModalSubmit');
  const modal = new bootstrap.Modal(document.getElementById('actionModal'));

  modalTitle.innerText = `Edit ${label}`;
  const currentValue = p[field] || '';

  let inputHtml = '';
  let validationFn = () => true;
  let errorMsg = '';

  if (type === 'select') {
    let opts = [];
    if (dynamic === 'dynamic') {
      opts = StorageDB.getDoctors().filter(d => d.status === 'ACTIVE').map(d => d.name);
    } else {
      opts = optionsStr ? optionsStr.split(',') : [];
    }
    inputHtml = `<select class="form-control" id="modal-patient-field-input">${opts.map(o => `<option value="${o}" ${o === currentValue ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    inputHtml = `<textarea class="form-control" id="modal-patient-field-input" rows="3">${currentValue}</textarea>`;
  } else {
    inputHtml = `<input type="${type}" class="form-control" id="modal-patient-field-input" value="${currentValue}" ${type === 'number' ? 'min="0"' : ''}>`;
  }

  if (field === 'contact' || field === 'emergencyContact') {
    validationFn = v => /^\d{10}$/.test(v);
    errorMsg = 'Valid 10-digit number required.';
  }
  if (field === 'email') {
    validationFn = v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    errorMsg = 'Enter a valid email or leave empty.';
  }
  if (field === 'name') {
    validationFn = v => v.trim().length > 0;
    errorMsg = 'Name is required.';
  }
  if (field === 'age') {
    validationFn = v => parseInt(v) > 0 && parseInt(v) < 150;
    errorMsg = 'Enter a valid age (1-149).';
  }

  modalBody.innerHTML = `
    <p class="text-muted small mb-2">Current: <strong>${currentValue || 'Not set'}</strong></p>
    <div class="mb-2">${inputHtml}</div>
    <div class="text-danger small d-none" id="modal-patient-field-error">${errorMsg}</div>
  `;

  const newSubmit = modalSubmit.cloneNode(true);
  modalSubmit.parentNode.replaceChild(newSubmit, modalSubmit);

  newSubmit.addEventListener('click', () => {
    const input = document.getElementById('modal-patient-field-input');
    const errorEl = document.getElementById('modal-patient-field-error');
    const newVal = type === 'number' ? input.value.trim() : input.value;

    if (!validationFn(newVal)) {
      errorEl.classList.remove('d-none');
      return;
    }
    errorEl.classList.add('d-none');

    if (!confirm(`Update ${label} to "${newVal}"?`)) return;

    const updated = StorageDB.getPatientById(_currentModifyPatientId);
    if (!updated) return;

    if (field === 'age') updated.age = parseInt(newVal);
    else if (field === 'assignedDoctor') updated.assignedDoctor = newVal;
    else if (field === 'bloodGroup') updated.bloodGroup = newVal;
    else updated[field] = newVal;

    StorageDB.updatePatient(updated);
    modal.hide();
    openPatientModify(_currentModifyPatientId);
  });

  modal.show();
}

function handlePatientStatusToggle() {
  const p = StorageDB.getPatientById(_currentModifyPatientId);
  if (!p) return;

  const toggle = document.getElementById('modify-patient-status-toggle');
  const isActive = toggle.checked;
  const warning = document.getElementById('modify-patient-status-warning');

  if (!isActive) {
    warning.style.display = 'block';
    if (!confirm('Set status to DISCHARGED?')) {
      toggle.checked = true;
      warning.style.display = 'none';
      return;
    }
    p.status = 'DISCHARGED';
  } else {
    if (!confirm('Reactivate patient?')) {
      toggle.checked = false;
      return;
    }
    warning.style.display = 'none';
    p.status = 'ACTIVE';
  }

  StorageDB.updatePatient(p);
  document.getElementById('modify-patient-status-label').innerText = toggle.checked ? 'Active' : 'Discharged';
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('view-patient-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _patientViewSearchQuery = searchInput.value;
      _patientViewPage = 1;
      renderViewPatients();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = _patientViewSearchQuery.toLowerCase().trim();
        if (!q) return;
        const best = StorageDB.getPatients().map(p => {
          let score = 0;
          const n = (p.name || '').toLowerCase();
          if (n === q || (p.id || '').toLowerCase() === q) score += 100;
          else if (n.startsWith(q) || (p.id || '').toLowerCase().startsWith(q)) score += 80;
          else if (n.includes(q) || (p.id || '').toLowerCase().includes(q)) score += 60;
          if (p.contact === q) score += 90;
          else if (p.contact && p.contact.includes(q)) score += 50;
          if (p.email && p.email.toLowerCase().includes(q)) score += 45;
          if (p.department && p.department.toLowerCase().includes(q)) score += 30;
          if (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(q)) score += 25;
          return { doc: p, score };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
        if (best.length > 0) showPatientViewDetail(best[0].doc.id);
        e.preventDefault();
      }
    });
  }

  const modifySearchInput = document.getElementById('modify-patient-search-input');
  if (modifySearchInput) {
    modifySearchInput.addEventListener('input', () => {
      _modifyPatientSearchQuery = modifySearchInput.value;
      showPatientModifyList();
    });
  }

  showScreen('screen-home');
});
