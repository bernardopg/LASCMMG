import { setActiveNavItem, showMessage } from '../ui/utils/uiUtils.js';
import { getCurrentTournamentId } from '../state/state.js';

const sectionElements = {
  dashboard: document.getElementById('section-dashboard'),
  torneios: document.getElementById('section-torneios'),
  placar: document.getElementById('section-placar'),
  jogadores: document.getElementById('section-jogadores'),
  torneio: document.getElementById('section-torneio'),
  lixeira: document.getElementById('section-lixeira'),
  agendamento: document.getElementById('section-agendamento'),
  'security-overview': document.getElementById('section-security-overview'),
  honeypots: document.getElementById('section-honeypots'),
  'threat-analytics': document.getElementById('section-threat-analytics'),
  'blocked-ips': document.getElementById('section-blocked-ips'),
};

const menuItems = {
  dashboard: document.getElementById('menu-dashboard'),
  tournaments: document.getElementById('menu-tournaments'),
  agendamento: document.getElementById('menu-agendamento'),
  scores: document.getElementById('menu-scores'),
  players: document.getElementById('menu-players'),
  lixeira: document.getElementById('menu-lixeira'),
  'security-overview': document.getElementById('menu-security-overview'),
  honeypots: document.getElementById('menu-honeypots'),
  'threat-analytics': document.getElementById('menu-threat-analytics'),
  'blocked-ips': document.getElementById('menu-blocked-ips'),
};

let sectionLoadCallbacks = {};

export async function showSection(sectionName) {
  if (!sectionElements[sectionName]) {
    console.error(
      `Section element not found for: ${sectionName}. Defaulting to 'torneios'.`
    );
    showMessage(
      `Erro: Elemento da seção "${sectionName}" não encontrado. Voltando para 'torneios'.`,
      'error'
    );
    sectionName = 'torneios';
  }

  const requiresTournament = ['placar', 'jogadores', 'torneio', 'agendamento'];
  if (requiresTournament.includes(sectionName) && !getCurrentTournamentId()) {
    showMessage('Selecione um torneio primeiro.', 'warning');
    if (sectionName !== 'torneios') {
      await showSection('torneios');
    }
    return;
  }

  Object.values(sectionElements).forEach((el) => {
    if (el) {
      el.classList.add('hidden-content');
      el.classList.remove('active-content');
    }
  });

  const targetSectionElement = sectionElements[sectionName];
  if (targetSectionElement) {
    targetSectionElement.classList.remove('hidden-content');
    targetSectionElement.classList.add('active-content');
  } else {
    console.error(`Target section element is null for: ${sectionName}`);
  }

  let targetMenuItem;
  if (menuItems[sectionName]) {
    targetMenuItem = menuItems[sectionName];
  } else {
    switch (sectionName) {
      case 'torneios':
      case 'torneio':
        targetMenuItem = menuItems.tournaments || menuItems.dashboard;
        break;
      case 'placar':
        targetMenuItem = menuItems.scores;
        break;
      case 'jogadores':
        targetMenuItem = menuItems.players;
        break;
      case 'lixeira':
        targetMenuItem = menuItems.lixeira;
        break;
      case 'agendamento':
        targetMenuItem = menuItems.agendamento;
        break;
      case 'security-overview':
        targetMenuItem = menuItems['security-overview'];
        break;
      case 'honeypots':
        targetMenuItem = menuItems['honeypots'];
        break;
      case 'threat-analytics':
        targetMenuItem = menuItems['threat-analytics'];
        break;
      case 'blocked-ips':
        targetMenuItem = menuItems['blocked-ips'];
        break;
      default:
        targetMenuItem = menuItems.dashboard || menuItems['security-overview'];
    }
  }

  if (targetMenuItem) {
    setActiveNavItem(targetMenuItem);
  } else {
    const firstAvailableMenuItem = Object.values(menuItems).find(
      (item) => item !== null
    );
    if (firstAvailableMenuItem) {
      setActiveNavItem(firstAvailableMenuItem);
    }
  }

  const callback = sectionLoadCallbacks[sectionName];
  if (typeof callback === 'function') {
    try {
      await callback();
    } catch (error) {
      console.error(`Error loading data for section ${sectionName}:`, error);
      showMessage(`Erro ao carregar dados da seção ${sectionName}.`, 'error');
    }
  }

  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.remove('mobile-open');
  }
}

export function initializeNavigation(callbacks = {}) {
  sectionLoadCallbacks = callbacks;

  for (const sectionKey in menuItems) {
    if (menuItems[sectionKey]) {
      let targetSectionName = sectionKey;
      if (sectionKey === 'tournaments') targetSectionName = 'torneios';
      if (sectionKey === 'scores') targetSectionName = 'placar';
      if (sectionKey === 'players') targetSectionName = 'jogadores';

      menuItems[sectionKey].addEventListener('click', () =>
        showSection(targetSectionName)
      );
    }
  }
}
