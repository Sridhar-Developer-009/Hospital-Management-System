/* CityCare Dynamic Login Context Handler */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Parse role from URL ────────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role') || 'Admin';

  // SVG icon strings used for feature bullets (replaces emojis)
  const svgIcons = {
    shield:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    chart:   `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    settings:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"></path></svg>`,
    calendar:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    file:    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    bell:    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  };

  // ── 1b. Ensure patient data is seeded ──────────────────────────────────
  if (window.StorageDB) {
    var patients = StorageDB.getPatients();
    if (!patients || patients.length === 0) {
      StorageDB.seedPatientData();
    }
  }

  // ── 2. Role data ──────────────────────────────────────────────────────
  const roleData = {
    Admin: {
      title:       'Administrator Login',
      btnText:     'Sign In as Administrator',
      desc:        'Enter your credentials to access the administrator portal.',
      heroHeading: 'Administrator <span>Login</span>',
      heroDesc:    'Access and manage hospital operations with complete control.',
      features: [
        { title: 'Secure Access',      desc: 'Enterprise-grade security to protect sensitive data.',        icon: 'shield'   },
        { title: 'Real-time Insights', desc: 'Monitor hospital performance and key metrics instantly.',     icon: 'chart'    },
        { title: 'Complete Control',   desc: 'Manage staff, departments, appointments and more.',           icon: 'settings' },
      ],
    },
    Doctor: {
      title:       'Doctor Login',
      btnText:     'Sign In as Doctor',
      desc:        'Enter your credentials to access the doctor dashboard.',
      heroHeading: 'Doctor <span>Portal</span>',
      heroDesc:    'Manage clinical queues, patient histories and availability slots.',
      features: [
        { title: 'Weekly Schedule',  desc: 'Navigate your week grid and manage availability slots.',      icon: 'calendar' },
        { title: 'Clinical Queue',   desc: "Manage today's appointment queue and patient admissions.",     icon: 'shield'   },
        { title: 'Medical Records',  desc: 'Input diagnosis notes and digital prescriptions directly.',   icon: 'file'     },
      ],
    },
    Patient: {
      title:       'Patient Login',
      btnText:     'Sign In as Patient',
      desc:        'Enter your credentials to access your patient portal.',
      heroHeading: 'Patient <span>Care Portal</span>',
      heroDesc:    'Book appointments, view medical history and prescriptions.',
      features: [
        { title: 'Self-Service Booking', desc: 'Interactive multi-step wizard to reserve appointment slots.', icon: 'calendar' },
        { title: 'Visit History',        desc: 'Check past diagnosis reports and prescription guidelines.',   icon: 'file'     },
        { title: 'Notifications',        desc: 'Real-time SMS and email alerts mapping your schedules.',      icon: 'bell'     },
      ],
    },
  };

  const currentRole = roleData[role] || roleData['Admin'];

  // ── 3. Populate dynamic content ───────────────────────────────────────
  const loginTitle   = document.getElementById('login-context-title');
  const loginBtnTxt  = document.getElementById('login-btn-text');
  const loginDesc    = document.getElementById('login-context-desc');
  const heroHeading  = document.getElementById('hero-context-heading');
  const heroDesc     = document.getElementById('hero-context-desc');
  const featuresList = document.getElementById('features-list-container');

  if (loginTitle)  loginTitle.innerText    = currentRole.title;
  if (loginBtnTxt) loginBtnTxt.innerText   = currentRole.btnText;
  if (loginDesc)   loginDesc.innerText     = currentRole.desc;
  if (heroHeading) heroHeading.innerHTML   = currentRole.heroHeading;
  if (heroDesc)    heroDesc.innerText      = currentRole.heroDesc;

  // Build feature bullet points with SVG icons (no emojis)
  if (featuresList) {
    featuresList.innerHTML = '';
    currentRole.features.forEach(feat => {
      const block = document.createElement('div');
      block.className = 'login-bullet-block';
      block.innerHTML = `
        <div class="login-bullet-icon">${svgIcons[feat.icon] || ''}</div>
        <div class="login-bullet-info">
          <span class="login-bullet-title">${feat.title}</span>
          <span class="login-bullet-desc">${feat.desc}</span>
        </div>
      `;
      featuresList.appendChild(block);
    });
  }

  // ── 4. Password visibility toggle (eye / eye-off SVG swap) ───────────
  const pwdInput  = document.getElementById('pwd-input');
  const toggleBtn = document.getElementById('pwd-toggle-btn');
  const iconShow  = document.getElementById('icon-eye-show');
  const iconHide  = document.getElementById('icon-eye-hide');

  if (toggleBtn && pwdInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwdInput.type === 'password';
      pwdInput.type = isHidden ? 'text' : 'password';
      if (iconShow) iconShow.style.display = isHidden ? 'none' : '';
      if (iconHide) iconHide.style.display = isHidden ? ''     : 'none';
      toggleBtn.setAttribute('aria-label',  isHidden ? 'Hide password' : 'Show password');
      toggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    });
  }

  // ── 5. Forgot password ────────────────────────────────────────────────
  const forgotLink = document.getElementById('forgot-pwd-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showError('Password reset is coming soon. Please contact your system administrator.');
    });
  }

  // ── 5b. Show register link only for Patient role ──────────────────────
  const registerBlock = document.getElementById('register-link-block');
  if (registerBlock) {
    registerBlock.style.display = role === 'Patient' ? 'block' : 'none';
  }

  // ── 6. Error display helpers ──────────────────────────────────────────
  function showError(message) {
    const errorEl = document.getElementById('form-error-msg');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearError() {
    const errorEl = document.getElementById('form-error-msg');
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }

  // ── 7. Form submission + routing ──────────────────────────────────────
  const form          = document.getElementById('login-form-element');
  const usernameInput = document.getElementById('username-input');
  const passwordInput = document.getElementById('pwd-input');
  const submitBtn     = document.getElementById('login-btn-text');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearError();

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!username) {
        showError('Please enter your username.');
        if (usernameInput) { usernameInput.classList.remove('valid'); usernameInput.classList.add('error'); usernameInput.focus(); }
        return;
      }
      if (!password) {
        showError('Please enter your password.');
        if (passwordInput) { passwordInput.classList.remove('valid'); passwordInput.classList.add('error'); passwordInput.focus(); }
        return;
      }

      const roleKey = role.toLowerCase();

      // ── Doctor: validate against StorageDB ──
      if (roleKey === 'doctor') {
        if (!window.StorageDB) {
          showError('System not ready. Please try again.');
          return;
        }
        const doctor = window.StorageDB.getDoctorByUsername(username);
        if (!doctor) {
          showError('Invalid username or password.');
          if (usernameInput) { usernameInput.classList.add('error'); usernameInput.focus(); }
          return;
        }
        if (doctor.password !== StorageDB.hashPassword(password)) {
          showError('Invalid username or password.');
          if (passwordInput) { passwordInput.classList.add('error'); passwordInput.focus(); }
          return;
        }
        if (doctor.status !== 'ACTIVE') {
          showError('Your account is inactive. Please contact the administrator.');
          return;
        }
        sessionStorage.setItem('currentDoctorId', doctor.id);
        sessionStorage.setItem('doctorName', doctor.name);
        sessionStorage.setItem('doctorDepartment', doctor.department || '');
        if (window.StorageDB.addAuditLog) window.StorageDB.addAuditLog(doctor.name, 'Login', 'System', 'Successful login from doctor console', 'Info');
        window.location.href = '../dashboard/doctor-dashboard.html';
        return;
      }

      // ── Admin: validate against StorageDB ──
      if (roleKey === 'admin') {
        if (!window.StorageDB) {
          showError('System not ready. Please try again.');
          return;
        }
        if (!window.StorageDB.validateAdmin(username, password)) {
          showError('Invalid username or password.');
          if (usernameInput) { usernameInput.classList.add('error'); usernameInput.focus(); }
          return;
        }
        sessionStorage.setItem('currentAdminId', 'ADMIN-001');
        sessionStorage.setItem('userRole', 'admin');
        if (window.StorageDB.addAuditLog) window.StorageDB.addAuditLog('Admin', 'Login', 'System', 'Successful login from admin console', 'Info');
        window.location.href = '../dashboard/admin-dashboard.html';
        return;
      }

      // ── Patient: validate against StorageDB ──
      if (roleKey === 'patient') {
        if (!window.StorageDB) {
          showError('System not ready. Please try again.');
          return;
        }
        const patient = window.StorageDB.getPatientByUsername(username);
        if (!patient) {
          showError('Account not found. New here? Register using the link below.');
          if (usernameInput) { usernameInput.classList.add('error'); usernameInput.focus(); }
          return;
        }
        if (patient.password !== StorageDB.hashPassword(password)) {
          showError('Invalid username or password.');
          if (passwordInput) { passwordInput.classList.add('error'); passwordInput.focus(); }
          return;
        }
        if (patient.status !== 'ACTIVE') {
          showError('Your account is inactive. Please contact the administrator.');
          return;
        }
        sessionStorage.setItem('currentPatientId', patient.id);
        sessionStorage.setItem('patientName', patient.name);
        if (window.StorageDB.addAuditLog) window.StorageDB.addAuditLog(patient.name, 'Login', 'System', 'Successful login from patient portal', 'Info');
        window.location.href = '../dashboard/patient-dashboard.html';
        return;
      }
    });

    // Clear error and show success state as user types
    form.querySelectorAll('.form-field-control').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
        clearError();
        if (input.value.trim()) {
          input.classList.add('valid');
        } else {
          input.classList.remove('valid');
        }
      });
    });
  }

});
