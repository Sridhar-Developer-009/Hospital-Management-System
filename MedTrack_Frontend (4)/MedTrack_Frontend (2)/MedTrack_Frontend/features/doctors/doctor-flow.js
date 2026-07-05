// features/admin/doctor-flow.js

let _viewDetailDocId = null;
let _currentModifyDocId = null;

document.addEventListener('DOMContentLoaded', () => {
    const depts = StorageDB.getDepartments();
    const regDept = document.getElementById('reg-dept');
    const modDept = document.getElementById('mod-dept');

    if (regDept) {
        regDept.innerHTML = '<option value="">Select Department</option>' + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }
    if (modDept) {
        modDept.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }

    showScreen('screen-home');

    function consumeSearchNav() {
        const raw = sessionStorage.getItem('medtrack_search_nav');
        if (!raw) return;
        sessionStorage.removeItem('medtrack_search_nav');
        try {
            const nav = JSON.parse(raw);
            if (nav.type === 'Doctor' && nav.id) {
                showViewDetail(nav.id);
            }
        } catch (e) {}
    }
    consumeSearchNav();
    window.addEventListener('medtrack-search-nav', consumeSearchNav);

    const btnRegSave = document.getElementById('btn-reg-save');
    if (btnRegSave) {
        btnRegSave.addEventListener('click', handleRegisterSave);
    }

    const btnStep1 = document.getElementById('btn-step1-continue');
    if (btnStep1) {
        btnStep1.addEventListener('click', handleStep1Continue);
    }

    const btnStep2Back = document.getElementById('btn-step2-back');
    if (btnStep2Back) {
        btnStep2Back.addEventListener('click', goToStep1);
    }

    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-close').addEventListener('click', () => overlay.classList.remove('open'));
    document.getElementById('modal-close-btn').addEventListener('click', () => overlay.classList.remove('open'));

    const searchInput = document.getElementById('view-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            viewSearchQuery = searchInput.value.trim();
            currentPage = 1;
            renderViewProfiles();
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = viewSearchQuery.toLowerCase().trim();
                if (!q) return;
                const best = StorageDB.getDoctors()
                    .map(doc => {
                        let score = 0;
                        const nameL = doc.name.toLowerCase();
                        if (nameL === q) score += 100;
                        else if (nameL.startsWith(q)) score += 80;
                        else if (nameL.includes(q)) score += 60;
                        if (doc.contact === q) score += 90;
                        else if (doc.contact.includes(q)) score += 50;
                        if (doc.email.toLowerCase() === q) score += 85;
                        else if (doc.email.toLowerCase().includes(q)) score += 45;
                        if (doc.id.toLowerCase() === q) score += 90;
                        else if (doc.id.toLowerCase().includes(q)) score += 40;
                        if (doc.department.toLowerCase().includes(q)) score += 30;
                        if (doc.qualification.toLowerCase().includes(q)) score += 30;
                        return { doc, score };
                    })
                    .filter(item => item.score > 0)
                    .sort((a, b) => b.score - a.score);
                if (best.length > 0) showViewDetail(best[0].doc.id);
                e.preventDefault();
            }
        });
    }

    const slotsSearchInput = document.getElementById('slots-search-input');
    if (slotsSearchInput) {
        slotsSearchInput.addEventListener('input', filterSlotsDoctors);
        slotsSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = _slotsSearchQuery;
                if (!q) return;
                const active = StorageDB.getActiveDoctors();
                const scored = active.map(doc => {
                    const name = doc.name.toLowerCase();
                    let score = 0;
                    if (name === q) score = 100;
                    else if (name.startsWith(q)) score = 80;
                    else if (name.includes(q)) score = 60;
                    if (doc.id.toLowerCase() === q) score = Math.max(score, 90);
                    else if (doc.id.toLowerCase().includes(q)) score = Math.max(score, 50);
                    if (doc.department.toLowerCase().includes(q)) score = Math.max(score, 40);
                    return { doc, score };
                }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
                if (scored.length > 0) openSlotsViewer(scored[0].doc.id);
                e.preventDefault();
            }
        });
    }

    // ── Live validation for doctor registration ──
    if (window.ProfileValidation) {
        ProfileValidation.liveValidate([
            { input: 'reg-name', error: 'err-reg-name', required: true, label: 'Full Name', validator: ProfileValidation.validateName },
            { input: 'reg-dept', error: 'err-reg-dept', required: true, label: 'Department', validator: ProfileValidation.validateDepartment },
            { input: 'reg-contact', error: 'err-reg-contact', required: true, label: 'Contact', validator: ProfileValidation.validatePhone },
            { input: 'reg-email', error: 'err-reg-email', required: true, label: 'Email', validator: ProfileValidation.validateEmail },
            { input: 'reg-qual', error: 'err-reg-qual', required: true, label: 'Qualification', validator: ProfileValidation.validateQualification },
            { input: 'reg-exp', error: 'err-reg-exp', required: true, label: 'Experience', validator: ProfileValidation.validateExperience },
            { input: 'reg-user', error: 'err-reg-user', required: true, label: 'Username', validator: ProfileValidation.validateUsername },
            { input: 'reg-pass', error: 'err-reg-pass', required: true, label: 'Password', validator: ProfileValidation.validatePassword },
            { input: 'reg-pass-confirm', error: 'err-reg-pass-confirm', required: true, label: 'Confirm Password', validator: function(v) {
                var pass = document.getElementById('reg-pass');
                if (!v) return 'Confirm Password is required.';
                if (pass && v !== pass.value) return 'Passwords do not match.';
                return '';
            }}
        ]);
    }
});

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

