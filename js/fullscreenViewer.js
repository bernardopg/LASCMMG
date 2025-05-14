(function () {
  'use strict';

  let bracketContainer = null;
  let fullscreenBtn = null;
  let isFullscreenActive = false;
  let originalParent = null;
  let fullscreenOverlay = null;

  function initialize(bracketSelector = '.bracket-container') {
    bracketContainer = document.querySelector(bracketSelector);

    if (!bracketContainer) {
      console.warn(
        'Contêiner de chaveamento não encontrado. Seletor usado:',
        bracketSelector
      );
      return;
    }

    createFullscreenButton();

    document.addEventListener('keydown', handleKeyPress);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  }

  function createFullscreenButton() {
    if (document.querySelector('.fullscreen-toggle')) {
      return;
    }

    fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'fullscreen-toggle';
    fullscreenBtn.title = 'Alternar tela cheia';
    fullscreenBtn.setAttribute(
      'aria-label',
      'Alternar visualização em tela cheia'
    );

    if (document.querySelector('link[href*="font-awesome"]')) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-expand';
      fullscreenBtn.appendChild(icon);
    } else {
      fullscreenBtn.textContent = '⛶';
    }

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'fullscreen-button-container';
    bracketContainer.parentNode.insertBefore(btnContainer, bracketContainer);

    addButtonStyles();
  }

  function addButtonStyles() {
    if (document.getElementById('fullscreen-viewer-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'fullscreen-viewer-styles';
    style.textContent = `
      .fullscreen-button-container {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10px;
      }

      .fullscreen-toggle {
        background-color: var(--primary-color, #4b8fff);
        color: white;
        border: none;
        border-radius: 4px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .fullscreen-toggle:hover {
        background-color: var(--primary-hover, #2e70df);
        transform: scale(1.05);
      }

      .fullscreen-toggle:active {
        transform: scale(0.95);
      }

      .fullscreen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color, white);
        z-index: 9999;
        overflow: auto;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .fullscreen-bracket-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
      }

      .fullscreen-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
      }

      .fullscreen-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }

      .fullscreen-close {
        background-color: var(--error-color, #e55c5c);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: bold;
      }

      .fullscreen-close:hover {
        filter: brightness(1.1);
      }

      .fullscreen-overlay .bracket {
        transform-origin: center center;
        transition: transform 0.3s;
      }

      .zoom-controls {
        display: flex;
        position: fixed;
        bottom: 20px;
        right: 20px;
        gap: 10px;
        z-index: 10000;
      }

      .zoom-controls button {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        border: none;
        background-color: var(--primary-color, #4b8fff);
        color: white;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .zoom-controls button:hover {
        background-color: var(--primary-hover, #2e70df);
      }
    `;

    document.head.appendChild(style);
  }

  function toggleFullscreen() {
    if (isFullscreenActive) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  function enterFullscreen() {
    originalParent = bracketContainer.parentNode;

    fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.className = 'fullscreen-overlay';

    const controls = document.createElement('div');
    controls.className = 'fullscreen-controls';

    const title = document.createElement('h2');
    title.className = 'fullscreen-title';
    const tournamentTitle =
      document.querySelector('.tournament-title, h1')?.textContent ||
      'Visualização do Chaveamento';
    title.textContent = tournamentTitle;
    controls.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fullscreen-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i> Fechar Tela Cheia';
    closeBtn.addEventListener('click', exitFullscreen);
    controls.appendChild(closeBtn);

    fullscreenOverlay.appendChild(controls);

    const bracketWrapper = document.createElement('div');
    bracketWrapper.className = 'fullscreen-bracket-container';
    fullscreenOverlay.appendChild(bracketWrapper);

    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
    zoomInBtn.setAttribute('aria-label', 'Aumentar zoom');
    zoomInBtn.addEventListener('click', () => adjustZoom(0.1));

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
    zoomOutBtn.setAttribute('aria-label', 'Diminuir zoom');
    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));

    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomOutBtn);
    fullscreenOverlay.appendChild(zoomControls);

    document.body.appendChild(fullscreenOverlay);

    bracketWrapper.appendChild(bracketContainer);

    isFullscreenActive = true;
    updateButtonIcon();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }

    document.dispatchEvent(
      new CustomEvent('bracket-fullscreen', { detail: { isFullscreen: true } })
    );
  }

  function exitFullscreen() {
    if (!isFullscreenActive || !fullscreenOverlay) {
      return;
    }

    if (originalParent) {
      originalParent.appendChild(bracketContainer);
    }

    fullscreenOverlay.remove();
    fullscreenOverlay = null;

    bracketContainer.style.transform = '';

    isFullscreenActive = false;
    updateButtonIcon();

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    document.dispatchEvent(
      new CustomEvent('bracket-fullscreen', { detail: { isFullscreen: false } })
    );
  }

  function handleKeyPress(event) {
    if (event.key === 'Escape' && isFullscreenActive) {
      exitFullscreen();
    }
  }

  function handleFullscreenChange() {
    if (
      isFullscreenActive &&
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      exitFullscreen();
    }
  }

  function updateButtonIcon() {
    if (!fullscreenBtn) return;

    const icon = fullscreenBtn.querySelector('i');
    if (icon) {
      icon.className = isFullscreenActive ? 'fas fa-compress' : 'fas fa-expand';
    } else {
      fullscreenBtn.textContent = isFullscreenActive ? '⛶' : '⛶';
    }
  }

  function adjustZoom(factor) {
    if (!isFullscreenActive) return;

    const bracket = fullscreenOverlay.querySelector('.bracket');
    if (!bracket) return;

    const currentTransform = bracket.style.transform || '';
    const currentScale = currentTransform.match(/scale\(([^)]+)\)/);

    let scale = 1;
    if (currentScale && currentScale[1]) {
      scale = parseFloat(currentScale[1]);
    }

    scale = Math.max(0.5, Math.min(scale + factor, 2));
    bracket.style.transform = `scale(${scale})`;
  }

  window.FullscreenViewer = {
    initialize,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize();
    });
  } else {
    initialize();
  }
})();
