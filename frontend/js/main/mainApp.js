import {
  setupKeyboardNavigation,
  setupTabOrder,
} from '../ui/accessibility/a11yKeyboardNav.js';
import * as api from '../api/apiService.js';
import { getAuthToken } from '../auth/auth.js';
import {
  auditImagesAccessibility,
  initImageUtils,
} from '../utils/imageUtils.js';
import * as bracketRenderer from './bracketRenderer.js';
import * as scoreHandler from './scoreHandler.js';
import * as statsHandler from './statsHandler.js';
import * as state from '../state/state.js';
import { themeManager } from '../ui/theme/theme.js';
import * as ui from '../ui/utils/uiUtils.js';

const elements = {
  tournamentSelectorContainer: document.getElementById(
    'tournament-selector-container'
  ),
  homeSection: document.getElementById('home-section'),
  bracketSection: document.getElementById('bracket-section'),
  scoresSection: document.getElementById('scores-section'),
  addScoreSection: document.getElementById('add-score-section'),
  statsSection: document.getElementById('stats-section'),
  btnHome: document.getElementById('btn-home'),
  btnBracket: document.getElementById('btn-bracket'),
  btnScores: document.getElementById('btn-scores'),
  btnAddScore: document.getElementById('btn-add-score'),
  btnStats: document.getElementById('btn-stats'),
  loginAdminLi: document.getElementById('login-admin-li'),
  backToAdminLi: document.getElementById('back-to-admin-li'),
  logoutLi: document.getElementById('logout-li'),
  indexLogoutBtn: document.getElementById('index-logout-btn'),
  profileBtn: document.getElementById('profile-btn-index'),
  profileMenu: document.getElementById('profile-menu-index'),
  profileAdminLink: document.getElementById('profile-menu-admin-link'),
  profileLogoutBtn: document.getElementById('profile-menu-logout-btn'),
};

let isLoggedIn = false;

function checkAuthenticationStatus() {
  isLoggedIn = !!getAuthToken();
  updateInterfaceBasedOnAuth();
  updateProfileMenuAuth();
}

function updateInterfaceBasedOnAuth() {
  if (elements.btnAddScore) {
    elements.btnAddScore.closest('.sidebar-item').style.display = isLoggedIn ? '' : 'none';
  }
  if (elements.loginAdminLi) {
    elements.loginAdminLi.style.display = isLoggedIn ? 'none' : '';
  }
  if (elements.backToAdminLi) {
    elements.backToAdminLi.style.display = isLoggedIn ? '' : 'none';
  }
  if (elements.logoutLi) {
    elements.logoutLi.style.display = isLoggedIn ? '' : 'none';
  }
}

function updateProfileMenuAuth() {
  if (elements.profileAdminLink && elements.profileLogoutBtn) {
    if (isLoggedIn) {
      elements.profileAdminLink.style.display = 'none';
      elements.profileLogoutBtn.style.display = 'block';

      // Atualizar informações do perfil se disponíveis
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
          const profileName = document.querySelector('.profile-name');
          const profileRole = document.querySelector('.profile-role');

          if (profileName) profileName.textContent = userData.name;
          if (profileRole) profileRole.textContent = 'Administrador';
        }
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
      }
    } else {
      elements.profileAdminLink.style.display = 'block';
      elements.profileLogoutBtn.style.display = 'none';

      // Resetar informações do perfil
      const profileName = document.querySelector('.profile-name');
      const profileRole = document.querySelector('.profile-role');

      if (profileName) profileName.textContent = 'Usuário';
      if (profileRole) profileRole.textContent = 'Visitante';
    }
  }
}

function showSection(sectionId) {
  document.querySelectorAll('main > section').forEach((section) => {
    section.classList.remove('active-section');
    section.classList.add('hidden-section');
  });
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden-section');
    targetSection.classList.add('active-section');

    // Animar a entrada da seção
    targetSection.style.opacity = '0';
    targetSection.style.transform = 'translateY(10px)';

    setTimeout(() => {
      targetSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      targetSection.style.opacity = '1';
      targetSection.style.transform = 'translateY(0)';
    }, 50);

    // Resetar a transição após a animação
    setTimeout(() => {
      targetSection.style.transition = '';
    }, 350);
  }

  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }
}

