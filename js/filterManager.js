export class FilterManager {
  constructor(options) {
    this.options = {
      containerId: 'filters-container',
      toggleId: 'filters-toggle',
      bodyId: 'filters-body',
      activeFiltersId: 'active-filters',
      resetBtnId: 'btn-filter-reset',
      applyBtnId: 'btn-filter-apply',
      onFilterApply: null,
      filterControls: {},
      ...options,
    };

    this.filterValues = {};
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    this.setupToggle();
    this.setupButtons();
    this.setupFilterControls();

    this.initialized = true;
  }

  setupToggle() {
    const toggle = document.getElementById(this.options.toggleId);
    const body = document.getElementById(this.options.bodyId);

    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute('aria-expanded', !isExpanded);
      toggle.classList.toggle('collapsed', isExpanded);

      if (isExpanded) {
        body.classList.remove('expanded');
      } else {
        body.classList.add('expanded');
      }
    });
  }

  setupButtons() {
    const resetBtn = document.getElementById(this.options.resetBtnId);
    const applyBtn = document.getElementById(this.options.applyBtnId);

    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetFilters();
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyFilters();
      });
    }
  }

  setupFilterControls() {
    for (const id of Object.keys(this.options.filterControls)) {
      const element = document.getElementById(id);
      if (!element) continue;

      element.addEventListener('change', () => {
        this.updateFilterValue(id, element.value);
      });
    }
  }

  updateFilterValue(id, value) {
    if (value === null || value === undefined || value === '') {
      delete this.filterValues[id];
    } else {
      this.filterValues[id] = value;
    }
  }

  applyFilters() {
    this.updateActiveFiltersDisplay();

    if (typeof this.options.onFilterApply === 'function') {
      this.options.onFilterApply(this.filterValues);
    }
  }

  resetFilters() {
    this.filterValues = {};

    for (const id of Object.keys(this.options.filterControls)) {
      const element = document.getElementById(id);
      if (!element) continue;

      if (element.tagName === 'INPUT') {
        element.value = '';
      } else if (element.tagName === 'SELECT') {
        element.selectedIndex = 0;
      }
    }

    this.updateActiveFiltersDisplay();

    if (typeof this.options.onFilterApply === 'function') {
      this.options.onFilterApply({});
    }
  }

  updateActiveFiltersDisplay() {
    const activeFiltersElement = document.getElementById(
      this.options.activeFiltersId
    );
    if (!activeFiltersElement) return;

    activeFiltersElement.innerHTML = '';

    const activeFilters = Object.entries(this.filterValues).filter(
      ([_id, value]) => value !== null && value !== undefined && value !== ''
    );

    if (activeFilters.length === 0) {
      return;
    }

    activeFilters.forEach(([id, value]) => {
      const config = this.options.filterControls[id];
      if (!config) return;

      let displayValue = value;

      const element = document.getElementById(id);
      if (element?.tagName === 'SELECT') {
        const option = Array.from(element.options).find(
          (opt) => opt.value === value
        );
        if (option) {
          displayValue = option.textContent;
        }
      }

      const badge = document.createElement('div');
      badge.className = 'filter-badge';
      badge.innerHTML = `
        <span class="filter-badge-label">${config.label}: ${displayValue}</span>
        <button class="filter-badge-remove" data-filter-id="${id}" aria-label="Remover filtro ${config.label}">×</button>
      `;

      const removeButton = badge.querySelector('.filter-badge-remove');
      removeButton.addEventListener('click', () => {
        this.removeFilter(id);
      });

      activeFiltersElement.appendChild(badge);
    });
  }

  removeFilter(id) {
    const element = document.getElementById(id);
    if (element) {
      if (element.tagName === 'INPUT') {
        element.value = '';
      } else if (element.tagName === 'SELECT') {
        element.selectedIndex = 0;
      }
    }

    delete this.filterValues[id];
    this.applyFilters();
  }

  populatePlayerOptions(players, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const defaultOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(defaultOption);

    players.forEach((player) => {
      const option = document.createElement('option');
      option.value = player.id;
      option.textContent = player.name;
      select.appendChild(option);
    });
  }

  filterData(data, filterMap) {
    if (Object.keys(this.filterValues).length === 0) {
      return data;
    }

    return data.filter((item) => {
      for (const [filterId, value] of Object.entries(this.filterValues)) {
        if (!value || value === '') continue;

        const mapInfo = filterMap[filterId];
        if (!mapInfo) continue;

        if (typeof mapInfo === 'string') {
          if (item[mapInfo] !== value) {
            return false;
          }
        } else if (typeof mapInfo === 'function') {
          if (!mapInfo(item, value)) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

export function createScoresFilterManager(onFilterApply) {
  return new FilterManager({
    containerId: 'scores-filters',
    toggleId: 'scores-filters-toggle',
    bodyId: 'scores-filters-body',
    activeFiltersId: 'active-filters',
    resetBtnId: 'btn-filter-reset',
    applyBtnId: 'btn-filter-apply',
    onFilterApply,
    filterControls: {
      'filter-player': { label: 'Jogador' },
      'filter-round': { label: 'Rodada' },
      'filter-winner': { label: 'Resultado' },
      'filter-date': { label: 'Data após' },
    },
  });
}

export default {
  FilterManager,
  createScoresFilterManager,
};
