(function () {
  var role = null;
  var userName = 'User';

  function detectRole() {
    if (sessionStorage.getItem('currentAdminId')) { role = 'admin'; userName = sessionStorage.getItem('adminName') || 'Admin'; }
    else if (sessionStorage.getItem('currentDoctorId')) { role = 'doctor'; userName = sessionStorage.getItem('doctorName') || 'Doctor'; }
    else if (sessionStorage.getItem('currentPatientId')) { role = 'patient'; userName = sessionStorage.getItem('patientName') || 'Patient'; }
    else { role = 'guest'; userName = 'Guest'; }
    return role;
  }

  var faqDB = {
    patient: {
      appointment: [
        { q: 'How do I book an appointment?', a: 'Click "Book Appointment" in the sidebar or dashboard. Select a department, doctor, choose a date and time slot, then confirm your booking.' },
        { q: 'Can I cancel an appointment?', a: 'Yes. Go to "My Appointments", find the appointment, and click the Cancel button. You can only cancel upcoming appointments.' },
        { q: 'How do I reschedule?', a: 'From "My Appointments", click the appointment and select Reschedule. Pick a new time slot and confirm.' },
        { q: 'How early should I arrive?', a: 'Please arrive 15 minutes before your scheduled appointment time for check-in and paperwork.' },
      ],
      records: [
        { q: 'How do I view my medical history?', a: 'Go to "Medical History" in the sidebar. You\'ll see all your past visits, diagnoses, and clinical notes.' },
        { q: 'How do I access prescriptions?', a: 'Click "Prescriptions" in the sidebar. All your current and past prescriptions are listed there.' },
      ],
      account: [
        { q: 'How do I update my profile?', a: 'Go to "My Profile" in the sidebar. You can update your name, contact, address, and other personal details.' },
        { q: 'How do I change my password?', a: 'Go to "My Profile" and click the Change Password button. Enter your current and new password.' },
      ],
      general: [
        { q: 'How do I contact support?', a: 'You can use this chatbot anytime, or click "Contact Support" on your dashboard to submit a support request.' },
        { q: 'How do notifications work?', a: 'You\'ll receive notifications for appointment reminders, prescription refills, and important updates. Check the bell icon in the header.' },
        { q: 'Is my data secure?', a: 'Yes. CityCare follows healthcare data protection standards. All your personal and medical information is stored securely.' },
      ]
    },
    doctor: {
      schedule: [
        { q: 'How do I view my appointments?', a: 'Go to "My Appointments" in the sidebar. You\'ll see today\'s schedule and can filter by date.' },
        { q: 'How do I update availability?', a: 'Go to "Availability & Slots" in the sidebar. Set your available days and time slots for patient bookings.' },
        { q: 'How do I mark a patient as seen?', a: 'Open an appointment from your list and click "Mark Completed" after the consultation.' },
      ],
      patients: [
        { q: 'How do I access patient records?', a: 'Go to "Patient Records" in the sidebar. Search for a patient by name or ID to view their records.' },
        { q: 'How do I add clinical notes?', a: 'Open a patient record and click "Add Note" or "Edit". Enter your findings, diagnosis, and treatment plan.' },
      ],
      account: [
        { q: 'How do I update my profile?', a: 'Go to "My Profile" in the sidebar to update your contact details, qualifications, and other information.' },
        { q: 'How do I change my password?', a: 'Go to "My Profile" and click the Change Password option.' },
      ],
      general: [
        { q: 'How do I report an issue?', a: 'Use this chatbot or contact the hospital admin through the Notifications page.' },
        { q: 'How do notifications work?', a: 'Patient booking and cancellation notifications appear in the bell icon. Check your notifications page for full history.' },
      ]
    },
    admin: {
      management: [
        { q: 'How do I manage doctors?', a: 'Go to "Doctor Management" in the sidebar. You can add, edit, activate, or deactivate doctor profiles.' },
        { q: 'How do I manage patients?', a: 'Go to "Patient Management" in the sidebar. View, search, and manage all patient records.' },
        { q: 'How do I manage appointments?', a: 'Go to "Appointment Management" to view, reschedule, or cancel any appointment across the hospital.' },
      ],
      reports: [
        { q: 'How do I generate reports?', a: 'Go to "Reports & Analytics" in the sidebar. Choose from appointment summaries, no-show reports, and more. Export as CSV.' },
        { q: 'How do I view audit logs?', a: 'Go to "Audit Logs" in the sidebar to track all system activity including logins, changes, and exports.' },
      ],
      system: [
        { q: 'How do I send notifications?', a: 'From the dashboard, click "Send Notification" quick action. Choose recipients (doctors/patients/staff), enter subject and message.' },
        { q: 'How do I manage content?', a: 'Go to "Content Management" to update the landing page content, banners, and facility information.' },
        { q: 'How do I backup data?', a: 'Go to "Backup & Restore". You can export all data as JSON and import it back when needed.' },
        { q: 'How do I change system settings?', a: 'Go to "System Settings" to configure theme, language, RTL mode, and other preferences.' },
      ],
      general: [
        { q: 'How do I contact support?', a: 'As an admin, you can escalate issues through this chatbot. Critical issues should be reported to the system administrator.' },
        { q: 'How do notifications work?', a: 'Admins receive system alerts, doctor requests, and patient-related notifications. Check the bell icon or Notification Management.' },
      ]
    },
    guest: {
      general: [
        { q: 'How do I register?', a: 'Visit the login page and click "Register" to create a new account. Choose your role (Patient or Doctor) and fill in the required details.' },
        { q: 'How do I contact the hospital?', a: 'Use the contact information on the homepage. Support is available during business hours.' },
      ]
    }
  };

  var roleLabel = { patient: 'Patient', doctor: 'Doctor', admin: 'Admin', guest: 'Guest' };

  function getGreeting() {
    var hour = new Date().getHours();
    var g = 'Good Morning';
    if (hour >= 12 && hour < 17) g = 'Good Afternoon';
    else if (hour >= 17) g = 'Good Evening';
    return g + ', ' + userName + '!';
  }

  function getAllFAQs() {
    var db = faqDB[role] || faqDB.guest;
    var all = [];
    for (var cat in db) {
      if (db.hasOwnProperty(cat)) {
        db[cat].forEach(function (item) {
          all.push(item);
        });
      }
    }
    return all;
  }

  function searchFAQs(query) {
    var q = query.toLowerCase().trim();
    if (!q) return getAllFAQs().slice(0, 6);
    var all = getAllFAQs();
    var results = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].q.toLowerCase().includes(q) || all[i].a.toLowerCase().includes(q)) {
        results.push(all[i]);
      }
    }
    return results.slice(0, 6);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  var chatState = [];

  function buildChatUI() {
    if (document.getElementById('hcw-chatbot-root')) return;
    var root = document.createElement('div');
    root.id = 'hcw-chatbot-root';
    root.innerHTML =
      '<button id="hcw-toggle-btn" class="hcw-toggle-btn" aria-label="Open Chat">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
      '</button>' +
      '<div id="hcw-chat-panel" class="hcw-chat-panel">' +
        '<div class="hcw-chat-header">' +
          '<div class="hcw-header-content">' +
            '<div class="hcw-avatar">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
            '</div>' +
            '<div><div class="hcw-title">CityCare Assistant</div><div class="hcw-subtitle">' + roleLabel[role] + ' Support</div></div>' +
          '</div>' +
          '<button id="hcw-close-btn" class="hcw-close-btn" aria-label="Close Chat">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div id="hcw-messages" class="hcw-messages"></div>' +
        '<div id="hcw-quick-replies" class="hcw-quick-replies"></div>' +
        '<div class="hcw-input-area">' +
          '<input type="text" id="hcw-input" class="hcw-input" placeholder="Type your question..." autocomplete="off">' +
          '<button id="hcw-send-btn" class="hcw-send-btn" aria-label="Send">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<style>' +
        '#hcw-chatbot-root * { box-sizing: border-box; }' +
        '.hcw-toggle-btn {' +
          'position: fixed; bottom: 24px; right: 24px; z-index: 99999; width: 56px; height: 56px; border-radius: 50%;' +
          'background: var(--primary-brand, #047857); color: #fff; border: none; cursor: pointer;' +
          'box-shadow: 0 4px 16px rgba(4,120,87,0.4); display: flex; align-items: center; justify-content: center;' +
          'transition: transform 0.3s, box-shadow 0.3s;' +
        '}' +
        '.hcw-toggle-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(4,120,87,0.5); }' +
        '.hcw-toggle-btn.hcw-open { transform: rotate(45deg); }' +
        '.hcw-chat-panel {' +
          'position: fixed; bottom: 90px; right: 24px; z-index: 99998; width: 380px; max-height: 580px;' +
          'background: var(--bg-card, #FFF); border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.18);' +
          'display: none; flex-direction: column; overflow: hidden;' +
          'animation: hcwSlideUp 0.3s ease; font-family: "Inter", sans-serif;' +
        '}' +
        '@keyframes hcwSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
        '.hcw-chat-panel.hcw-open { display: flex; }' +
        '.hcw-chat-header {' +
          'background: var(--primary-brand, #047857); color: #fff; padding: 16px 18px;' +
          'display: flex; align-items: center; justify-content: space-between; border-radius: 16px 16px 0 0;' +
        '}' +
        '.hcw-header-content { display: flex; align-items: center; gap: 10px; }' +
        '.hcw-avatar { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }' +
        '.hcw-title { font-weight: 700; font-size: 0.95rem; }' +
        '.hcw-subtitle { font-size: 0.75rem; opacity: 0.85; }' +
        '.hcw-close-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 4px; opacity: 0.8; }' +
        '.hcw-close-btn:hover { opacity: 1; }' +
        '.hcw-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; max-height: 340px; }' +
        '.hcw-message { max-width: 88%; padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; line-height: 1.5; animation: hcwMsgIn 0.25s ease; }' +
        '@keyframes hcwMsgIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
        '.hcw-message.bot { align-self: flex-start; background: var(--bg-neutral, #F0ECE6); color: var(--dark-text, #2D2A24); border-bottom-left-radius: 4px; }' +
        '.hcw-message.user { align-self: flex-end; background: var(--primary-brand, #047857); color: #fff; border-bottom-right-radius: 4px; }' +
        '.hcw-quick-replies { padding: 0 16px 10px; display: flex; flex-wrap: wrap; gap: 6px; }' +
        '.hcw-quick-reply {' +
          'padding: 6px 12px; border-radius: 16px; font-size: 0.75rem; font-weight: 500; cursor: pointer;' +
          'background: var(--bg-neutral, #F0ECE6); color: var(--dark-text, #2D2A24); border: 1px solid var(--light-border, #E5DDD5);' +
          'transition: all 0.2s; white-space: nowrap;' +
        '}' +
        '.hcw-quick-reply:hover { background: var(--primary-brand, #047857); color: #fff; border-color: var(--primary-brand, #047857); }' +
        '.hcw-input-area { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--light-border, #E5DDD5); }' +
        '.hcw-input { flex: 1; border: none; outline: none; font-size: 0.85rem; padding: 8px 0; background: transparent; color: var(--dark-text, #2D2A24); font-family: "Inter", sans-serif; }' +
        '.hcw-input::placeholder { color: var(--muted-text, #9CA3AF); }' +
        '.hcw-send-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-brand, #047857); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
        '.hcw-send-btn:hover { opacity: 0.9; }' +
      '</style>';

    document.body.appendChild(root);

    var toggleBtn = document.getElementById('hcw-toggle-btn');
    var chatPanel = document.getElementById('hcw-chat-panel');
    var closeBtn = document.getElementById('hcw-close-btn');
    var sendBtn = document.getElementById('hcw-send-btn');
    var input = document.getElementById('hcw-input');
    var messages = document.getElementById('hcw-messages');
    var quickReplies = document.getElementById('hcw-quick-replies');

    toggleBtn.addEventListener('click', function () {
      var isOpen = chatPanel.classList.toggle('hcw-open');
      toggleBtn.classList.toggle('hcw-open', isOpen);
      if (isOpen && messages.children.length === 0) {
        showWelcome();
      }
      setTimeout(function () { messages.scrollTop = messages.scrollHeight; }, 100);
    });

    closeBtn.addEventListener('click', function () {
      chatPanel.classList.remove('hcw-open');
      toggleBtn.classList.remove('hcw-open');
    });

    function addMessage(text, sender) {
      var div = document.createElement('div');
      div.className = 'hcw-message ' + sender;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function showWelcome() {
      var greeting = getGreeting();
      var intro = 'I\'m the CityCare virtual assistant. I can help you with questions about appointments, account settings, and more. How can I help you today?';
      addMessage(greeting, 'bot');
      addMessage(intro, 'bot');
      showQuickReplies();
    }

    function showQuickReplies() {
      quickReplies.innerHTML = '';
      var suggestions = getAllFAQs().slice(0, 5);
      suggestions.forEach(function (item) {
        var btn = document.createElement('button');
        btn.className = 'hcw-quick-reply';
        btn.textContent = item.q.length > 40 ? item.q.substring(0, 38) + '...' : item.q;
        btn.addEventListener('click', function () {
          handleUserInput(item.q);
        });
        quickReplies.appendChild(btn);
      });
    }

    function handleUserInput(text) {
      if (!text.trim()) return;
      addMessage(text, 'user');
      quickReplies.innerHTML = '';
      setTimeout(function () {
        var results = searchFAQs(text);
        if (results.length === 0) {
          addMessage('I\'m sorry, I don\'t have an answer for that. Try asking differently or contact support for further assistance.', 'bot');
          var fallbacks = getAllFAQs().slice(0, 3);
          fallbacks.forEach(function (item) {
            var btn = document.createElement('button');
            btn.className = 'hcw-quick-reply';
            btn.textContent = item.q.length > 36 ? item.q.substring(0, 34) + '...' : item.q;
            btn.addEventListener('click', function () { handleUserInput(item.q); });
            quickReplies.appendChild(btn);
          });
        } else {
          results.forEach(function (r) {
            addMessage(r.a, 'bot');
          });
          if (results.length === 1) {
            var more = getAllFAQs().filter(function (f) { return f.q !== results[0].q; }).slice(0, 3);
            more.forEach(function (item) {
              var btn = document.createElement('button');
              btn.className = 'hcw-quick-reply';
              btn.textContent = item.q.length > 36 ? item.q.substring(0, 34) + '...' : item.q;
              btn.addEventListener('click', function () { handleUserInput(item.q); });
              quickReplies.appendChild(btn);
            });
          } else {
            showQuickReplies();
          }
        }
        messages.scrollTop = messages.scrollHeight;
      }, 400);
    }

    sendBtn.addEventListener('click', function () {
      handleUserInput(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleUserInput(input.value);
        input.value = '';
      }
    });
  }

  detectRole();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChatUI);
  } else {
    buildChatUI();
  }
})();