async function loadTournaments() {
  try {
    const tournaments = await api.getTournaments();
    console.log('Valor de tournaments após api.getTournaments():', tournaments);
    console.log('Valor de tournaments.tournaments:', tournaments.tournaments);
    state.setTournamentsList(tournaments.tournaments);
    console.log(
      'Após state.setTournamentsList. Chamando addTournamentSelector...'
    );
    addTournamentSelector();
    console.log('Após addTournamentSelector.');
  } catch (error) {
    console.error('Erro ao carregar lista de torneios:', error);
    ui.showMessage('Erro ao carregar lista de torneios.', 'error');
    state.setTournamentsList([]);
  }
}

function addTournamentSelector() {
  if (!elements.tournamentSelectorContainer) {
    console.error('Container for tournament selector not found.');
    return;
  }
  elements.tournamentSelectorContainer.innerHTML = '';

  // Criar o wrapper do seletor com estilo moderno
  const selectorWrapper = document.createElement('div');
  selectorWrapper.className = 'select-wrapper';

  // Criar o label
  const label = document.createElement('label');
  label.setAttribute('for', 'tournament-select');
  label.textContent = 'Torneio Atual:';
  label.className = 'select-label';

  // Criar o select com estilo moderno
  const select = document.createElement('select');
  select.id = 'tournament-select';
  select.className = 'form-select';
  select.setAttribute('aria-label', 'Selecione um torneio');

  const tournaments = state.getTournamentsList();

  if (tournaments.length > 0) {
    tournaments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB - dateA;
    });

    tournaments.forEach((tournament) => {
      const option = document.createElement('option');
      option.value = tournament.id;
      let displayDateStr = 'Data Indisponível';
      if (tournament.date) {
        try {
          const dateObj = new Date(tournament.date);
          if (!isNaN(dateObj.getTime())) {
            displayDateStr = dateObj.toLocaleDateString('pt-BR');
          }
        } catch {
          // Ignorado intencionalmente: data inválida
        }
      }
      option.textContent = `${tournament.name || 'Torneio Sem Nome'} (${displayDateStr})`;
      select.appendChild(option);
    });

    const urlTournamentId = new URLSearchParams(window.location.search).get(
      'tournament'
    );
    let initialTournamentId = '';
    if (urlTournamentId && tournaments.some((t) => t.id === urlTournamentId)) {
      initialTournamentId = urlTournamentId;
    } else if (tournaments.length > 0) {
      initialTournamentId = tournaments[0].id;
    }

    if (initialTournamentId) {
      select.value = initialTournamentId;
      state.setCurrentTournamentId(initialTournamentId);
    } else {
      state.setCurrentTournamentId(null);
    }
  } else {
    select.innerHTML =
      '<option value="">Nenhum torneio disponível no momento. Aguarde ou entre em contato com o organizador.</option>';
    select.disabled = true;
    state.setCurrentTournamentId(null);
  }

  select.addEventListener('change', async function () {
    // Mostrar indicador de carregamento
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'spinner-with-text';
    loadingIndicator.innerHTML = `
      <div class="spinner spinner-sm spinner-primary"></div>
      <span class="spinner-text">Carregando torneio...</span>
    `;
    elements.tournamentSelectorContainer.appendChild(loadingIndicator);

    // Desabilitar o select durante o carregamento
    select.disabled = true;

    const newTournamentId = this.value;
    state.setCurrentTournamentId(newTournamentId);

    const url = new URL(window.location.href);
    url.searchParams.set('tournament', newTournamentId);
    window.history.pushState({}, '', url);

    try {
      await loadTournamentData();

      showSection('bracket-section');
      if (elements.btnBracket) ui.setActiveNavItem(elements.btnBracket);

      // Mostrar mensagem de sucesso
      ui.showMessage(`Torneio carregado com sucesso!`, 'success');
    } catch (error) {
      ui.showMessage(`Erro ao carregar o torneio: ${error.message}`, 'error');
    } finally {
      // Remover indicador de carregamento e reabilitar o select
      elements.tournamentSelectorContainer.removeChild(loadingIndicator);
      select.disabled = false;
    }
  });

  // Montar a estrutura do seletor
  selectorWrapper.appendChild(label);
  selectorWrapper.appendChild(select);

  // Adicionar ícone de seta para o select
  const selectIcon = document.createElement('div');
  selectIcon.className = 'select-icon';
  selectIcon.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M7,10L12,15L17,10H7Z"></path>
    </svg>
  `;
  selectorWrapper.appendChild(selectIcon);

  elements.tournamentSelectorContainer.appendChild(selectorWrapper);
}

async function loadTournamentData() {
  const currentId = state.getCurrentTournamentId();
  if (!currentId) {
    bracketRenderer.renderBracket();
    scoreHandler.loadScoresHistory();
    return;
  }

  try {
    const fetchedState = await api.getTournamentState(currentId);
    state.setTournamentState(fetchedState);
    bracketRenderer.renderBracket();
  } catch (error) {
    ui.showMessage(
      'Não foi possível carregar o estado do torneio.',
      'error',
      error.message
    );
    state.setTournamentState({});
    bracketRenderer.renderBracket();
  }

  if (elements.scoresSection?.classList.contains('active-section')) {
    await scoreHandler.loadScoresHistory();
  }
  if (elements.addScoreSection?.classList.contains('active-section')) {
    await scoreHandler.loadPlayerSelectOptions();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  ui.initializeSidebar();
  ui.initializeProfileMenu(
    'profile-btn-index',
    'profile-menu-index',
    'profile-menu-logout-btn'
  );

  // Inicializa o gerenciador de temas
  themeManager.initialSetup();

  checkAuthenticationStatus();

  await loadTournaments();

  console.log('Após loadTournaments. Chamando addTournamentSelector...');
  addTournamentSelector();
  console.log('Após addTournamentSelector.');

  await loadTournamentData();

  scoreHandler.initializeScoreSection();
  statsHandler.initStatsHandler();

  elements.indexLogoutBtn?.addEventListener('click', () => {
    import('./auth.js')
      .then((auth) => {
        auth.handleLogout(() => {
          checkAuthenticationStatus();
          ui.showMessage('Logout realizado.', 'info');
        });
      })
      .catch((_error) => {
        console.error('Erro ao importar módulo de autenticação.');
        localStorage.removeItem('adminToken');
        checkAuthenticationStatus();
        ui.showMessage('Logout realizado.', 'info');
      });
  });

  elements.btnHome?.addEventListener('click', function () {
    showSection('home-section');
    ui.setActiveNavItem(this);
  });

  elements.btnBracket?.addEventListener('click', function () {
    showSection('bracket-section');
    ui.setActiveNavItem(this);
  });
  elements.btnScores?.addEventListener('click', async function () {
    showSection('scores-section');
    await scoreHandler.loadScoresHistory();
    ui.setActiveNavItem(this);
  });
  elements.btnAddScore?.addEventListener('click', async function () {
    if (!isLoggedIn) {
      ui.showMessage('Você precisa estar logado como administrador.', 'error');
      return;
    }
    if (!state.getCurrentTournamentId()) {
      ui.showMessage('Selecione um torneio primeiro.', 'error');
      return;
    }
    showSection('add-score-section');
    await scoreHandler.loadPlayerSelectOptions();
    ui.setActiveNavItem(this);
  });

  elements.btnStats?.addEventListener('click', async function () {
    if (!state.getCurrentTournamentId()) {
      ui.showMessage('Selecione um torneio primeiro.', 'error');
      return;
    }
    showSection('stats-section');
    await statsHandler.loadTournamentStats(state.getCurrentTournamentId());
    ui.setActiveNavItem(this);
  });

  showSection('home-section');
  if (elements.btnHome) ui.setActiveNavItem(elements.btnHome);

  setupTabOrder();
  setupKeyboardNavigation();

  initImageUtils();

  window.addEventListener('load', () => {
    setTimeout(auditImagesAccessibility, 500);
  });

  document.addEventListener('sectionChanged', () => {
    const event = new CustomEvent('a11y-section-changed');
    document.dispatchEvent(event);
  });

  // Sidebar responsiva moderna
  const sidebar = document.querySelector('.sidebar');
  const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
  const sidebarCloseBtn = document.getElementById('toggle-sidebar-btn');

  if (sidebar && mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      document.body.classList.add('sidebar-open');
    });

    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      });
    }

    // Fecha ao clicar fora do sidebar
    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== mobileToggleBtn
      ) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }
    });

    // Fecha ao pressionar Esc
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'Escape' &&
        sidebar.classList.contains('open')
      ) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }
    });
  }

  // Inicializar dropdowns
  document.querySelectorAll('.dropdown-toggle').forEach(dropdownToggle => {
    dropdownToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = this.closest('.dropdown');
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');

      // Fechar outros dropdowns
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.classList.remove('show');
          menu.closest('.dropdown').querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
        }
      });

      // Alternar o dropdown atual
      dropdownMenu.classList.toggle('show');
      this.setAttribute('aria-expanded', dropdownMenu.classList.contains('show') ? 'true' : 'false');
    });
  });

  // Fechar dropdowns ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        menu.closest('.dropdown').querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
      });
    }
  });
});
