import { handleLogout as authHandleLogout } from '../../auth/auth.js';
import { sanitizeHTML, createSafeElement } from '../../utils/securityUtils.js';

export function showMessage(message, type = 'info', details = '') {
  const messageContainer = document.getElementById('message-container');
  if (!messageContainer) {
    console.warn(
      'Message container not found. Cannot display message:',
      sanitizeHTML(message)
    );
    alert(`${type.toUpperCase()}: ${sanitizeHTML(message)}`);
    return;
  }

  const validTypes = ['info', 'success', 'error', 'warning'];

  const messageElement = createSafeElement('div', {
    class: `message message-${validTypes.includes(type) ? type : 'info'}`,
    role: 'alert',
    'aria-live': 'assertive',
  });

  const mainMessageSpan = createSafeElement(
    'span',
    { class: 'message-main' },
    message
  );
  messageElement.appendChild(mainMessageSpan);

  if (details) {
    const detailsParagraph = createSafeElement(
      'p',
      { class: 'message-details' },
      details
    );
    messageElement.appendChild(detailsParagraph);
  }

  messageContainer.appendChild(messageElement);

  setTimeout(() => {
    messageElement.style.transition = 'opacity 0.3s ease-out';
    messageElement.style.opacity = '0';
    setTimeout(() => {
      if (messageContainer.contains(messageElement)) {
        messageContainer.removeChild(messageElement);
      }
    }, 300);
  }, 5000);
}

export function setButtonLoading(buttonElement, isLoading) {
  if (!buttonElement) return;

  if (isLoading) {
    buttonElement.classList.add('loading');
    buttonElement.disabled = true;
  } else {
    buttonElement.classList.remove('loading');
    buttonElement.disabled = false;
  }
}

export function createActionButton(
  text,
  action,
  id = null,
  extraClasses = [],
  onClick
) {
  const button = document.createElement('button');
  button.className = `btn btn-action btn-small ${extraClasses.join(
    ' '
  )}`.trim();
  button.dataset.action = action;
  if (id) {
    button.dataset.id = id;
  }
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

let globalSidebarCollapsed = false;

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const desktopToggleBtn = document.getElementById('toggle-sidebar-btn');
  const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
    document.body.classList.remove('sidebar-collapsed');
    if (mobileToggleBtn) {
      if (sidebar.classList.contains('mobile-open')) {
        mobileToggleBtn.innerHTML = '✕';
        mobileToggleBtn.setAttribute('aria-label', 'Fechar menu');
      } else {
        mobileToggleBtn.innerHTML = '☰';
        mobileToggleBtn.setAttribute('aria-label', 'Abrir menu');
      }
    }
    return;
  }

  const body = document.body;
  globalSidebarCollapsed = !globalSidebarCollapsed;

  if (globalSidebarCollapsed) {
    body.classList.add('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', 'true');
    if (desktopToggleBtn) {
      desktopToggleBtn.innerHTML = '☰';
      desktopToggleBtn.setAttribute('aria-label', 'Expandir menu');
    }
  } else {
    body.classList.remove('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', 'false');
    if (desktopToggleBtn) {
      desktopToggleBtn.innerHTML = '✕';
      desktopToggleBtn.setAttribute('aria-label', 'Recolher menu');
    }
  }
}

export function setActiveNavItem(element) {
  if (!element) return;
  document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
    item.classList.remove('active');
    if (item.tagName === 'BUTTON') {
      item.setAttribute('aria-pressed', 'false');
    }
  });

  element.classList.add('active');
  if (element.tagName === 'BUTTON') {
    element.setAttribute('aria-pressed', 'true');
  }
}

function applyResponsiveSettings() {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  const mobileHeader = document.querySelector('.mobile-header');
  const desktopToggleBtn = document.getElementById('toggle-sidebar-btn');
  const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');

  if (window.innerWidth <= 768) {
    body.classList.add('mobile-view');
    if (mobileHeader) mobileHeader.style.display = 'flex';
    body.classList.remove('sidebar-collapsed');
    if (sidebar && mobileToggleBtn) {
      if (sidebar.classList.contains('mobile-open')) {
        mobileToggleBtn.innerHTML = '✕';
        mobileToggleBtn.setAttribute('aria-label', 'Fechar menu');
      } else {
        mobileToggleBtn.innerHTML = '☰';
        mobileToggleBtn.setAttribute('aria-label', 'Abrir menu');
      }
    }
  } else {
    body.classList.remove('mobile-view');
    if (mobileHeader) mobileHeader.style.display = 'none';
    if (sidebar) sidebar.classList.remove('mobile-open');

    if (desktopToggleBtn) {
      if (globalSidebarCollapsed) {
        body.classList.add('sidebar-collapsed');
        desktopToggleBtn.innerHTML = '☰';
        desktopToggleBtn.setAttribute('aria-label', 'Expandir menu');
      } else {
        body.classList.remove('sidebar-collapsed');
        desktopToggleBtn.innerHTML = '✕';
        desktopToggleBtn.setAttribute('aria-label', 'Recolher menu');
      }
    }
  }
}