function showScreen(screenId) {
    document.querySelectorAll('.flow-screen').forEach(el => el.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';

    const header = document.getElementById('flow-header');
    const backBtn = document.getElementById('btn-flow-back');
    const subtitle = document.getElementById('flow-subtitle');

    if (screenId === 'screen-home') {
        backBtn.style.display = 'none';
        subtitle.innerText = 'Select an action to proceed.';
        updateMicroBreadcrumb('');

        const formReg = document.getElementById('form-register');
        if(formReg) {
            formReg.reset();
            formReg.style.display = '';
            document.querySelectorAll('#form-register .text-danger.small').forEach(el => el.classList.add('d-none'));
        }
        const overlay = document.getElementById('register-success-overlay');
        if (overlay) {
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            const icon = document.getElementById('reg-success-icon');
            if (icon) icon.style.transform = 'scale(0)';
            const tick = document.getElementById('reg-success-tick');
            if (tick) tick.style.strokeDashoffset = '40';
        }
        goToStep1();
    } else {
        backBtn.style.display = 'block';
    }

    if (screenId === 'screen-register') {
        subtitle.innerText = 'Register New Doctor Profile';
        updateMicroBreadcrumb('Register Doctor');
        // Reset form + hide success overlay, reset to step 1
        const form = document.getElementById('form-register');
        if (form) {
            form.reset();
            form.style.display = '';
            document.querySelectorAll('#form-register .text-danger.small').forEach(el => el.classList.add('d-none'));
        }
        const overlay = document.getElementById('register-success-overlay');
        if (overlay) {
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            const icon = document.getElementById('reg-success-icon');
            if (icon) icon.style.transform = 'scale(0)';
            const tick = document.getElementById('reg-success-tick');
            if (tick) tick.style.strokeDashoffset = '40';
        }
        goToStep1();
    }
    if (screenId === 'screen-view') {
        subtitle.innerText = 'View Doctor Profiles';
        updateMicroBreadcrumb('View Profiles');
        document.getElementById('screen-view').style.display = '';
        document.getElementById('screen-view-detail').style.display = 'none';
        renderViewProfiles();
    }
    if (screenId === 'screen-view-detail') {
        subtitle.innerText = 'View Profile';
        if (_viewDetailDocId) {
            const doc = StorageDB.getDoctorById(_viewDetailDocId);
            if (doc) {
                updateMicroBreadcrumb(doc.name);
                renderViewDetail(doc);
            }
        }
    }
    if (screenId === 'screen-modify') {
        subtitle.innerText = 'Modify Doctor Profile';
        updateMicroBreadcrumb('Modify Profile');
        showModifyList();
    }
    if (screenId === 'screen-slots') {
        subtitle.innerText = 'View Doctor Slots & Shifts';
        updateMicroBreadcrumb('Slots & Shifts');
        showSlotsList();
    }
}

// ----------------------------------------------------
// SCREEN 2: Register Doctor
// ----------------------------------------------------
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ----------------------------------------------------
// Step Navigation
// ----------------------------------------------------
function goToStep1() {
    document.getElementById('step-1-fields').style.display = '';
    document.getElementById('step-2-fields').style.display = 'none';

    document.getElementById('step-progress').style.width = '0%';
    const c1 = document.getElementById('step-1-circle');
    c1.style.background = 'var(--primary-brand)';
    c1.style.color = '#fff';
    c1.innerHTML = '1';
    document.getElementById('step-1-label').style.color = 'var(--dark-text)';

    const c2 = document.getElementById('step-2-circle');
    c2.style.background = '#E5E7EB';
    c2.style.color = '#9CA3AF';
    document.getElementById('step-2-label').style.color = '#9CA3AF';

    const tracker = document.getElementById('reg-step-tracker');
    if (tracker) tracker.style.display = '';
    document.querySelectorAll('#step-2-fields .text-danger.small').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('#step-1-fields .form-control, #step-1-fields .form-select, #step-2-fields .form-control').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
}

function goToStep2() {
    document.getElementById('step-1-fields').style.display = 'none';
    document.getElementById('step-2-fields').style.display = '';

    document.getElementById('step-progress').style.width = '100%';
    const c1 = document.getElementById('step-1-circle');
    c1.style.background = '#10B981';
    c1.style.color = '#fff';
    c1.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    document.getElementById('step-1-label').style.color = '#10B981';

    const c2 = document.getElementById('step-2-circle');
    c2.style.background = 'var(--primary-brand)';
    c2.style.color = '#fff';
    document.getElementById('step-2-label').style.color = 'var(--dark-text)';
}

function handleStep1Continue() {
    let isValid = true;
    const PV = window.ProfileValidation;
    const check = function(inputId, errId, validator, label) {
        const el = document.getElementById(inputId);
        const errEl = document.getElementById(errId);
        const msg = validator(el ? el.value : '', label);
        if (PV) PV.setFieldState(el, errEl, !msg);
        if (msg) { if (errEl) errEl.textContent = msg; isValid = false; }
    };

    check('reg-name', 'err-reg-name', PV ? PV.validateName : function(v){ return !v ? 'Required.' : ''; }, 'Full Name');
    check('reg-dept', 'err-reg-dept', PV ? PV.validateDepartment : function(v){ return !v ? 'Required.' : ''; }, 'Department');
    check('reg-contact', 'err-reg-contact', PV ? PV.validatePhone : function(v){ return !/^[6-9]\d{9}$/.test(v) ? 'Invalid.' : ''; }, 'Contact');
    check('reg-email', 'err-reg-email', PV ? PV.validateEmail : function(v){ return !v ? 'Required.' : ''; }, 'Email');
    check('reg-qual', 'err-reg-qual', PV ? PV.validateQualification : function(v){ return !v ? 'Required.' : ''; }, 'Qualification');
    check('reg-exp', 'err-reg-exp', PV ? PV.validateExperience : function(v){ return !v ? 'Required.' : ''; }, 'Experience');

    if (!isValid) return;

    goToStep2();
}

function handleRegisterSave() {
    let isValid = true;
    const PV = window.ProfileValidation;
    const check = function(inputId, errId, validator, label) {
        const el = document.getElementById(inputId);
        const errEl = document.getElementById(errId);
        const msg = validator(el ? el.value : '', label);
        if (PV) PV.setFieldState(el, errEl, !msg);
        if (msg) { if (errEl) errEl.textContent = msg; isValid = false; }
    };

    const user = document.getElementById('reg-user').value.trim();
    check('reg-user', 'err-reg-user', PV ? PV.validateUsername : function(v){ return !v ? 'Required.' : ''; }, 'Username');
    check('reg-pass', 'err-reg-pass', PV ? PV.validatePassword : function(v){ return !v ? 'Required.' : ''; }, 'Password');

    const pass = document.getElementById('reg-pass').value;
    const passConfirm = document.getElementById('reg-pass-confirm').value;
    const confirmMsg = !passConfirm ? 'Confirm Password is required.' : (pass !== passConfirm ? 'Passwords do not match.' : '');
    if (PV) PV.setFieldState(document.getElementById('reg-pass-confirm'), document.getElementById('err-reg-pass-confirm'), !confirmMsg);
    if (confirmMsg) { var ce = document.getElementById('err-reg-pass-confirm'); if (ce) ce.textContent = confirmMsg; isValid = false; }

    if (!isValid) return;

    const newDoc = {
        id: StorageDB.generateDoctorCode(),
        name: document.getElementById('reg-name').value.trim(),
        department: document.getElementById('reg-dept').value,
        contact: document.getElementById('reg-contact').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        qualification: document.getElementById('reg-qual').value.trim(),
        experience: parseInt(document.getElementById('reg-exp').value, 10),
        username: user,
        password: StorageDB.hashPassword(pass),
        status: 'ACTIVE',
        registeredAt: new Date().toISOString()
    };

    StorageDB.saveDoctor(newDoc);

    document.getElementById('succ-doc-code').innerText = newDoc.id;
    document.getElementById('succ-doc-name').innerText = newDoc.name;
    document.getElementById('succ-doc-dept').innerText = newDoc.department;

    // Show success overlay on top of form (form stays behind, overlay covers it)
    const overlay = document.getElementById('register-success-overlay');
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    requestAnimationFrame(() => {
        const icon = document.getElementById('reg-success-icon');
        if (icon) icon.style.transform = 'scale(1)';
        requestAnimationFrame(() => {
            const tick = document.getElementById('reg-success-tick');
            if (tick) tick.style.strokeDashoffset = '0';
        });
    });

    // Show toast notification
    const toastEl = document.getElementById('registerToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
    toast.show();
}

function goToStep1AfterSuccess() {
    const overlay = document.getElementById('register-success-overlay');
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    const icon = document.getElementById('reg-success-icon');
    if (icon) icon.style.transform = 'scale(0)';
    const tick = document.getElementById('reg-success-tick');
    if (tick) tick.style.strokeDashoffset = '40';
    const form = document.getElementById('form-register');
    if (form) form.reset();
    goToStep1();
}

// ----------------------------------------------------
// SCREEN 3: View Profiles
// ----------------------------------------------------
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let viewSearchQuery = '';

function renderViewProfiles() {
    const all = StorageDB.getDoctors();
    const q = viewSearchQuery.toLowerCase().trim();

    let working = all;
    if (q) {
        working = all
            .map(doc => {
                let score = 0;
                const nameL = doc.name.toLowerCase();
                const deptL = doc.department.toLowerCase();
                const qualL = doc.qualification.toLowerCase();
                const emailL = doc.email.toLowerCase();
                const idL = doc.id.toLowerCase();
                const statusL = doc.status.toLowerCase();
                const contactS = doc.contact;

                if (nameL === q) score += 100;
                else if (nameL.startsWith(q)) score += 80;
                else if (nameL.includes(q)) score += 60;

                if (contactS === q) score += 90;
                else if (contactS.includes(q)) score += 50;

                if (emailL === q) score += 85;
                else if (emailL.includes(q)) score += 45;

                if (idL === q) score += 90;
                else if (idL.includes(q)) score += 40;

                if (deptL.includes(q)) score += 30;
                if (qualL.includes(q)) score += 30;
                if (doc.experience.toString().includes(q)) score += 20;
                if (statusL.includes(q)) score += 10;

                return { doc, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.doc);
    }

    const tbody = document.getElementById('view-doc-tbody');
    tbody.innerHTML = '';

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const paginated = working.slice(startIdx, endIdx);

    paginated.forEach((doc, idx) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => showViewDetail(doc.id);

        tr.innerHTML = `
            <td class="text-muted fw-medium">${startIdx + idx + 1}</td>
            <td class="fw-bold">${doc.id}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:28px;height:28px;background:var(--primary-brand);font-size:0.7rem;">
                        ${doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                    </div>
                    ${doc.name}
                </div>
            </td>
            <td>${doc.department}</td>
            <td class="text-muted">${doc.qualification}</td>
            <td>${doc.experience} Yrs</td>
            <td>${doc.contact}</td>
            <td class="text-muted small">${doc.email}</td>
            <td><span class="badge ${doc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${doc.status}</span></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();showViewDetail('${doc.id}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('view-page-info').innerText = `${q ? `Found ${working.length} result${working.length !== 1 ? 's' : ''} for "${viewSearchQuery}"` : `Showing ${working.length ? Math.min(startIdx + 1, working.length) : 0}-${Math.min(endIdx, working.length)} of ${working.length} doctor${working.length !== 1 ? 's' : ''}`}`;

    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (btnPrev) {
        btnPrev.disabled = currentPage === 1;
        btnPrev.onclick = () => { if(currentPage > 1) { currentPage--; renderViewProfiles(); } };
    }
    if (btnNext) {
        btnNext.disabled = endIdx >= working.length;
        btnNext.onclick = () => { if(endIdx < working.length) { currentPage++; renderViewProfiles(); } };
    }
}

function showViewList() {
    showScreen('screen-view');
}

function showViewDetail(id) {
    _viewDetailDocId = id;
    showScreen('screen-view-detail');
}

function renderViewDetail(doc) {
    const card = document.getElementById('view-detail-card');
    card.innerHTML = `
        <div class="row g-4">
            <div class="col-12 d-flex align-items-center gap-3 pb-2 border-bottom">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:48px;height:48px;background:var(--primary-brand);font-size:1.1rem;">
                    ${doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h5 class="fw-bold mb-0">${doc.name}</h5>
                    <span class="text-muted small">${doc.id} &bull; ${doc.department}</span>
                </div>
                <div class="ms-auto">
                    <span class="badge ${doc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} fs-6">${doc.status}</span>
                </div>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Qualification</p>
                <h6>${doc.qualification}</h6>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Experience</p>
                <h6>${doc.experience} Years</h6>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 16.92v3a1.5 1.5 0 0 1-1.63 1.5 14.84 14.84 0 0 1-6.47-2.3 14.63 14.63 0 0 1-4.5-4.5 14.84 14.84 0 0 1-2.3-6.47A1.5 1.5 0 0 1 5.1 2h3a1.5 1.5 0 0 1 1.5 1.5c.07.63.22 1.25.45 1.83a1.5 1.5 0 0 1-.34 1.58L8.3 8.3a12 12 0 0 0 4.5 4.5l1.42-1.42a1.5 1.5 0 0 1 1.58-.34c.58.23 1.2.38 1.83.45A1.5 1.5 0 0 1 17.5 12.5v3z"/></svg>Contact</p>
                <h6>${doc.contact}</h6>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Email</p>
                <h6>${doc.email}</h6>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Department</p>
                <h6>${doc.department}</h6>
            </div>
            <div class="col-md-6">
                <p class="text-muted small mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Username</p>
                <h6>${doc.username || 'N/A'}</h6>
            </div>
        </div>
    `;
}

function showDoctorDetailsModal(doc) {
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const overlay = document.getElementById('modal-overlay');

    title.innerText = 'Doctor Profile Details';
    body.innerHTML = `
        <div class="row g-3">
            <div class="col-6"><p class="text-muted small mb-1">Code</p><h6 class="fw-bold">${doc.id}</h6></div>
            <div class="col-6"><p class="text-muted small mb-1">Status</p><span class="badge ${doc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${doc.status}</span></div>
            <div class="col-12"><p class="text-muted small mb-1">Name</p><h6 class="fw-bold">${doc.name}</h6></div>
            <div class="col-6"><p class="text-muted small mb-1">Department</p><h6>${doc.department}</h6></div>
            <div class="col-6"><p class="text-muted small mb-1">Experience</p><h6>${doc.experience} Years</h6></div>
            <div class="col-12"><p class="text-muted small mb-1">Qualification</p><h6>${doc.qualification}</h6></div>
            <div class="col-6"><p class="text-muted small mb-1">Contact</p><h6>${doc.contact}</h6></div>
            <div class="col-6"><p class="text-muted small mb-1">Email</p><h6>${doc.email}</h6></div>
        </div>
    `;
    overlay.classList.add('open');
}

// ----------------------------------------------------
// SCREEN 5: Modify Profile (Per-Field Confirm Style)
// ----------------------------------------------------
function showModifyList() {
    document.getElementById('modify-edit-view').style.display = 'none';
    document.getElementById('modify-list-view').style.display = 'block';
    _currentModifyDocId = null;

    const doctors = StorageDB.getDoctors();
    const tbody = document.getElementById('modify-doc-tbody');
    tbody.innerHTML = '';

    doctors.forEach(doc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${doc.id}</td>
            <td>${doc.name}</td>
            <td><span class="badge ${doc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${doc.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openModifyEditor('${doc.id}')">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModifyEditor(id) {
    const doc = StorageDB.getDoctorById(id);
    if (!doc) return;

    _currentModifyDocId = id;

    document.getElementById('modify-list-view').style.display = 'none';
    document.getElementById('modify-edit-view').style.display = 'block';
    document.getElementById('mod-id').value = id;

    renderModifyFieldList(doc);
}

function renderModifyFieldList(doc) {
    const container = document.getElementById('modify-field-list');
    const depts = StorageDB.getDepartments();
    const statusLabel = doc.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const statusClass = doc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary';

    container.innerHTML = `
        <h6 class="fw-bold mb-3">Current Profile — ${doc.id}</h6>
        <div class="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style="background:var(--bg-neutral);">
            <span><strong>1.</strong> Full Name: <span class="text-muted">${doc.name}</span></span>
            <button class="btn btn-sm btn-outline-primary" onclick="editModifyField('name')">Edit</button>
        </div>
        <div class="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style="background:var(--bg-neutral);">
            <span><strong>2.</strong> Department: <span class="text-muted">${doc.department}</span></span>
            <button class="btn btn-sm btn-outline-primary" onclick="editModifyField('department')">Edit</button>
        </div>
        <div class="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style="background:var(--bg-neutral);">
            <span><strong>3.</strong> Contact Number: <span class="text-muted">${doc.contact}</span></span>
            <button class="btn btn-sm btn-outline-primary" onclick="editModifyField('contact')">Edit</button>
        </div>
        <div class="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style="background:var(--bg-neutral);">
            <span><strong>4.</strong> Email Address: <span class="text-muted">${doc.email}</span></span>
            <button class="btn btn-sm btn-outline-primary" onclick="editModifyField('email')">Edit</button>
        </div>
        <div class="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style="background:var(--bg-neutral);">
            <span><strong>5.</strong> Account Status: <span class="badge ${statusClass}">${statusLabel}</span></span>
            <div>
                <div class="form-check form-switch d-inline-block mb-0">
                    <input class="form-check-input" type="checkbox" id="mod-status-toggle" ${doc.status === 'ACTIVE' ? 'checked' : ''} onchange="handleModifyStatusToggle()">
                </div>
            </div>
        </div>
        <div id="modify-status-warning" class="alert alert-warning small py-2 mb-0" style="${doc.status === 'ACTIVE' ? 'display:none;' : ''}">
            <strong>Warning:</strong> Inactive doctors cannot log in and will be hidden from patient booking.
        </div>
    `;
}

function editModifyField(field) {
    const doc = StorageDB.getDoctorById(_currentModifyDocId);
    if (!doc) return;

    const modalTitle = document.getElementById('actionModalLabel');
    const modalBody = document.getElementById('actionModalBody');
    const modalSubmit = document.getElementById('actionModalSubmit');
    const modal = new bootstrap.Modal(document.getElementById('actionModal'));

    let currentValue = '';
    let inputHtml = '';
    let validationFn = null;
    let errorMsg = '';

    switch (field) {
        case 'name':
            modalTitle.innerText = 'Edit Full Name';
            currentValue = doc.name;
            inputHtml = `<input type="text" class="form-control" id="modal-field-input" placeholder="e.g. Dr. Arvind Kumar" value="${doc.name.replace(/"/g, '&quot;')}">`;
            validationFn = (val) => /^[A-Za-z\s\.]{2,100}$/.test(val);
            errorMsg = 'Alphabets, spaces, dots only. 2-100 characters.';
            break;
        case 'department':
            modalTitle.innerText = 'Edit Department';
            currentValue = doc.department;
            const depts = StorageDB.getDepartments();
            inputHtml = `<select class="form-select" id="modal-field-input">${depts.map(d => `<option value="${d.name}" ${d.name === doc.department ? 'selected' : ''}>${d.name}</option>`).join('')}</select>`;
            validationFn = (val) => val !== '';
            errorMsg = 'Please select a department.';
            break;
        case 'contact':
            modalTitle.innerText = 'Edit Contact Number';
            currentValue = doc.contact;
            inputHtml = `<input type="text" class="form-control" id="modal-field-input" maxlength="10" placeholder="10-digit number starting with 6-9" value="${doc.contact}">`;
            validationFn = (val) => /^[6-9]\d{9}$/.test(val);
            errorMsg = '10 digits starting with 6-9.';
            break;
        case 'email':
            modalTitle.innerText = 'Edit Email Address';
            currentValue = doc.email;
            inputHtml = `<input type="email" class="form-control" id="modal-field-input" placeholder="e.g. doctor@hospital.com" value="${doc.email}">`;
            validationFn = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
            errorMsg = 'Valid email format required.';
            break;
    }

    modalBody.innerHTML = `
        <p class="text-muted small mb-2">Current: <strong>${currentValue}</strong></p>
        <div class="mb-2">${inputHtml}</div>
        <div class="text-danger small d-none" id="modal-field-error">${errorMsg}</div>
    `;

    // Remove old event listeners by cloning
    const newSubmit = modalSubmit.cloneNode(true);
    modalSubmit.parentNode.replaceChild(newSubmit, modalSubmit);

    newSubmit.addEventListener('click', () => {
        const input = document.getElementById('modal-field-input');
        const errorEl = document.getElementById('modal-field-error');
        const newVal = input.value.trim();

        if (!validationFn(newVal)) {
            errorEl.classList.remove('d-none');
            return;
        }

        errorEl.classList.add('d-none');

        if (!confirm(`Update ${modalTitle.innerText.replace('Edit ', '')} to "${newVal}"?`)) {
            return;
        }

        const updatedDoc = StorageDB.getDoctorById(_currentModifyDocId);
        if (!updatedDoc) return;

        switch (field) {
            case 'name': updatedDoc.name = newVal; break;
            case 'department': updatedDoc.department = newVal; break;
            case 'contact': updatedDoc.contact = newVal; break;
            case 'email': updatedDoc.email = newVal; break;
        }

        StorageDB.updateDoctor(updatedDoc);
        modal.hide();
        renderModifyFieldList(updatedDoc);
    });

    modal.show();
}

function handleModifyStatusToggle() {
    const doc = StorageDB.getDoctorById(_currentModifyDocId);
    if (!doc) return;

    const toggle = document.getElementById('mod-status-toggle');
    const isActive = toggle.checked;
    const warning = document.getElementById('modify-status-warning');

    if (!isActive) {
        warning.style.display = 'block';
        if (!confirm('Set account to INACTIVE? The doctor will not be able to log in.')) {
            toggle.checked = true;
            warning.style.display = 'none';
            return;
        }
    } else {
        if (!confirm('Reactivate account?')) {
            toggle.checked = false;
            return;
        }
        warning.style.display = 'none';
    }

    doc.status = isActive ? 'ACTIVE' : 'INACTIVE';
    StorageDB.updateDoctor(doc);
    renderModifyFieldList(doc);
}

function handleModifyDeactivate() {
    const doc = StorageDB.getDoctorById(_currentModifyDocId);
    if (!doc) return;

    const modalTitle = document.getElementById('actionModalLabel');
    const modalBody = document.getElementById('actionModalBody');
    const modalSubmit = document.getElementById('actionModalSubmit');
    const modal = new bootstrap.Modal(document.getElementById('actionModal'));

    modalTitle.innerText = 'Deactivate Doctor';
    modalBody.innerHTML = `
        <div class="alert alert-warning">
            <strong>Warning:</strong> Inactive doctors cannot log in and will be hidden from patient booking.
        </div>
        <p>Are you sure you want to deactivate <strong>${doc.name}</strong> (${doc.id})?</p>
    `;

    const newSubmit = modalSubmit.cloneNode(true);
    modalSubmit.parentNode.replaceChild(newSubmit, modalSubmit);

    newSubmit.addEventListener('click', () => {
        if (!confirm(`Deactivate ${doc.name}?`)) return;

        doc.status = 'INACTIVE';
        StorageDB.updateDoctor(doc);
        modal.hide();
        renderModifyFieldList(doc);
    });

    modal.show();
}

// ----------------------------------------------------
// SCREEN 6: View Slots & Shifts
// ----------------------------------------------------
let _slotsSearchQuery = '';

function filterSlotsDoctors() {
    const input = document.getElementById('slots-search-input');
    if (input) _slotsSearchQuery = input.value.toLowerCase().trim();
    showSlotsList();
}

function showSlotsList() {
    document.getElementById('slots-detail-view').style.display = 'none';
    document.getElementById('slots-list-view').style.display = 'block';

    const activeDoctors = StorageDB.getActiveDoctors();
    const tbody = document.getElementById('slots-doc-tbody');
    tbody.innerHTML = '';

    let filtered = activeDoctors;
    if (_slotsSearchQuery) {
        const q = _slotsSearchQuery;
        const scored = activeDoctors.map(doc => {
            const name = doc.name.toLowerCase();
            const code = doc.id.toLowerCase();
            const dept = doc.department.toLowerCase();
            let score = 0;
            if (name === q || code === q) score = 100;
            else if (name.startsWith(q) || code.startsWith(q) || dept.startsWith(q)) score = 80;
            else if (name.includes(q) || code.includes(q) || dept.includes(q)) score = 40;
            return { doc, score };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
        filtered = scored.map(x => x.doc);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No matching doctors found.</td></tr>`;
        return;
    }

    filtered.forEach(doc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${doc.id}</td>
            <td>${doc.name}</td>
            <td>${doc.department}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openSlotsViewer('${doc.id}')">View Schedule</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmtSlotTime(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const d = new Date(2024, 0, 1, h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function openSlotsViewer(id) {
    const doc = StorageDB.getDoctorById(id);
    if(!doc) return;

    document.getElementById('slots-list-view').style.display = 'none';
    document.getElementById('slots-detail-view').style.display = 'block';

    document.getElementById('slot-doc-name').innerText = doc.name;
    document.getElementById('slot-doc-code').innerText = doc.id;
    document.getElementById('slot-doc-dept').innerText = doc.department;

    // Render Slots Matrix - Days as Rows, Slots as Columns
    const storedSlots = StorageDB.getDoctorSlots(id) || {};
    const slotTimes = StorageDB.getSlotTimes(id);

    // Update column headers with time ranges
    const matrixBody = document.getElementById('slots-matrix-tbody');
    const matrixTable = matrixBody ? matrixBody.closest('table') : null;
    const headerTr = matrixTable ? matrixTable.querySelector('thead tr') : null;
    if (headerTr && slotTimes && slotTimes.length >= 5) {
        for (let i = 0; i < 5; i++) {
            const th = headerTr.children[i + 1];
            if (th) {
                const st = slotTimes[i];
                const [h, m] = st.split(':').map(Number);
                const endH = h + 1;
                const end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                th.innerHTML = `<div style="font-size:0.82rem;font-weight:700;">${fmtSlotTime(st)}</div><div style="font-size:0.65rem;opacity:0.65;font-weight:400;">${fmtSlotTime(end)}</div>`;
            }
        }
    }

    matrixBody.innerHTML = '';

    // Generate next 7 calendar dates starting from today
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dayName = DAY_NAMES[d.getDay()];
        const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
        const daySlots = storedSlots[dayName] || ['-', '-', '-', '-', '-'];
        days.push({ label: dateLabel, slots: daySlots });
    }

    days.forEach((day, idx) => {
        const isToday = idx === 0;
        let rowHtml = `<tr class="${isToday ? 'today-row' : ''}"><td class="fw-bold text-start px-2" style="${isToday ? 'background:#ECFDF5;border-radius:4px;' : ''}">${day.label}</td>`;
        for (let s = 0; s < 5; s++) {
            const val = day.slots[s] || '-';
            let color = '#E5E7EB';
            let textColor = '#374151';
            if (val === 'A') { color = '#10B981'; textColor = '#fff'; }
            else if (val === 'R') { color = '#EF4444'; textColor = '#fff'; }
            else if (val === 'K') { color = '#F59E0B'; textColor = '#fff'; }
            else if (val === 'C') { color = '#3B82F6'; textColor = '#fff'; }
            const timeLabel = slotTimes && slotTimes[s] ? fmtSlotTime(slotTimes[s]) : '';
            rowHtml += `<td style="background:${color}; color:${textColor}; font-weight:bold; padding:4px 2px; line-height:1.3; vertical-align:middle;">
                <div style="font-size:0.6rem; font-weight:400; opacity:0.8; line-height:1.2;">${timeLabel}</div>
                <div style="font-size:1rem;">${val}</div>
            </td>`;
        }
        rowHtml += '</tr>';
        matrixBody.innerHTML += rowHtml;
    });
}
