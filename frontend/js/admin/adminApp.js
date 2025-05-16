import * as auth from '../auth/auth.js';
import * as ui from '../ui/utils/uiUtils.js';
import * as nav from './admin/navigation.js';
import * as tournamentHandler from './admin/tournamentHandler.js';
import * as playerHandler from './admin/playerHandler.js';
import * as scoreHandler from './admin/scoreHandler.js';
import * as bracketHandler from './admin/bracketHandler.js';
import * as scheduleHandler from './admin/scheduleHandler.js';
import * as trashHandler from './admin/trashHandler.js';
import * as dashboardHandler from './admin/dashboardHandler.js';
import * as securityStatsHandler from './admin/securityStatsHandler.js';
import { themeManager } from '../ui/theme/theme.js';

const elements = {
  loginSection: document.getElementById('login-section'),
  adminDashboard:
    document.getElementById('admin-dashboard') ||
    document.getElementById('security-dashboard'),
  loginForm: document.getElementById('login-form'),
  logoutBtnSidebar: document.getElementById('logout-btn'),
};

async function showAdminDashboardUI() {
  elements.loginSection?.classList.add('hidden-section');
  elements.adminDashboard?.classList.remove('hidden-section');

  if (window.location.pathname.includes('admin-security.html')) {
    await nav.showSection('security-overview');
  } else {
    await nav.showSection('torneios');
  }
}

function showLoginFormUI() {
  elements.loginSection?.classList.remove('hidden-section');
  elements.adminDashboard?.classList.add('hidden-section');
}

document.addEventListener('DOMContentLoaded', () => {
  const sectionLoadCallbacks = {
    dashboard: dashboardHandler.refreshDashboard,
    torneios: tournamentHandler.loadTournamentsList,
    'security-overview': securityStatsHandler.loadSecurityStats,
    placar: scoreHandler.loadScoresHistory,
    jogadores: playerHandler.loadPlayersList,
    torneio: bracketHandler.loadTournamentState,
    lixeira: trashHandler.loadTrash,
    agendamento: scheduleHandler.populateScheduleMatchSelect,
  };

  ui.initializeSidebar();
  ui.initializeProfileMenu(
    'profile-btn',
    'profile-menu',
    'admin-logout-menu-btn'
  );

  // Inicializa o gerenciador de temas
  themeManager.initialSetup();
  ui.initializeProfileMenu(
    'profile-btn-desktop',
    'profile-menu-desktop',
    'admin-logout-menu-btn-desktop'
  );

  nav.initializeNavigation(sectionLoadCallbacks);

  dashboardHandler.initDashboard();
  tournamentHandler.initializeTournamentSection();
  playerHandler.initializePlayerSection();
  scoreHandler.initializeScoreSection();
  bracketHandler.initializeBracketSection();
  scheduleHandler.initializeScheduleSection();
  trashHandler.initializeTrashSection();
  securityStatsHandler.init();

  elements.loginForm?.addEventListener('submit', (event) => {
    auth.handleLogin(event, showAdminDashboardUI);
  });

  elements.logoutBtnSidebar?.addEventListener('click', () => {
    auth.handleLogout(showLoginFormUI);
  });

  auth.checkAuthentication(showAdminDashboardUI, showLoginFormUI);
});