export function initializeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const desktopToggleBtn = document.getElementById('toggle-sidebar-btn');
  const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');

  if (!sidebar) {
    console.error('Sidebar element not found.');
    return;
  }

  try {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    globalSidebarCollapsed = savedSidebarState === 'true';
  } catch (e) {
    console.error('Error reading sidebar state from localStorage:', e);
    globalSidebarCollapsed = false;
  }

  applyResponsiveSettings();

  if (desktopToggleBtn) {
    desktopToggleBtn.addEventListener('click', toggleSidebar);
  } else {
    console.warn('Desktop sidebar toggle button not found.');
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', toggleSidebar);
  } else {
    console.warn('Mobile sidebar toggle button not found.');
  }

  document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
    if (item.tagName === 'BUTTON' && !item.id?.includes('logout')) {
      item.addEventListener('click', function () {
        if (
          window.innerWidth <= 768 &&
          sidebar.classList.contains('mobile-open')
        ) {
          sidebar.classList.remove('mobile-open');
        }
      });
    } else if (item.tagName === 'A') {
      item.addEventListener('click', function () {
        if (
          window.innerWidth <= 768 &&
          sidebar.classList.contains('mobile-open')
        ) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }
  });

  document.addEventListener('click', function (e) {
    if (
      window.innerWidth <= 768 &&
      sidebar.classList.contains('mobile-open') &&
      !sidebar.contains(e.target) &&
      e.target !== mobileToggleBtn &&
      !mobileToggleBtn?.contains(e.target)
    ) {
      sidebar.classList.remove('mobile-open');
    }
  });

  window.addEventListener('resize', applyResponsiveSettings);
}

function closeAllProfileMenus(excludeMenuId = null, clickTarget = null) {
  document.querySelectorAll('.profile-menu.show').forEach((menu) => {
    const btnId = menu.id.replace('menu', 'btn');
    const btn = document.getElementById(btnId);

    if (
      menu.id === excludeMenuId ||
      (clickTarget && btn && btn.contains(clickTarget))
    ) {
      return;
    }

    menu.classList.remove('show');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

export function initializeProfileMenu(
  profileBtnId,
  profileMenuId,
  logoutBtnId
) {
  const profileBtn = document.getElementById(profileBtnId);
  const profileMenu = document.getElementById(profileMenuId);
  const logoutBtn = logoutBtnId ? document.getElementById(logoutBtnId) : null;

  if (!profileBtn || !profileMenu) {
    return;
  }

  profileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isExpanded = profileBtn.getAttribute('aria-expanded') === 'true';
    closeAllProfileMenus(profileMenuId);
    profileMenu.classList.toggle('show');
    profileBtn.setAttribute('aria-expanded', !isExpanded);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authHandleLogout(() => {
        if (window.location.pathname.includes('admin.html')) {
          window.location.href = 'admin.html';
        } else {
          window.location.reload();
        }
      });
      closeAllProfileMenus();
    });
  }

  if (!document.body.dataset.profileMenuClickListenerAdded) {
    document.addEventListener('click', (event) => {
      closeAllProfileMenus(null, event.target);
    });
    document.body.dataset.profileMenuClickListenerAdded = 'true';

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openMenu = document.querySelector('.profile-menu.show');
        if (openMenu) {
          const correspondingBtnId = openMenu.id.replace('menu', 'btn');
          const correspondingBtn = document.getElementById(correspondingBtnId);
          openMenu.classList.remove('show');
          if (correspondingBtn) {
            correspondingBtn.setAttribute('aria-expanded', 'false');
            correspondingBtn.focus();
          }
        }
      }
    });
  }
}

export function isValidScore(score1, score2) {
  const s1 = parseInt(score1, 10);
  const s2 = parseInt(score2, 10);
  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return false;
  return (
    (s1 === 2 && (s2 === 0 || s2 === 1)) || (s2 === 2 && (s1 === 0 || s1 === 1))
  );
}

export function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  } catch (e) {
    console.error('Error parsing date string:', dateStr, e);
  }
  return new Date(0);
}

export function formatMatchDateTime(dateTime) {
  if (!dateTime) return 'TBD';
  try {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting date:', dateTime, e);
    return 'Data inválida';
  }
}

/**
 * Formata uma string de data para o formato DD/MM/YYYY.
 * @param {string} dateString A string de data a ser formatada.
 * @returns {string} A data formatada ou 'N/A' se inválida.
 */
export function formatMatchDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.error('Error formatting date string:', dateString, e);
    return 'Data inválida';
  }
}

export function createLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.setAttribute('aria-label', 'Carregando conteúdo');
  spinner.setAttribute('role', 'status');

  const srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = 'Carregando...';
  spinner.appendChild(srText);

  return spinner;
}

export function removeLoadingSpinner() {
  document.querySelectorAll('.loading-spinner').forEach((spinner) => {
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  });
}
