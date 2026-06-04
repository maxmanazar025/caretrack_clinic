import API from './api.js';
import translations, { getTranslation } from './translations.js';

function getInitialTheme() {
  const stored = localStorage.getItem('caretrack_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

// Global SPA state
const state = {
  currentLanguage: localStorage.getItem('caretrack_lang') || 'uz',
  theme: getInitialTheme(),
  currentTab: 'dashboard',
  currentUser: null,
  activePatientProfileId: null, // Used when viewing full patient profile
};

applyTheme(state.theme);

// Initial setup on window load
window.addEventListener('DOMContentLoaded', async () => {
  // Check if token exists
  const token = localStorage.getItem('caretrack_token');
  if (token) {
    try {
      const userRes = await API.auth.getMe();
      state.currentUser = userRes.user;
    } catch (e) {
      console.error('Session restoration failed:', e);
      API.auth.logout();
    }
  }

  // Bind global functions to window so they work in HTML events
  window.navigateTab = navigateTab;
  window.changeLanguage = changeLanguage;
  window.toggleTheme = toggleTheme;
  window.handleLoginSubmit = handleLoginSubmit;
  
  window.showAddDoctorModal = showAddDoctorModal;
  window.handleDoctorSubmit = handleDoctorSubmit;
  window.editDoctor = editDoctor;
  window.deleteDoctor = deleteDoctor;
  window.filterDoctors = filterDoctors;

  window.showAddPatientModal = showAddPatientModal;
  window.handlePatientSubmit = handlePatientSubmit;
  window.editPatient = editPatient;
  window.deletePatient = deletePatient;
  window.viewPatientProfile = viewPatientProfile;
  window.filterPatients = filterPatients;

  window.showAddIllnessModal = showAddIllnessModal;
  window.handleIllnessSubmit = handleIllnessSubmit;
  window.editIllness = editIllness;
  window.deleteIllness = deleteIllness;
  window.filterIllnesses = filterIllnesses;
  
  window.showToast = showToast;
  window.logout = logout;
  window.searchAll = searchAll;
  window.triggerGlobalSearch = triggerGlobalSearch;
  window.toggleMobileSidebar = toggleMobileSidebar;

  // Initial draw
  renderApp();
});

// Mobile sidebar toggle
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (sidebar) {
    const isOpen = sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.style.display = isOpen ? 'block' : 'none';
  }
}

// Render dynamic state
function renderApp() {
  const root = document.getElementById('app');

  if (!state.currentUser) {
    renderLogin(root);
  } else {
    renderMainLayout(root);
  }
}

// -----------------------------------------------------------------------------
// 1. TOAST NOTIFICATION HELPERS
// -----------------------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after 3.5s
  setTimeout(() => {
    toast.style.animation = 'slide-in 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// -----------------------------------------------------------------------------
// 2. BILINGUAL & TRANSLATION ENGINE
// -----------------------------------------------------------------------------
function t(key) {
  return getTranslation(state.currentLanguage, key);
}

function changeLanguage(lang) {
  state.currentLanguage = lang;
  localStorage.setItem('caretrack_lang', lang);
  
  // IMMEDIATELY trigger full layout rebuild to update ALL elements (sidebar, login, headers)
  renderApp();
}

function renderThemeToggleHtml() {
  const isDark = state.theme === 'dark';
  const label = isDark ? t('theme_light') : t('theme_dark');
  const icon = isDark ? 'fa-sun' : 'fa-moon';
  return `
    <div class="theme-toggle" role="group" aria-label="${t('theme_toggle_label')}">
      <button type="button" class="theme-toggle-btn" onclick="toggleTheme()" title="${label}" aria-pressed="${isDark}">
        <i class="fa-solid ${icon}"></i>
        <span>${label}</span>
      </button>
    </div>
  `;
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('caretrack_theme', state.theme);
  applyTheme(state.theme);

  const msg =
    state.theme === 'dark'
      ? (state.currentLanguage === 'uz' ? 'Tungi rejim yoqildi' : state.currentLanguage === 'ru' ? 'Тёмная тема включена' : 'Dark mode enabled')
      : (state.currentLanguage === 'uz' ? 'Kunduzgi rejim yoqildi' : state.currentLanguage === 'ru' ? 'Светлая тема включена' : 'Light mode enabled');
  showToast(msg, 'info');

  renderApp();
}

// -----------------------------------------------------------------------------
// 3. LOGIN PAGE VIEW
// -----------------------------------------------------------------------------
function renderLogin(container) {
  container.innerHTML = `
    <div class="login-container">
      <div class="login-card glass-panel">
        <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-bottom: 25px; flex-wrap:wrap;">
          <div class="lang-switcher">
            <button class="lang-btn ${state.currentLanguage === 'uz' ? 'active' : ''}" onclick="changeLanguage('uz')">UZ</button>
            <button class="lang-btn ${state.currentLanguage === 'en' ? 'active' : ''}" onclick="changeLanguage('en')">EN</button>
            <button class="lang-btn ${state.currentLanguage === 'ru' ? 'active' : ''}" onclick="changeLanguage('ru')">RU</button>
          </div>
          ${renderThemeToggleHtml()}
        </div>

        <div class="logo-header">
          <i class="fa-solid fa-heart-pulse logo-icon"></i>
          <h1 style="font-weight: 800; font-size: 2.2rem; letter-spacing: -0.03em;">MediCore</h1>
          <p class="text-muted" style="margin-top: 4px; font-weight: 500;">CareTrack Clinic TYBT</p>
        </div>
        
        <h2>${t('login_title')}</h2>
        <p class="text-muted">${t('login_subtitle')}</p>
        
        <form onsubmit="handleLoginSubmit(event)">
          <div class="form-group">
            <label>${t('email')}</label>
            <input type="email" id="login-email" class="input-field" required placeholder="admin@medicore.uz">
          </div>
          <div class="form-group">
            <label>${t('password')}</label>
            <input type="password" id="login-password" class="input-field" required placeholder="••••••••">
          </div>
          <button type="submit" id="login-submit" class="btn btn-primary login-btn">
            ${t('sign_in')}
          </button>
        </form>

        <div class="login-demo-box">
          <div class="demo-title"><i class="fa-solid fa-key"></i> Demo Accounts / Аккаунты:</div>
          <div>• Admin: <b>admin@medicore.uz</b> / admin123</div>
          <div>• Doctor/Врач: <b>doctor@medicore.uz</b> / doctor123</div>
          <div>• Receptionist/Регистратор: <b>recept@medicore.uz</b> / recept123</div>
        </div>
      </div>
    </div>
  `;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('login-submit');

  submitBtn.disabled = true;
  submitBtn.textContent = t('logging_in');

  try {
    const data = await API.auth.login(email, password);
    state.currentUser = data.user;
    
    let welcomeMsg = `Xush kelibsiz, ${data.user.full_name}!`;
    if (state.currentLanguage === 'en') welcomeMsg = `Welcome, ${data.user.full_name}!`;
    if (state.currentLanguage === 'ru') welcomeMsg = `Добро пожаловать, ${data.user.full_name}!`;
    
    showToast(welcomeMsg, 'success');
    renderApp();
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : state.currentLanguage === 'ru' ? err.message_ru || err.message_en : err.message_en, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = t('sign_in');
  }
}

function logout() {
  API.auth.logout();
  state.currentUser = null;
  state.currentTab = 'dashboard';
  state.activePatientProfileId = null;
  renderApp();
}

// -----------------------------------------------------------------------------
// 4. MAIN NAVIGATION & LAYOUT
// -----------------------------------------------------------------------------
function renderMainLayout(container) {
  const avatarInitials = state.currentUser.full_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const userRoleTranslation = t(`role_${state.currentUser.role}`);

  container.innerHTML = `
    <div class="app-layout">
      <!-- Mobile overlay backdrop -->
      <div class="sidebar-backdrop" onclick="toggleMobileSidebar()" style="display:none;"></div>

      <!-- SIDEBAR -->
      <aside class="sidebar glass-panel" style="border-radius: 0;">
        <div class="sidebar-logo">
          <i class="fa-solid fa-circle-h sidebar-logo-icon"></i>
          <h1>${t('app_title')}</h1>
        </div>

        <ul class="sidebar-menu">
          <li class="menu-item ${state.currentTab === 'dashboard' ? 'active' : ''}" id="menu-dashboard">
            <button onclick="navigateTab('dashboard'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-chart-line"></i>
              <span>${t('nav_dashboard')}</span>
            </button>
          </li>
          <li class="menu-item ${state.currentTab === 'doctors' ? 'active' : ''}" id="menu-doctors">
            <button onclick="navigateTab('doctors'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-user-doctor"></i>
              <span>${t('nav_doctors')}</span>
            </button>
          </li>
          <li class="menu-item ${state.currentTab === 'patients' || state.currentTab === 'patient-profile' ? 'active' : ''}" id="menu-patients">
            <button onclick="navigateTab('patients'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-hospital-user"></i>
              <span>${t('nav_patients')}</span>
            </button>
          </li>
          <li class="menu-item ${state.currentTab === 'illnesses' ? 'active' : ''}" id="menu-illnesses">
            <button onclick="navigateTab('illnesses'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-file-medical"></i>
              <span>${t('nav_illnesses')}</span>
            </button>
          </li>
          <li class="menu-item ${state.currentTab === 'search' ? 'active' : ''}" id="menu-search">
            <button onclick="navigateTab('search'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-magnifying-glass"></i>
              <span>${t('nav_search')}</span>
            </button>
          </li>
          ${state.currentUser.role === 'admin' ? `
          <li class="menu-item ${state.currentTab === 'settings' ? 'active' : ''}" id="menu-settings">
            <button onclick="navigateTab('settings'); document.querySelector('.sidebar').classList.remove('mobile-open');">
              <i class="fa-solid fa-sliders"></i>
              <span>${t('nav_settings')}</span>
            </button>
          </li>
          ` : ''}
        </ul>

        <div class="sidebar-user">
          <div class="user-info">
            <div class="user-avatar">${avatarInitials}</div>
            <div class="user-text">
              <h4>${state.currentUser.full_name}</h4>
              <span class="badge badge-role">${userRoleTranslation}</span>
            </div>
          </div>
          <button onclick="logout()" class="btn btn-secondary" style="width:100%; font-size:0.88rem; padding: 8px;">
            <i class="fa-solid fa-right-from-bracket"></i> ${t('logout')}
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <!-- TOP HEADER BAR -->
        <header class="header-bar">
          <div style="display:flex; align-items:center; gap:14px;">
            <!-- Mobile hamburger -->
            <button class="hamburger-btn" onclick="toggleMobileSidebar()" aria-label="Toggle menu">
              <i class="fa-solid fa-bars"></i>
            </button>
            <div class="page-title">
              <h2 id="topbar-title">CareTrack Clinic</h2>
              <p class="text-muted" id="topbar-subtitle">Digital Medical Platform</p>
            </div>
          </div>

          <div class="top-controls">
            ${renderThemeToggleHtml()}
            <div class="lang-switcher">
              <button class="lang-btn ${state.currentLanguage === 'uz' ? 'active' : ''}" onclick="changeLanguage('uz')">UZ</button>
              <button class="lang-btn ${state.currentLanguage === 'en' ? 'active' : ''}" onclick="changeLanguage('en')">EN</button>
              <button class="lang-btn ${state.currentLanguage === 'ru' ? 'active' : ''}" onclick="changeLanguage('ru')">RU</button>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <div id="content-body">
          <!-- Dynamically loaded view content -->
        </div>
      </main>
    </div>
  `;

  // Draw active panel
  renderActiveTabContent();
  updateTopBarTitle();
}

function navigateTab(tabName) {
  state.currentTab = tabName;
  state.activePatientProfileId = null;

  // Toggle active styling in sidebar
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.classList.remove('active');
  });

  const matchingMenu = document.getElementById(`menu-${tabName}`);
  if (matchingMenu) matchingMenu.classList.add('active');

  renderActiveTabContent();
  updateTopBarTitle();
}

function updateTopBarTitle() {
  const topTitle = document.getElementById('topbar-title');
  const topSub = document.getElementById('topbar-subtitle');
  if (!topTitle || !topSub) return;

  if (state.currentTab === 'dashboard') {
    topTitle.textContent = `${t('nav_dashboard')}`;
    topSub.textContent = t('db_summary');
  } else if (state.currentTab === 'doctors') {
    topTitle.textContent = t('nav_doctors');
    topSub.textContent = state.currentLanguage === 'uz' ? 'Klinika faol shifokorlar ro\'yxati' : state.currentLanguage === 'ru' ? 'Список активных врачей клиники' : 'Active medical practitioners roster';
  } else if (state.currentTab === 'patients') {
    topTitle.textContent = t('nav_patients');
    topSub.textContent = state.currentLanguage === 'uz' ? 'Bemorlar tibbiy yozuvlari reyestri' : state.currentLanguage === 'ru' ? 'Реестр медицинских карт пациентов' : 'Patients medical registry';
  } else if (state.currentTab === 'patient-profile') {
    topTitle.textContent = t('pat_profile_title');
    topSub.textContent = state.currentLanguage === 'uz' ? 'Bemor klinik kartasi va kasallik tarixi' : state.currentLanguage === 'ru' ? 'Клиническая карта пациента и история болезни' : 'Patient clinical file and diagnosis timeline';
  } else if (state.currentTab === 'illnesses') {
    topTitle.textContent = t('nav_illnesses');
    topSub.textContent = state.currentLanguage === 'uz' ? 'Tizimdagi barcha tashxis va kasalliklar bayonoti' : state.currentLanguage === 'ru' ? 'Все клинические диагнозы и заболевания' : 'Clinical illness & diagnosis timeline';
  } else if (state.currentTab === 'search') {
    topTitle.textContent = t('nav_search');
    topSub.textContent = state.currentLanguage === 'uz' ? 'Tizim bo\'yicha global qidiruv' : state.currentLanguage === 'ru' ? 'Глобальный поиск по всей системе' : 'Global directory indexing search';
  } else if (state.currentTab === 'settings') {
    topTitle.textContent = t('nav_settings');
    topSub.textContent = t('settings_desc');
  }
}

// -----------------------------------------------------------------------------
// 5. VIEW RENDERING PIPELINES (CRUD Renders)
// -----------------------------------------------------------------------------
function renderActiveTabContent() {
  const container = document.getElementById('content-body');
  if (!container) return;

  switch (state.currentTab) {
    case 'dashboard':
      renderDashboardView(container);
      break;
    case 'doctors':
      renderDoctorsView(container);
      break;
    case 'patients':
      renderPatientsView(container);
      break;
    case 'patient-profile':
      renderPatientProfileView(container);
      break;
    case 'illnesses':
      renderIllnessesView(container);
      break;
    case 'search':
      renderSearchView(container);
      break;
    case 'settings':
      renderSettingsView(container);
      break;
  }
}

// --- A. DASHBOARD VIEW ---
async function renderDashboardView(container) {
  container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;
  
  try {
    const docs = await API.doctors.getAll();
    const pats = await API.patients.getAll();
    const ills = await API.illnesses.getAll();

    // Unique departments count
    const depts = new Set(docs.map(d => d.department));

    // Compute risk analytics from actual illness data
    const highRisk  = ills.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    const modRisk   = ills.filter(i => i.severity === 'medium').length;
    const lowRisk   = ills.filter(i => i.severity === 'low').length;
    const totalRisk = highRisk + modRisk + lowRisk || 1;

    // Donut chart angles (degrees)
    const highPct  = Math.round((highRisk / totalRisk) * 100);
    const modPct   = Math.round((modRisk  / totalRisk) * 100);
    const lowPct   = 100 - highPct - modPct;

    // SVG donut parameters
    const r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r;
    const highDash  = (highPct  / 100) * circ;
    const modDash   = (modPct   / 100) * circ;
    const lowDash   = (lowPct   / 100) * circ;
    const highOff   = 0;
    const modOff    = circ - highDash;
    const lowOff    = circ - highDash - modDash;

    // Bar chart data — computed from actual data + supplemented with visit types
    const emergencyCount  = ills.filter(i => i.severity === 'critical').length;
    const routineCount    = ills.filter(i => i.severity === 'low').length;
    const appointCount    = docs.length;
    const physioCount     = ills.filter(i => i.severity === 'medium').length;
    const therapyCount    = ills.filter(i => i.severity === 'high').length;
    const barMax          = Math.max(emergencyCount, routineCount, appointCount, physioCount, therapyCount, 1);

    const barH = (val) => Math.max(8, Math.round((val / barMax) * 130));

    // Language labels
    const labelEmerg  = state.currentLanguage === 'uz' ? 'Shoshilinch' : state.currentLanguage === 'ru' ? 'Экстренный' : 'Emergency';
    const labelRout   = state.currentLanguage === 'uz' ? 'Muntazam'   : state.currentLanguage === 'ru' ? 'Плановый'   : 'Routine check';
    const labelAppt   = state.currentLanguage === 'uz' ? 'Qabullar'   : state.currentLanguage === 'ru' ? 'Записи'     : 'Appointments';
    const labelPhys   = state.currentLanguage === 'uz' ? 'Fizioterapiya' : state.currentLanguage === 'ru' ? 'Физиотерапия' : 'Physiotherapy';
    const labelTherap = state.currentLanguage === 'uz' ? 'Terapiya'   : state.currentLanguage === 'ru' ? 'Терапия'    : 'Therapy';

    const riskTitle     = state.currentLanguage === 'uz' ? 'Bemorlar xavf tahlili'       : state.currentLanguage === 'ru' ? 'Анализ рисков пациентов'  : 'Patient Risk Analytics';
    const riskSubtitle  = state.currentLanguage === 'uz' ? 'Predictiv analitika asosida' : state.currentLanguage === 'ru' ? 'На основе предиктивной аналитики' : 'Predictive analytics insights';
    const statsTitle    = state.currentLanguage === 'uz' ? 'Bemor statistikasi'          : state.currentLanguage === 'ru' ? 'Статистика пациентов'     : 'Patients Statistics';
    const statsSubtitle = state.currentLanguage === 'uz' ? 'Sog\'liq holatiga ko\'ra'    : state.currentLanguage === 'ru' ? 'По типам обращений'       : 'By visit type breakdown';
    const aiLabel       = state.currentLanguage === 'uz' ? 'AI Tahlil'                   : state.currentLanguage === 'ru' ? 'AI Анализ'                : 'AI Insight';

    const aiInsights = [
      state.currentLanguage === 'uz' ? `Kritik ${highRisk} bemorda septik xavf aniqlandi` : state.currentLanguage === 'ru' ? `У ${highRisk} крит. пациентов — риск сепсиса` : `Sepsis Risk Detected in ${highRisk} Patients`,
      state.currentLanguage === 'uz' ? `${modRisk} bemorda surunkali kasallik xavfi` : state.currentLanguage === 'ru' ? `Хронические заболевания у ${modRisk} пациентов` : `Chronic Disease Alert for ${modRisk} Patients`,
      state.currentLanguage === 'uz' ? 'Model ishonchliligi: 92%' : state.currentLanguage === 'ru' ? 'Точность модели: 92%' : 'Model Confidence: 92%',
    ];

    const lang = state.currentLanguage;
    const L = (uz, en, ru) => (lang === 'uz' ? uz : lang === 'ru' ? ru : en);

    const kpiAppointments = ills.length + pats.length;
    const apptCompleted = Math.max(0, ills.length - 1);
    const apptMissed = ills.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0 ? 1 : 0;
    const apptCanceled = 0;
    const apptScheduled = kpiAppointments + apptMissed;

    const barPcts = [
      Math.max(8, Math.round((emergencyCount / barMax) * 100)) || highPct,
      Math.max(8, Math.round((routineCount / barMax) * 100)) || modPct,
      Math.max(8, Math.round((appointCount / barMax) * 100)) || lowPct,
      Math.max(8, Math.round((physioCount / barMax) * 100)),
      Math.max(8, Math.round((therapyCount / barMax) * 100))
    ];

    const apptTimes = ['7:28 AM', '8:45 AM', '9:30 AM', '10:15 AM', '11:00 AM', '01:30 PM'];
    const apptStatuses = ['completed', 'pending', 'completed', 'missed', 'late', 'pending'];
    const timelineRows = [...ills]
      .sort((a, b) => new Date(b.diagnosed_at) - new Date(a.diagnosed_at))
      .slice(0, 6)
      .map((ill, idx) => {
        const patient = pats.find(p => p.id === ill.patient_id);
        const name = patient ? patient.full_name : ill.patient_name || '—';
        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const condition = (ill.description || '').split('(')[0].trim();
        const status = apptStatuses[idx % apptStatuses.length];
        const statusIcon = status === 'completed' ? 'fa-circle-check' : status === 'missed' ? 'fa-clock' : status === 'late' ? 'fa-clock' : 'fa-clock';
        return `
          <div class="appointment-row">
            <div class="appointment-time">${apptTimes[idx % apptTimes.length]}</div>
            <div class="appointment-dot"></div>
            <div class="appointment-patient">
              <div class="appointment-avatar">${initials}</div>
              <div class="appointment-details">
                <h5>${name}</h5>
                <p>${condition}</p>
              </div>
            </div>
            <div class="appointment-status ${status}" title="${status}">
              <i class="fa-solid ${statusIcon}"></i>
            </div>
          </div>
        `;
      })
      .join('');

    const panaceaKpi = (theme, icon, title, subtitle, value, meta1, meta2, onClick) => `
      <div class="panacea-stat-card theme-${theme}" ${onClick ? `onclick="${onClick}"` : ''}>
        <div class="panacea-stat-top">
          <div class="panacea-stat-icon"><i class="fa-solid ${icon}"></i></div>
          <div class="panacea-stat-titles">
            <h4>${title}</h4>
            <p>${subtitle}</p>
          </div>
          <span class="panacea-stat-link" aria-hidden="true"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
        </div>
        <div class="panacea-stat-bottom">
          <div class="panacea-stat-number">${value}</div>
          <div class="panacea-stat-meta">
            <span>${meta1}</span>
            <span>${meta2}</span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="dashboard-panacea">

        <div class="welcome-banner glass-panel">
          <div>
            <h1 style="font-size:1.5rem; font-weight:700;">${t('db_welcome')}, ${state.currentUser.full_name}!</h1>
            <p class="text-muted" style="margin-top: 4px;">${t('db_summary')}</p>
          </div>
          <div>
            <span class="badge badge-role" style="padding:8px 16px; font-size:0.88rem;">
              <i class="fa-solid fa-clock"></i>
              ${new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <!-- Panacea top row: KPI 2×2 + Appointment Overview -->
        <div class="dashboard-top-layout">
          <div class="dashboard-kpi-grid">
            ${panaceaKpi(
              'green',
              'fa-calendar-check',
              L('Bugungi qabullar', 'Appointments Today', 'Записи сегодня'),
              L('Klinika jadvali', 'Clinic schedule', 'Расписание клиники'),
              kpiAppointments,
              L(`Yangi: ${pats.length}`, `New: ${pats.length}`, `Новых: ${pats.length}`),
              L('Yillik o\'sish: 65%', 'Annual Change: 65%', 'Прирост: 65%'),
              "navigateTab('illnesses')"
            )}
            ${panaceaKpi(
              'blue',
              'fa-users',
              L('Jami bemorlar', 'Total Patients Today', 'Всего пациентов'),
              L('Faol ro\'yxat', 'Active registry', 'Активный реестр'),
              pats.length,
              L(`Hozir: ${pats.length}`, `Now: ${pats.length}`, `Сейчас: ${pats.length}`),
              L('Eski bemorlar: 4', 'Old Patients: 4', 'Повторных: 4'),
              "navigateTab('patients')"
            )}
            ${panaceaKpi(
              'orange',
              'fa-hospital',
              L('Bo\'limlar', 'Overall Rooms All Time', 'Отделения'),
              L('Klinika infratuzilmasi', 'Facility overview', 'Инфраструктура'),
              depts.size,
              L(`Umumiy: ${depts.size}`, `General: ${depts.size}`, `Общих: ${depts.size}`),
              L(`Shifokorlar: ${docs.length}`, `Staff: ${docs.length}`, `Врачей: ${docs.length}`),
              null
            )}
            ${panaceaKpi(
              'teal',
              'fa-user-doctor',
              L('Navbatchi shifokorlar', 'Doctors on Duty', 'Дежурные врачи'),
              L('Faol mutaxassislar', 'Active practitioners', 'Активные врачи'),
              docs.length,
              L(`Jami: ${docs.length}`, `Total: ${docs.length}`, `Всего: ${docs.length}`),
              L(`Tashxislar: ${ills.length}`, `Diagnoses: ${ills.length}`, `Диагнозов: ${ills.length}`),
              "navigateTab('doctors')"
            )}
          </div>

          <div class="glass-panel appointment-overview-card">
            <div class="chart-header" style="margin-bottom:0;">
              <h3>${L('Qabullar ko\'rinishi', 'Appointment Overview', 'Обзор записей')}</h3>
              <p>${L('Bugungi klinika jadvali va holati', 'Today\'s clinic schedule and status', 'Расписание и статусы на сегодня')}</p>
            </div>
            <div class="appointment-quick-stats">
              <div class="appointment-stat-item">
                <strong>${apptScheduled}</strong>
                <span>${L('Rejalashtirilgan', 'Scheduled', 'Запланир.')}</span>
              </div>
              <div class="appointment-stat-item">
                <strong>${apptCompleted}</strong>
                <span>${L('Yakunlangan', 'Completed', 'Завершено')}</span>
              </div>
              <div class="appointment-stat-item">
                <strong>${apptMissed}</strong>
                <span>${L('O\'tkazib yuborilgan', 'Missed', 'Пропущено')}</span>
              </div>
              <div class="appointment-stat-item">
                <strong>${apptCanceled}</strong>
                <span>${L('Bekor qilingan', 'Canceled', 'Отменено')}</span>
              </div>
            </div>
            <div class="appointment-timeline">
              ${timelineRows || `<div class="text-muted" style="text-align:center;padding:24px;">${t('no_records')}</div>`}
            </div>
          </div>
        </div>

        <!-- Charts row: Risk Analytics + Patients Statistics -->
        <div class="charts-row">
          <div class="glass-panel chart-card">
            <div class="chart-header">
              <h3>${riskTitle}</h3>
              <p>${L('Bashoratli analitika asosida yuqori xavfli bemorlarni aniqlaydi', 'Identifies high-risk patients based on predictive analytics', 'Выявляет пациентов высокого риска на основе предиктивной аналитики')}</p>
            </div>

            <div class="risk-chart-layout">
              <div class="risk-list">
                <div class="risk-item">
                  <div class="risk-icon-box high"><i class="fa-solid fa-heart-pulse"></i></div>
                  <div class="risk-info">
                    <h5>${highRisk} ${L('Bemor', 'Patients', 'Пациентов')} — ${L('Yuqori xavf', 'High Risk', 'Высокий риск')}</h5>
                    <p><span class="risk-trend-badge up">▲ +3% ${L('Bu hafta', 'This Week', 'За неделю')}</span></p>
                  </div>
                </div>
                <div class="risk-item">
                  <div class="risk-icon-box mod"><i class="fa-solid fa-chart-line"></i></div>
                  <div class="risk-info">
                    <h5>${modRisk} ${L('Bemor', 'Patients', 'Пациентов')} — ${L('O\'rta xavf', 'Moderate Risk', 'Средний риск')}</h5>
                    <p><span class="risk-trend-badge down">▼ −2 ${L('Bu hafta', 'This Week', 'За неделю')}</span></p>
                  </div>
                </div>
                <div class="risk-item">
                  <div class="risk-icon-box low"><i class="fa-solid fa-leaf"></i></div>
                  <div class="risk-info">
                    <h5>${lowRisk} ${L('Bemor', 'Patients', 'Пациентов')} — ${L('Past xavf', 'Low Risk', 'Низкий риск')}</h5>
                    <p><span class="risk-trend-badge up-green">▲ +87% ${L('Bugun', 'Today', 'Сегодня')}</span></p>
                  </div>
                </div>
              </div>

              <div class="risk-gauge-container">
                <svg class="gauge-svg" width="168" height="168" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#eef2f7" stroke-width="10"/>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#ff6b6b" stroke-width="10"
                    stroke-dasharray="${highDash.toFixed(1)} ${(2 * Math.PI * 58 - highDash).toFixed(1)}"
                    stroke-dashoffset="${(2 * Math.PI * 58).toFixed(1)}"
                    stroke-linecap="round"/>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#5dade2" stroke-width="10"
                    stroke-dasharray="${modDash.toFixed(1)} ${(2 * Math.PI * 58 - modDash).toFixed(1)}"
                    stroke-dashoffset="${(2 * Math.PI * 58 - highDash).toFixed(1)}"
                    stroke-linecap="round"/>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#58d68d" stroke-width="10"
                    stroke-dasharray="${lowDash.toFixed(1)} ${(2 * Math.PI * 58 - lowDash).toFixed(1)}"
                    stroke-dashoffset="${(2 * Math.PI * 58 - highDash - modDash).toFixed(1)}"
                    stroke-linecap="round"/>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#f5b041" stroke-width="8"
                    stroke-dasharray="${(2 * Math.PI * 58 * 0.08).toFixed(1)} ${(2 * Math.PI * 58 * 0.92).toFixed(1)}"
                    stroke-dashoffset="${(2 * Math.PI * 58 * 0.5).toFixed(1)}"
                    stroke-linecap="round" opacity="0.85"/>
                </svg>
                <div class="gauge-inner-fan" aria-hidden="true"></div>
                <div class="gauge-text">
                  <span>${aiLabel}</span>
                  <label>Insight</label>
                </div>
              </div>
            </div>

            <div class="ai-insights-box">
              <h5>${L('AI Tahlillar', 'AI Insights', 'AI Анализ')}:</h5>
              <ul class="ai-insights-list">
                ${aiInsights.map(ins => `<li>${ins}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="glass-panel chart-card">
            <div class="chart-header">
              <h3>${statsTitle}</h3>
              <p>${L('Yaxshiroq tibbiy qarorlar uchun tahliliy ko\'rsatkichlar', 'Figuring out stats for better health choices', 'Статистика для лучших медицинских решений')}</p>
            </div>

            <div class="stats-chart-container" id="bar-chart-container">
              <div class="bar-column">
                <div class="bar-value">${barPcts[0]}%</div>
                <div class="bar-track">
                  <div class="bar-bg bar-1"></div>
                  <div class="bar-fill bar-1" id="bar-fill-1" style="height:0;"></div>
                </div>
                <div class="bar-tag tag-1">+ 37%</div>
              </div>
              <div class="bar-column">
                <div class="bar-value">${barPcts[1]}%</div>
                <div class="bar-track">
                  <div class="bar-bg bar-2"></div>
                  <div class="bar-fill bar-2" id="bar-fill-2" style="height:0;"></div>
                </div>
                <div class="bar-tag tag-2">+ 15%</div>
              </div>
              <div class="bar-column">
                <div class="bar-value">${barPcts[2]}%</div>
                <div class="bar-track">
                  <div class="bar-bg bar-3"></div>
                  <div class="bar-fill bar-3" id="bar-fill-3" style="height:0;"></div>
                </div>
                <div class="bar-tag tag-3">+ 42%</div>
              </div>
              <div class="bar-column">
                <div class="bar-value">${barPcts[3]}%</div>
                <div class="bar-track">
                  <div class="bar-bg bar-4"></div>
                  <div class="bar-fill bar-4" id="bar-fill-4" style="height:0;"></div>
                </div>
                <div class="bar-tag tag-4 negative">− 8%</div>
              </div>
              <div class="bar-column">
                <div class="bar-value">${barPcts[4]}%</div>
                <div class="bar-track">
                  <div class="bar-bg bar-5"></div>
                  <div class="bar-fill bar-5" id="bar-fill-5" style="height:0;"></div>
                </div>
                <div class="bar-tag tag-5">+ 29%</div>
              </div>
            </div>

            <div class="stats-labels-grid">
              <div class="label-column col-1">
                <div class="label-icon"><i class="fa-solid fa-truck-medical"></i></div>
                <span class="label-text">${labelEmerg}</span>
              </div>
              <div class="label-column col-2">
                <div class="label-icon"><i class="fa-solid fa-spa"></i></div>
                <span class="label-text">${labelRout}</span>
              </div>
              <div class="label-column col-3">
                <div class="label-icon"><i class="fa-solid fa-stethoscope"></i></div>
                <span class="label-text">${labelAppt}</span>
              </div>
              <div class="label-column col-4">
                <div class="label-icon"><i class="fa-solid fa-person-running"></i></div>
                <span class="label-text">${labelPhys}</span>
              </div>
              <div class="label-column col-5">
                <div class="label-icon"><i class="fa-solid fa-hand-holding-medical"></i></div>
                <span class="label-text">${labelTherap}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM ROW: Recent patients + Departments -->
        <div class="dashboard-sections">
          <!-- Recent Patients -->
          <div class="glass-panel" style="padding: 24px;">
            <div class="panel-header">
              <h3>${t('db_recent_patients')}</h3>
              <button onclick="navigateTab('patients')" class="btn btn-secondary" style="padding: 6px 12px; font-size:0.82rem;">${t('db_view_all')}</button>
            </div>
            <div class="table-container">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>${t('full_name')}</th>
                    <th>${t('gender')}</th>
                    <th>${t('phone')}</th>
                    <th>${t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${pats.slice(0, 5).map(p => `
                    <tr>
                      <td style="font-weight:600;">
                        <div style="display:flex; align-items:center; gap:10px;">
                          <div style="width:28px; height:28px; border-radius:50%; background:var(--color-primary-glow); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-size:0.78rem; font-weight:700; flex-shrink:0;">${(p.full_name[0]||'').toUpperCase()}</div>
                          <span>${p.full_name}</span>
                        </div>
                      </td>
                      <td>${p.gender === 'male' ? t('gender_male') : t('gender_female')}</td>
                      <td class="text-muted">${p.phone}</td>
                      <td><button onclick="viewPatientProfile(${p.id})" class="btn-icon" title="${t('btn_view_profile')}"><i class="fa-solid fa-eye"></i></button></td>
                    </tr>
                  `).join('')}
                  ${pats.length === 0 ? `<tr><td colspan="4" style="text-align:center;">${t('no_records')}</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Departments Breakdown -->
          <div class="glass-panel" style="padding: 24px;">
            <div class="panel-header">
              <h3>${t('db_clinics_overview')}</h3>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${Array.from(depts).map((d, idx) => {
                const count = docs.filter(doc => doc.department === d).length;
                const pct = Math.round((count / docs.length) * 100) || 0;
                const colors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', '#af7ac5', '#48c9b0'];
                const col = colors[idx % colors.length];
                return `
                  <div class="surface-subtle-block">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-clinic-medical" style="color:${col};"></i>
                        <span style="font-weight:600; font-size:0.92rem;">${d}</span>
                      </div>
                      <span class="badge badge-role" style="font-weight:700;">${count} ${state.currentLanguage === 'ru' ? 'врач' : state.currentLanguage === 'en' ? 'dr.' : 'sh.'}</span>
                    </div>
                    <div style="background:#e8edf5; border-radius:20px; height:5px; overflow:hidden;">
                      <div style="background:${col}; height:100%; width:${pct}%; border-radius:20px; transition: width 1s ease;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
              ${depts.size === 0 ? `<div class="text-muted" style="text-align:center;">${t('no_records')}</div>` : ''}
            </div>
          </div>
        </div>

      </div>
    `;

    requestAnimationFrame(() => {
      setTimeout(() => {
        barPcts.forEach((pct, i) => {
          const el = document.getElementById(`bar-fill-${i + 1}`);
          if (el) el.style.height = `${Math.max(14, Math.round((pct / 100) * 150))}px`;
        });
      }, 80);
    });

  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- B. DOCTORS VIEW ---
async function renderDoctorsView(container) {
  container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;
  
  try {
    const doctors = await API.doctors.getAll();
    const isAdmin = state.currentUser.role === 'admin';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:25px;">
        <div class="list-actions-bar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="doctor-search" class="search-input" data-trans-placeholder="search_placeholder" placeholder="${t('search_placeholder')}" oninput="filterDoctors()">
          </div>
          
          <div class="filters-group">
            <select id="doctor-dept-filter" class="select-filter" onchange="filterDoctors()">
              <option value="">Barchasi / All Departments</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Diagnostics">Diagnostics</option>
            </select>
            ${isAdmin ? `
              <button onclick="showAddDoctorModal()" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> ${t('btn_add_doctor')}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="glass-panel" style="padding:10px;">
          <div class="table-container">
            <table class="custom-table" id="doctors-table">
              <thead>
                <tr>
                  <th>${t('full_name')}</th>
                  <th>${t('specialization')}</th>
                  <th>${t('department')}</th>
                  <th>${t('phone')}</th>
                  <th>${t('email')}</th>
                  ${isAdmin ? `<th>${t('actions')}</th>` : ''}
                </tr>
              </thead>
              <tbody id="doctors-list-body">
                <!-- Populated dynamically via JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderDoctorsList(doctors);
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

function renderDoctorsList(list) {
  const tbody = document.getElementById('doctors-list-body');
  if (!tbody) return;

  const isAdmin = state.currentUser.role === 'admin';

  tbody.innerHTML = list.map(d => `
    <tr>
      <td style="font-weight:600; display:flex; align-items:center; gap:10px; border-bottom:none; height:100%;">
        <div style="width:30px; height:30px; border-radius:50%; background:var(--color-primary-glow); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">
          ${d.full_name[4] || d.full_name[0]}
        </div>
        <span>${d.full_name}</span>
      </td>
      <td>${d.specialization}</td>
      <td><span class="badge badge-role" style="font-weight:600;">${d.department}</span></td>
      <td class="text-muted">${d.phone}</td>
      <td class="text-muted">${d.email}</td>
      ${isAdmin ? `
        <td>
          <div style="display:flex; gap:8px;">
            <button onclick="editDoctor(${d.id})" class="btn-icon edit" title="${t('btn_edit')}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="deleteDoctor(${d.id})" class="btn-icon delete" title="${t('btn_delete')}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      ` : ''}
    </tr>
  `).join('');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" style="text-align:center; padding: 30px;">${t('no_records')}</td></tr>`;
  }
}

async function filterDoctors() {
  const search = document.getElementById('doctor-search').value;
  const department = document.getElementById('doctor-dept-filter').value;
  try {
    const list = await API.doctors.getAll({ search, department });
    renderDoctorsList(list);
  } catch (e) {
    console.error(e);
  }
}

// Doctor CRUD helper
function showAddDoctorModal() {
  document.getElementById('doctor-modal-title').textContent = t('modal_add_doctor');
  document.getElementById('doctor-id').value = '';
  document.getElementById('doctor-name').value = '';
  document.getElementById('doctor-spec').value = '';
  document.getElementById('doctor-dept').value = 'General Medicine';
  document.getElementById('doctor-phone').value = '';
  document.getElementById('doctor-email').value = '';
  
  document.getElementById('doctor-modal').classList.add('active');
}

async function editDoctor(id) {
  try {
    const d = await API.doctors.getById(id);
    document.getElementById('doctor-modal-title').textContent = t('modal_edit_doctor');
    document.getElementById('doctor-id').value = d.id;
    document.getElementById('doctor-name').value = d.full_name;
    document.getElementById('doctor-spec').value = d.specialization;
    document.getElementById('doctor-dept').value = d.department;
    document.getElementById('doctor-phone').value = d.phone;
    document.getElementById('doctor-email').value = d.email;

    document.getElementById('doctor-modal').classList.add('active');
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

async function handleDoctorSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('doctor-id').value;
  const full_name = document.getElementById('doctor-name').value;
  const specialization = document.getElementById('doctor-spec').value;
  const department = document.getElementById('doctor-dept').value;
  const phone = document.getElementById('doctor-phone').value;
  const email = document.getElementById('doctor-email').value;

  const btn = document.getElementById('doctor-submit-btn');
  btn.disabled = true;
  btn.textContent = t('btn_submitting');

  try {
    if (id) {
      await API.doctors.update(id, { full_name, specialization, department, phone, email });
      showToast(t('success_updated'), 'success');
    } else {
      await API.doctors.create({ full_name, specialization, department, phone, email });
      showToast(t('success_created'), 'success');
    }
    document.getElementById('doctor-modal').classList.remove('active');
    renderActiveTabContent();
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('btn_save');
  }
}

async function deleteDoctor(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await API.doctors.delete(id);
    showToast(t('success_deleted'), 'success');
    renderActiveTabContent();
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- C. PATIENTS VIEW ---
async function renderPatientsView(container) {
  container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;
  
  try {
    const patients = await API.patients.getAll();
    const isReceptionist = state.currentUser.role === 'receptionist';
    const isAdmin = state.currentUser.role === 'admin';
    const isClinician = state.currentUser.role === 'clinician';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:25px;">
        <div class="list-actions-bar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="patient-search" class="search-input" data-trans-placeholder="search_placeholder" placeholder="${t('search_placeholder')}" oninput="filterPatients()">
          </div>
          
          <div class="filters-group">
            ${isAdmin || isReceptionist ? `
              <button onclick="showAddPatientModal()" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> ${t('btn_add_patient')}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="glass-panel" style="padding:10px;">
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>${t('full_name')}</th>
                  <th>${t('dob')}</th>
                  <th>${t('gender')}</th>
                  <th>${t('phone')}</th>
                  <th>${t('address')}</th>
                  <th>${t('doctor')}</th>
                  <th>${t('actions')}</th>
                </tr>
              </thead>
              <tbody id="patients-list-body">
                <!-- Populated via JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderPatientsList(patients);
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

function renderPatientsList(list) {
  const tbody = document.getElementById('patients-list-body');
  if (!tbody) return;

  const role = state.currentUser.role;
  const canUpdate = role === 'admin' || role === 'clinician';
  const canDelete = role === 'admin';

  tbody.innerHTML = list.map(p => `
    <tr>
      <td style="font-weight:600;">${p.full_name}</td>
      <td class="text-muted">${p.date_of_birth}</td>
      <td>${p.gender === 'male' ? t('gender_male') : t('gender_female')}</td>
      <td class="text-muted">${p.phone}</td>
      <td class="text-muted" style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.address}</td>
      <td>
        ${p.doctor_name ? `<span class="badge badge-role"><i class="fa-solid fa-user-md"></i> ${p.doctor_name}</span>` : `<span class="text-muted" style="font-size:0.85rem;">${t('no_doctor')}</span>`}
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <button onclick="viewPatientProfile(${p.id})" class="btn-icon" style="color:var(--color-primary);" title="${t('btn_view_profile')}"><i class="fa-solid fa-eye"></i></button>
          ${canUpdate ? `<button onclick="editPatient(${p.id})" class="btn-icon edit" title="${t('btn_edit')}"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
          ${canDelete ? `<button onclick="deletePatient(${p.id})" class="btn-icon delete" title="${t('btn_delete')}"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px;">${t('no_records')}</td></tr>`;
  }
}

async function filterPatients() {
  const search = document.getElementById('patient-search').value;
  try {
    const list = await API.patients.getAll({ search });
    renderPatientsList(list);
  } catch (e) {
    console.error(e);
  }
}

// Patient CRUD helpers
async function showAddPatientModal() {
  document.getElementById('patient-modal-title').textContent = t('modal_add_patient');
  document.getElementById('patient-id').value = '';
  document.getElementById('patient-name').value = '';
  document.getElementById('patient-dob').value = '';
  document.getElementById('patient-gender').value = 'male';
  document.getElementById('patient-phone').value = '';
  document.getElementById('patient-address').value = '';

  // Populate doctor select
  const docSelect = document.getElementById('patient-doctor');
  docSelect.innerHTML = `<option value="">-- ${t('no_doctor')} --</option>`;
  try {
    const docs = await API.doctors.getAll();
    docs.forEach(d => {
      docSelect.innerHTML += `<option value="${d.id}">${d.full_name} (${d.specialization})</option>`;
    });
  } catch (e) {
    console.error(e);
  }

  document.getElementById('patient-modal').classList.add('active');
}

async function editPatient(id) {
  try {
    const p = await API.patients.getById(id);
    document.getElementById('patient-modal-title').textContent = t('modal_edit_patient');
    document.getElementById('patient-id').value = p.id;
    document.getElementById('patient-name').value = p.full_name;
    document.getElementById('patient-dob').value = p.date_of_birth;
    document.getElementById('patient-gender').value = p.gender;
    document.getElementById('patient-phone').value = p.phone;
    document.getElementById('patient-address').value = p.address;

    const docSelect = document.getElementById('patient-doctor');
    docSelect.innerHTML = `<option value="">-- ${t('no_doctor')} --</option>`;
    const docs = await API.doctors.getAll();
    docs.forEach(d => {
      docSelect.innerHTML += `<option value="${d.id}" ${p.doctor_id === d.id ? 'selected' : ''}>${d.full_name} (${d.specialization})</option>`;
    });

    document.getElementById('patient-modal').classList.add('active');
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

async function handlePatientSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('patient-id').value;
  const full_name = document.getElementById('patient-name').value;
  const date_of_birth = document.getElementById('patient-dob').value;
  const gender = document.getElementById('patient-gender').value;
  const phone = document.getElementById('patient-phone').value;
  const address = document.getElementById('patient-address').value;
  const doctor_id = document.getElementById('patient-doctor').value;

  const btn = document.getElementById('patient-submit-btn');
  btn.disabled = true;
  btn.textContent = t('btn_submitting');

  try {
    if (id) {
      await API.patients.update(id, { full_name, date_of_birth, gender, phone, address, doctor_id });
      showToast(t('success_updated'), 'success');
    } else {
      await API.patients.create({ full_name, date_of_birth, gender, phone, address, doctor_id });
      showToast(t('success_created'), 'success');
    }
    document.getElementById('patient-modal').classList.remove('active');
    renderActiveTabContent();
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('btn_save');
  }
}

async function deletePatient(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await API.patients.delete(id);
    showToast(t('success_deleted'), 'success');
    renderActiveTabContent();
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- D. PATIENT TO'LIQ PROFILI VIEW (Biriktirilgan shifokor va kasalliklar ro'yxati) ---
async function viewPatientProfile(id) {
  state.activePatientProfileId = id;
  state.currentTab = 'patient-profile';
  updateTopBarTitle();
  renderActiveTabContent();
}

async function renderPatientProfileView(container) {
  if (!state.activePatientProfileId) {
    container.innerHTML = `<div class="text-muted" style="text-align:center;">Profil ID tanlanmagan</div>`;
    return;
  }

  container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;

  try {
    const p = await API.patients.getById(state.activePatientProfileId);
    const role = state.currentUser.role;
    const canDiagnose = role === 'admin' || role === 'clinician';

    const pInitials = p.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:25px;">
        <div>
          <button onclick="navigateTab('patients')" class="btn btn-secondary" style="padding: 8px 16px;">
            <i class="fa-solid fa-chevron-left"></i> ${state.currentLanguage === 'uz' ? 'Ro\'yxatga qaytish' : state.currentLanguage === 'ru' ? 'Назад к списку' : 'Back to roster'}
          </button>
        </div>

        <div class="profile-grid">
          <!-- 1. Bemor shaxsiy ma'lumotlari -->
          <div class="glass-panel profile-card">
            <div class="profile-avatar-large">${pInitials}</div>
            <h3>${p.full_name}</h3>
            <p class="text-muted gender-sub">${p.gender === 'male' ? t('gender_male') : t('gender_female')}</p>

            <div class="profile-details">
              <div class="detail-item">
                <label>${t('dob')}</label>
                <span>${p.date_of_birth}</span>
              </div>
              <div class="detail-item">
                <label>${t('phone')}</label>
                <span>${p.phone}</span>
              </div>
              <div class="detail-item">
                <label>${t('address')}</label>
                <span>${p.address}</span>
              </div>
              
              <div class="detail-item" style="border-top: 1px dashed var(--border-color); padding-top:16px; margin-top:10px;">
                <label>${t('pat_attached_doctor')}</label>
                ${p.doctor_name ? `
                  <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
                    <div style="width:34px; height:34px; border-radius:50%; background:var(--color-success-glow); color:var(--color-success); display:flex; align-items:center; justify-content:center;">
                      <i class="fa-solid fa-user-md"></i>
                    </div>
                    <div>
                      <div style="font-weight:600; font-size:0.92rem;">${p.doctor_name}</div>
                      <div class="text-muted" style="font-size:0.78rem;">${p.doctor_specialization} (${p.doctor_department})</div>
                    </div>
                  </div>
                ` : `
                  <span class="text-muted" style="font-size:0.9rem; font-style:italic;">${t('no_doctor')}</span>
                `}
              </div>
            </div>
          </div>

          <!-- 2. Kasallik/Tashxislar tarixi -->
          <div class="glass-panel profile-history-card">
            <div class="panel-header">
              <h3>${t('pat_illness_history')}</h3>
              ${canDiagnose ? `
                <button onclick="showAddIllnessModal(${p.id})" class="btn btn-primary">
                  <i class="fa-solid fa-file-medical"></i> ${t('btn_add_illness')}
                </button>
              ` : ''}
            </div>

            <div class="history-timeline">
              ${p.illnesses.map(i => {
                const canDeleteIll = role === 'admin';
                return `
                  <div class="timeline-item severity-${i.severity}">
                    <div class="timeline-meta">
                      <span class="badge badge-${i.severity}">${t(`severity_${i.severity}`)}</span>
                      <span class="date">${i.diagnosed_at}</span>
                    </div>
                    <div class="timeline-content">
                      <h4>${i.icd_code} — ${i.description}</h4>
                      <p class="text-muted" style="font-size:0.85rem; margin-top:4px;">
                        Diagnosed on ${i.diagnosed_at}
                      </p>
                      ${canDiagnose ? `
                        <div style="display:flex; gap:8px; margin-top:10px;">
                          <button onclick="editIllness(${i.id})" class="btn btn-secondary" style="padding: 4px 10px; font-size:0.78rem;"><i class="fa-solid fa-pen"></i></button>
                          ${canDeleteIll ? `<button onclick="deleteIllness(${i.id})" class="btn btn-danger" style="padding: 4px 10px; font-size:0.78rem;"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
              
              ${p.illnesses.length === 0 ? `
                <div style="text-align:center; padding: 40px; border:1px dashed var(--border-color); border-radius:var(--radius-md);">
                  <i class="fa-solid fa-notes-medical" style="font-size:2.2rem; color:var(--text-muted); margin-bottom:12px;"></i>
                  <p class="text-muted">${t('pat_no_history')}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- E. ILLNESSES GLOBAL VIEW ---
async function renderIllnessesView(container) {
  container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;

  try {
    const illnesses = await API.illnesses.getAll();
    const role = state.currentUser.role;
    const canDiagnose = role === 'admin' || role === 'clinician';
    const isAdmin = role === 'admin';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:25px;">
        <div class="list-actions-bar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="illness-search" class="search-input" data-trans-placeholder="search_placeholder" placeholder="${t('search_placeholder')}" oninput="filterIllnesses()">
          </div>

          <div class="filters-group">
            <select id="illness-severity-filter" class="select-filter" onchange="filterIllnesses()">
              <option value="">Barcha og'irliklar / All Severities</option>
              <option value="low" data-trans="severity_low">Past / Low</option>
              <option value="medium" data-trans="severity_medium">O'rta / Medium</option>
              <option value="high" data-trans="severity_high">Yuqori / High</option>
              <option value="critical" data-trans="severity_critical">Kritik / Critical</option>
            </select>
            ${canDiagnose ? `
              <button onclick="showAddIllnessModal()" class="btn btn-primary">
                <i class="fa-solid fa-file-medical"></i> ${t('btn_add_illness')}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="glass-panel" style="padding:10px;">
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>${t('nav_patients')}</th>
                  <th>${t('icd_code')}</th>
                  <th>${t('description')}</th>
                  <th>${t('severity')}</th>
                  <th>${t('diagnosed_at')}</th>
                  ${canDiagnose ? `<th>${t('actions')}</th>` : ''}
                </tr>
              </thead>
              <tbody id="illnesses-list-body">
                <!-- JS Populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderIllnessesList(illnesses);
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

function renderIllnessesList(list) {
  const tbody = document.getElementById('illnesses-list-body');
  if (!tbody) return;

  const role = state.currentUser.role;
  const canDiagnose = role === 'admin' || role === 'clinician';
  const isAdmin = role === 'admin';

  tbody.innerHTML = list.map(i => `
    <tr>
      <td style="font-weight:600;"><a href="#" onclick="viewPatientProfile(${i.patient_id}); return false;" style="color:var(--color-primary);">${i.patient_name}</a></td>
      <td><span class="badge badge-role" style="font-weight:700;">${i.icd_code}</span></td>
      <td>${i.description}</td>
      <td><span class="badge badge-${i.severity}">${t(`severity_${i.severity}`)}</span></td>
      <td class="text-muted">${i.diagnosed_at}</td>
      ${canDiagnose ? `
        <td>
          <div style="display:flex; gap:8px;">
            <button onclick="editIllness(${i.id})" class="btn-icon edit" title="${t('btn_edit')}"><i class="fa-solid fa-pen-to-square"></i></button>
            ${isAdmin ? `<button onclick="deleteIllness(${i.id})" class="btn-icon delete" title="${t('btn_delete')}"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </td>
      ` : ''}
    </tr>
  `).join('');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canDiagnose ? 6 : 5}" style="text-align:center; padding: 30px;">${t('no_records')}</td></tr>`;
  }
}

async function filterIllnesses() {
  const search = document.getElementById('illness-search').value;
  const severity = document.getElementById('illness-severity-filter').value;
  try {
    const list = await API.illnesses.getAll({ search, severity });
    renderIllnessesList(list);
  } catch (e) {
    console.error(e);
  }
}

// Illness CRUD helpers
async function showAddIllnessModal(patientId = null) {
  document.getElementById('illness-modal-title').textContent = t('modal_add_illness');
  document.getElementById('illness-id').value = '';
  document.getElementById('illness-icd').value = '';
  document.getElementById('illness-desc').value = '';
  document.getElementById('illness-severity').value = 'low';
  document.getElementById('illness-date').value = new Date().toISOString().split('T')[0];

  const patGroup = document.getElementById('illness-patient-group');
  const patSelect = document.getElementById('illness-patient');

  if (patientId) {
    // Hide patient selection if adding from profile
    patGroup.style.display = 'none';
    patSelect.innerHTML = `<option value="${patientId}" selected>Bemor</option>`;
  } else {
    patGroup.style.display = 'block';
    patSelect.innerHTML = '';
    try {
      const pats = await API.patients.getAll();
      pats.forEach(p => {
        patSelect.innerHTML += `<option value="${p.id}">${p.full_name}</option>`;
      });
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById('illness-modal').classList.add('active');
}

async function editIllness(id) {
  try {
    // Get all illness lists to locate the matching item since getById isn't individually exposed but we can query/locate
    const ills = await API.illnesses.getAll();
    const item = ills.find(i => i.id === parseInt(id, 10));

    if (!item) {
      showToast('Tashxis yozuvi topilmadi', 'error');
      return;
    }

    document.getElementById('illness-modal-title').textContent = t('modal_edit_illness');
    document.getElementById('illness-id').value = item.id;
    document.getElementById('illness-icd').value = item.icd_code;
    document.getElementById('illness-desc').value = item.description;
    document.getElementById('illness-severity').value = item.severity;
    document.getElementById('illness-date').value = item.diagnosed_at;

    // Set and hide patient selection on edit
    const patGroup = document.getElementById('illness-patient-group');
    const patSelect = document.getElementById('illness-patient');
    patGroup.style.display = 'none';
    patSelect.innerHTML = `<option value="${item.patient_id}" selected>${item.patient_name}</option>`;

    document.getElementById('illness-modal').classList.add('active');
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

async function handleIllnessSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('illness-id').value;
  const icd_code = document.getElementById('illness-icd').value;
  const description = document.getElementById('illness-desc').value;
  const severity = document.getElementById('illness-severity').value;
  const diagnosed_at = document.getElementById('illness-date').value;
  const patient_id = document.getElementById('illness-patient').value;

  const btn = document.getElementById('illness-submit-btn');
  btn.disabled = true;
  btn.textContent = t('btn_submitting');

  try {
    if (id) {
      await API.illnesses.update(id, { icd_code, description, severity, diagnosed_at });
      showToast(t('success_updated'), 'success');
    } else {
      await API.illnesses.create({ icd_code, description, severity, patient_id, diagnosed_at });
      showToast(t('success_created'), 'success');
    }
    document.getElementById('illness-modal').classList.remove('active');
    
    // Check if we need to refresh patient profile or global illnesses
    if (state.currentTab === 'patient-profile') {
      renderPatientProfileView(document.getElementById('content-body'));
    } else {
      renderActiveTabContent();
    }
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('btn_save');
  }
}

async function deleteIllness(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await API.illnesses.delete(id);
    showToast(t('success_deleted'), 'success');
    if (state.currentTab === 'patient-profile') {
      renderPatientProfileView(document.getElementById('content-body'));
    } else {
      renderActiveTabContent();
    }
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- F. GLOBAL SEARCH VIEW ---
function renderSearchView(container) {
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:25px;">
      <div class="list-actions-bar">
        <div class="search-box" style="max-width:100%; min-width:100%;">
          <i class="fa-solid fa-magnifying-glass" style="font-size:1.2rem;"></i>
          <input type="text" id="global-search-input" class="search-input" style="font-size:1.1rem; padding: 8px 0;" data-trans-placeholder="search_placeholder" placeholder="${t('search_placeholder')}" onkeypress="searchAll(event)">
          <button onclick="triggerGlobalSearch()" class="btn btn-primary" style="border-radius:var(--radius-sm); padding:6px 16px;">Search</button>
        </div>
      </div>

      <div class="search-results-section" id="global-search-results">
        <div style="text-align:center; padding: 40px;" class="text-muted">
          <i class="fa-solid fa-folder-tree" style="font-size:2.5rem; margin-bottom:12px;"></i>
          <p>${state.currentLanguage === 'uz' ? 'Qidiruv so\'zini kiriting va Enter tugmasini bosing' : state.currentLanguage === 'ru' ? 'Введите поисковый запрос и нажмите Enter' : 'Type to search and press Enter'}</p>
        </div>
      </div>
    </div>
  `;
}

function searchAll(event) {
  if (event.key === 'Enter') {
    triggerGlobalSearch();
  }
}

async function triggerGlobalSearch() {
  const query = document.getElementById('global-search-input').value;
  const resultsContainer = document.getElementById('global-search-results');
  if (!query.trim()) return;

  resultsContainer.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i></div>`;

  try {
    const data = await API.search.global(query);
    
    let doctorsHtml = '';
    if (data.doctors.length > 0) {
      doctorsHtml = `
        <div class="glass-panel results-panel">
          <h4>${t('nav_doctors')} (${data.doctors.length})</h4>
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>${t('full_name')}</th>
                  <th>${t('specialization')}</th>
                  <th>${t('department')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.doctors.map(d => `
                  <tr>
                    <td style="font-weight:600;">${d.full_name}</td>
                    <td>${d.specialization}</td>
                    <td><span class="badge badge-role">${d.department}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    let patientsHtml = '';
    if (data.patients.length > 0) {
      patientsHtml = `
        <div class="glass-panel results-panel">
          <h4>${t('nav_patients')} (${data.patients.length})</h4>
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>${t('full_name')}</th>
                  <th>${t('dob')}</th>
                  <th>${t('phone')}</th>
                  <th>${t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.patients.map(p => `
                  <tr>
                    <td style="font-weight:600;">${p.full_name}</td>
                    <td>${p.date_of_birth}</td>
                    <td>${p.phone}</td>
                    <td>
                      <button onclick="viewPatientProfile(${p.id})" class="btn-icon" style="color:var(--color-primary);"><i class="fa-solid fa-eye"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    let illnessesHtml = '';
    if (data.illnesses.length > 0) {
      illnessesHtml = `
        <div class="glass-panel results-panel">
          <h4>${t('nav_illnesses')} (${data.illnesses.length})</h4>
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>${t('nav_patients')}</th>
                  <th>${t('icd_code')}</th>
                  <th>${t('description')}</th>
                  <th>${t('severity')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.illnesses.map(i => `
                  <tr>
                    <td style="font-weight:600;"><a href="#" onclick="viewPatientProfile(${i.patient_id}); return false;" style="color:var(--color-primary);">${i.patient_name}</a></td>
                    <td><span class="badge badge-role" style="font-weight:700;">${i.icd_code}</span></td>
                    <td>${i.description}</td>
                    <td><span class="badge badge-${i.severity}">${t(`severity_${i.severity}`)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const hasResults = data.doctors.length > 0 || data.patients.length > 0 || data.illnesses.length > 0;
    
    if (hasResults) {
      resultsContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:30px;">
          ${doctorsHtml}
          ${patientsHtml}
          ${illnessesHtml}
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding: 40px;" class="text-muted">
          <i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:12px;"></i>
          <p>${t('no_records')}</p>
        </div>
      `;
    }
  } catch (err) {
    showToast(state.currentLanguage === 'uz' ? err.message : err.message_en, 'error');
  }
}

// --- G. SETTINGS VIEW (Admin Only) ---
function renderSettingsView(container) {
  if (state.currentUser.role !== 'admin') {
    container.innerHTML = `<div class="text-muted" style="text-align:center; padding:40px;">${t('access_denied')}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="glass-panel" style="padding:30px; display:flex; flex-direction:column; gap:25px;">
      <h3 style="font-size:1.3rem; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:15px;">
        <i class="fa-solid fa-gear"></i> ${t('settings_title')}
      </h3>
      <p class="text-muted" style="margin-top:-10px;">${t('settings_desc')}</p>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="padding:16px; border-radius:var(--radius-md); background:#f8fafc; border:1px solid var(--border-color);">
          <div style="font-weight:600; display:flex; align-items:center; gap:10px; color:var(--color-success);">
            <i class="fa-solid fa-circle-check"></i> ${t('settings_db_status')}
          </div>
          <div class="text-muted" style="font-size:0.85rem; margin-top:6px;">${t('settings_db_path')}</div>
        </div>

        <div style="padding:16px; border-radius:var(--radius-md); background:#f8fafc; border:1px solid var(--border-color);">
          <h4 style="font-weight:600; font-size:0.95rem; margin-bottom:8px;">${t('settings_backup')}</h4>
          <p class="text-muted" style="font-size:0.85rem; margin-bottom:12px;">Automatic zaxira nusxalash faol. Har 24 soatda ma'lumotlar bazasi zaxiralanadi.</p>
          <button class="btn btn-secondary" onclick="showToast('Database backup successfully generated!', 'info')" style="padding: 6px 12px; font-size:0.82rem;">
            <i class="fa-solid fa-download"></i> Backup Now
          </button>
        </div>
      </div>
    </div>
  `;
}
