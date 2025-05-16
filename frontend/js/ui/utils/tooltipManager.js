(function () {
  'use strict';

  const TOOLTIP_CONFIG = {
    selector: '[data-tooltip]',

    showDelay: 400,

    hideDelay: 200,

    offset: 10,

    className: 'tooltip',

    arrowClass: 'tooltip-arrow',

    positions: ['top', 'bottom', 'right', 'left'],

    followCursor: false,

    allowHTML: false,

    style: `
      .tooltip {
        position: absolute;
        background-color: var(--bg-color-tertiary, #333);
        color: var(--text-color, #fff);
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 0.9rem;
        max-width: 250px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
      }

      .tooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: inherit;
        transform: rotate(45deg);
      }

      .tooltip[data-position='top'] .tooltip-arrow {
        bottom: -4px;
        left: 50%;
        margin-left: -4px;
      }

      .tooltip[data-position='bottom'] .tooltip-arrow {
        top: -4px;
        left: 50%;
        margin-left: -4px;
      }

      .tooltip[data-position='left'] .tooltip-arrow {
        right: -4px;
        top: 50%;
        margin-top: -4px;
      }

      .tooltip[data-position='right'] .tooltip-arrow {
        left: -4px;
        top: 50%;
        margin-top: -4px;
      }

      .tooltip.visible {
        opacity: 1;
        visibility: visible;
      }

      .tooltip-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: var(--text-color-muted, #888);
        color: var(--bg-color, #fff);
        font-size: 12px;
        margin-left: 5px;
        cursor: help;
      }
    `,
  };

  let activeTooltip = null;
  let showTimeout = null;
  let hideTimeout = null;
  let styleAdded = false;

  function initialize(options = {}) {
    const config = Object.assign({}, TOOLTIP_CONFIG, options);

    addTooltipStyles(config.style);

    setupTooltips(config);

    observeDOMChanges(config);

    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('keydown', handleKeydown);
  }

  function addTooltipStyles(styleContent) {
    if (styleAdded) return;

    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = styleContent;
    document.head.appendChild(style);

    styleAdded = true;
  }

  function setupTooltips(config) {
    const elements = document.querySelectorAll(config.selector);
    elements.forEach((element) => {
      setupTooltipEvents(element, config);
    });
  }

  function setupTooltipEvents(element, config) {
    if (element.dataset.tooltipInitialized) {
      return;
    }

    element.dataset.tooltipInitialized = 'true';

    element.addEventListener('mouseenter', () => showTooltip(element, config));
    element.addEventListener('mouseleave', () => hideTooltip(config));

    element.addEventListener('focus', () => showTooltip(element, config));
    element.addEventListener('blur', () => hideTooltip(config));

    if (config.followCursor) {
      element.addEventListener('mousemove', (e) => {
        if (activeTooltip) {
          positionTooltipAtCursor(activeTooltip, e, config);
        }
      });
    }
  }

  function showTooltip(element, config) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    if (activeTooltip) {
      hideTooltipImmediately();
    }

    const content = element.dataset.tooltip;
    if (!content) return;

    showTimeout = setTimeout(() => {
      const tooltip = document.createElement('div');
      tooltip.className = config.className;
      tooltip.setAttribute('role', 'tooltip');

      if (config.allowHTML) {
        tooltip.innerHTML = content;
      } else {
        tooltip.textContent = content;
      }

      const arrow = document.createElement('div');
      arrow.className = config.arrowClass;
      tooltip.appendChild(arrow);

      document.body.appendChild(tooltip);

      positionTooltip(tooltip, element, config);

      requestAnimationFrame(() => {
        tooltip.classList.add('visible');
      });

      activeTooltip = tooltip;
    }, config.showDelay);
  }

  function hideTooltip(config) {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    if (!activeTooltip) return;

    hideTimeout = setTimeout(() => {
      hideTooltipImmediately();
    }, config.hideDelay);
  }

  function hideTooltipImmediately() {
    if (!activeTooltip) return;

    activeTooltip.classList.remove('visible');

    setTimeout(() => {
      if (activeTooltip && activeTooltip.parentNode) {
        activeTooltip.parentNode.removeChild(activeTooltip);
      }
      activeTooltip = null;
    }, 200);
  }

  function positionTooltip(tooltip, target, config) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;
    let position = '';

    for (const pos of config.positions) {
      switch (pos) {
        case 'top':
          top = targetRect.top - tooltipRect.height - config.offset;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          if (top >= 0) {
            position = 'top';
          }
          break;

        case 'bottom':
          top = targetRect.bottom + config.offset;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          if (top + tooltipRect.height <= window.innerHeight) {
            position = 'bottom';
          }
          break;

        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - config.offset;
          if (left >= 0) {
            position = 'left';
          }
          break;

        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + config.offset;
          if (left + tooltipRect.width <= window.innerWidth) {
            position = 'right';
          }
          break;
      }

      if (position) break;
    }

    if (!position) {
      position = 'top';
      top = targetRect.top - tooltipRect.height - config.offset;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    }

    if (left < 0) left = 0;
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width;
    }

    if (top < 0) top = 0;
    if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height;
    }

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.setAttribute('data-position', position);
  }

  function positionTooltipAtCursor(tooltip, event, config) {
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = event.clientX + config.offset;
    let top = event.clientY + config.offset;

    if (left + tooltipRect.width > window.innerWidth) {
      left = event.clientX - tooltipRect.width - config.offset;
    }

    if (top + tooltipRect.height > window.innerHeight) {
      top = event.clientY - tooltipRect.height - config.offset;
    }

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
  }

  function handleScroll() {
    if (activeTooltip) {
      hideTooltipImmediately();
    }
  }

  function handleResize() {
    if (activeTooltip) {
      hideTooltipImmediately();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && activeTooltip) {
      hideTooltipImmediately();
    }
  }

  function observeDOMChanges(config) {
    if (!window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      let shouldCheckForNewTooltips = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheckForNewTooltips = true;
          break;
        }
      }

      if (shouldCheckForNewTooltips) {
        setupTooltips(config);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function addTooltipIcon(element, tooltipText, options = {}) {
    const icon = document.createElement('span');
    icon.className = 'tooltip-icon';
    icon.innerHTML = 'i';
    icon.setAttribute('aria-hidden', 'true');
    icon.dataset.tooltip = tooltipText;

    element.appendChild(icon);

    setupTooltipEvents(icon, Object.assign({}, TOOLTIP_CONFIG, options));

    return icon;
  }

  window.TooltipManager = {
    initialize,
    addTooltipIcon,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize();
    });
  } else {
    initialize();
  }
})();
