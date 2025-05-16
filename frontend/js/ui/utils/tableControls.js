(function () {
  'use strict';

  const DEFAULT_CONFIG = {
    tableSelector: '.data-table',

    pageSizeOptions: [10, 20, 50, 100],

    defaultPageSize: 20,

    storageKey: 'table_page_size_preferences',

    texts: {
      itemsPerPage: 'Itens por página:',
      showing: 'Mostrando',
      to: 'a',
      of: 'de',
      total: 'registros',
      first: 'Primeira',
      prev: 'Anterior',
      next: 'Próxima',
      last: 'Última',
      empty: 'Nenhum registro encontrado',
      search: 'Buscar...',
    },

    icons: {
      first: 'fa-angle-double-left',
      prev: 'fa-angle-left',
      next: 'fa-angle-right',
      last: 'fa-angle-double-right',
      sort: 'fa-sort',
      sortAsc: 'fa-sort-up',
      sortDesc: 'fa-sort-down',
      search: 'fa-search',
    },
  };

  let config = { ...DEFAULT_CONFIG };
  let tables = [];

  class PaginatedTable {
    constructor(tableElement, config) {
      this.tableElement = tableElement;
      this.config = config;
      this.tableId =
        tableElement.id || `table-${Math.floor(Math.random() * 100000)}`;

      if (!tableElement.id) {
        tableElement.id = this.tableId;
      }

      this.state = {
        currentPage: 1,
        pageSize: this.getPageSizeFromStorage(),
        totalItems: 0,
        totalPages: 1,
        sortColumn: null,
        sortDirection: 'asc',
        searchTerm: '',
        allRows: [],
        filteredRows: [],
        visibleRows: [],
      };

      this.initialize();
    }

    initialize() {
      this.captureTableRows();

      this.createTableWrapper();

      this.addTableControls();

      this.setupSortingEvents();

      this.updateTableView();

      this.setupPersistence();
    }

    captureTableRows() {
      const tbody = this.tableElement.querySelector('tbody');
      if (!tbody) return;

      const rows = Array.from(tbody.querySelectorAll('tr'));
      this.state.allRows = rows;
      this.state.filteredRows = [...rows];
      this.state.totalItems = rows.length;
      this.updatePaginationState();
    }

    createTableWrapper() {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive table-container';
      wrapper.dataset.tableId = this.tableId;

      this.tableElement.parentNode.insertBefore(wrapper, this.tableElement);
      wrapper.appendChild(this.tableElement);

      this.wrapperElement = wrapper;
    }

    addTableControls() {
      const topControls = document.createElement('div');
      topControls.className = 'table-top-controls';

      const pageSizeContainer = document.createElement('div');
      pageSizeContainer.className = 'page-size-selector';

      const pageSizeText = document.createElement('span');
      pageSizeText.textContent = this.config.texts.itemsPerPage;
      pageSizeContainer.appendChild(pageSizeText);

      const pageSizeSelect = document.createElement('select');
      pageSizeSelect.className = 'page-size-select';
      pageSizeSelect.setAttribute(
        'aria-label',
        'Selecionar quantidade de itens por página'
      );

      this.config.pageSizeOptions.forEach((size) => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        if (size === this.state.pageSize) {
          option.selected = true;
        }
        pageSizeSelect.appendChild(option);
      });

      pageSizeSelect.addEventListener('change', () => {
        this.changePageSize(parseInt(pageSizeSelect.value, 10));
      });

      pageSizeContainer.appendChild(pageSizeSelect);
      topControls.appendChild(pageSizeContainer);

      const searchContainer = document.createElement('div');
      searchContainer.className = 'table-search-container';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = this.config.texts.search;
      searchInput.className = 'table-search-input';
      searchInput.setAttribute('aria-label', 'Buscar na tabela');

      if (document.querySelector('link[href*="font-awesome"]')) {
        const searchIcon = document.createElement('i');
        searchIcon.className = `fas ${this.config.icons.search}`;
        searchContainer.appendChild(searchIcon);
      }

      let debounceTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.search(searchInput.value);
        }, 300);
      });

      searchContainer.appendChild(searchInput);
      topControls.appendChild(searchContainer);

      this.wrapperElement.insertBefore(topControls, this.tableElement);

      const bottomControls = document.createElement('div');
      bottomControls.className = 'table-pagination-controls';

      const paginationInfo = document.createElement('div');
      paginationInfo.className = 'pagination-info';
      bottomControls.appendChild(paginationInfo);

      const paginationButtons = document.createElement('div');
      paginationButtons.className = 'pagination-buttons';

      const firstPageBtn = document.createElement('button');
      firstPageBtn.type = 'button';
      firstPageBtn.className = 'pagination-btn first-page';
      firstPageBtn.setAttribute('aria-label', 'Primeira página');
      firstPageBtn.innerHTML = document.querySelector(
        'link[href*="font-awesome"]'
      )
        ? `<i class="fas ${this.config.icons.first}"></i>`
        : this.config.texts.first;
      firstPageBtn.addEventListener('click', () => this.goToPage(1));
      paginationButtons.appendChild(firstPageBtn);

      const prevPageBtn = document.createElement('button');
      prevPageBtn.type = 'button';
      prevPageBtn.className = 'pagination-btn prev-page';
      prevPageBtn.setAttribute('aria-label', 'Página anterior');
      prevPageBtn.innerHTML = document.querySelector(
        'link[href*="font-awesome"]'
      )
        ? `<i class="fas ${this.config.icons.prev}"></i>`
        : this.config.texts.prev;
      prevPageBtn.addEventListener('click', () => this.prevPage());
      paginationButtons.appendChild(prevPageBtn);

      const pageIndicator = document.createElement('span');
      pageIndicator.className = 'page-indicator';
      paginationButtons.appendChild(pageIndicator);

      const nextPageBtn = document.createElement('button');
      nextPageBtn.type = 'button';
      nextPageBtn.className = 'pagination-btn next-page';
      nextPageBtn.setAttribute('aria-label', 'Próxima página');
      nextPageBtn.innerHTML = document.querySelector(
        'link[href*="font-awesome"]'
      )
        ? `<i class="fas ${this.config.icons.next}"></i>`
        : this.config.texts.next;
      nextPageBtn.addEventListener('click', () => this.nextPage());
      paginationButtons.appendChild(nextPageBtn);

      const lastPageBtn = document.createElement('button');
      lastPageBtn.type = 'button';
      lastPageBtn.className = 'pagination-btn last-page';
      lastPageBtn.setAttribute('aria-label', 'Última página');
      lastPageBtn.innerHTML = document.querySelector(
        'link[href*="font-awesome"]'
      )
        ? `<i class="fas ${this.config.icons.last}"></i>`
        : this.config.texts.last;
      lastPageBtn.addEventListener('click', () =>
        this.goToPage(this.state.totalPages)
      );
      paginationButtons.appendChild(lastPageBtn);

      bottomControls.appendChild(paginationButtons);

      this.wrapperElement.appendChild(bottomControls);

      this.elements = {
        topControls,
        pageSizeSelect,
        searchInput,
        bottomControls,
        paginationInfo,
        pageIndicator,
        firstPageBtn,
        prevPageBtn,
        nextPageBtn,
        lastPageBtn,
      };

      this.addTableStyles();
    }

    setupSortingEvents() {
      const thead = this.tableElement.querySelector('thead');
      if (!thead) return;

      const headerCells = thead.querySelectorAll('th');
      headerCells.forEach((cell, index) => {
        if (cell.dataset.nosort === 'true') {
          return;
        }

        cell.style.cursor = 'pointer';
        cell.title = 'Clique para ordenar';
        cell.setAttribute('tabindex', '0');

        if (document.querySelector('link[href*="font-awesome"]')) {
          const sortIcon = document.createElement('i');
          sortIcon.className = `fas ${this.config.icons.sort} sort-icon`;
          sortIcon.setAttribute('aria-hidden', 'true');
          cell.appendChild(document.createTextNode(' '));
          cell.appendChild(sortIcon);
        }

        cell.addEventListener('click', () => this.sortByColumn(index));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.sortByColumn(index);
          }
        });
      });
    }

    addTableStyles() {
      if (document.getElementById('table-controls-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'table-controls-styles';
      style.textContent = `
        .table-container {
          margin-bottom: 1.5rem;
        }

        .table-top-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .page-size-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-size-select {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          border: 1px solid var(--border-color, #ccc);
          background-color: var(--bg-color-secondary, #f5f5f5);
          color: var(--text-color, #333);
        }

        .table-search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .table-search-container i {
          position: absolute;
          left: 0.75rem;
          color: var(--text-color-muted, #777);
        }

        .table-search-input {
          padding: 0.5rem;
          padding-left: ${document.querySelector('link[href*="font-awesome"]') ? '2rem' : '0.75rem'};
          border-radius: 4px;
          border: 1px solid var(--border-color, #ccc);
          width: 200px;
          background-color: var(--bg-color-secondary, #f5f5f5);
          color: var(--text-color, #333);
        }

        .table-pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pagination-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #ccc);
          background-color: var(--bg-color-secondary, #f5f5f5);
          color: var(--text-color, #333);
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          transition: background-color 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: var(--primary-color, #007bff);
          color: white;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-indicator {
          margin: 0 0.5rem;
          font-weight: bold;
          min-width: 3rem;
          text-align: center;
        }

        .sort-icon {
          margin-left: 0.25rem;
          font-size: 0.8em;
        }

        .pagination-info {
          font-size: 0.9rem;
          color: var(--text-color-secondary, #666);
        }

        @keyframes highlightRow {
          0% { background-color: var(--highlight-bg, rgba(0, 123, 255, 0.1)); }
          100% { background-color: transparent; }
        }

        .new-row {
          animation: highlightRow 1.5s ease-out;
        }
      `;

      document.head.appendChild(style);
    }

    getPageSizeFromStorage() {
      try {
        const preferences = JSON.parse(
          localStorage.getItem(this.config.storageKey) || '{}'
        );
        return preferences[this.tableId] || this.config.defaultPageSize;
      } catch {
        return this.config.defaultPageSize;
      }
    }

    updatePaginationState() {
      this.state.totalPages = Math.max(
        1,
        Math.ceil(this.state.filteredRows.length / this.state.pageSize)
      );

      if (this.state.currentPage > this.state.totalPages) {
        this.state.currentPage = this.state.totalPages;
      }

      const startIdx = (this.state.currentPage - 1) * this.state.pageSize;
      const endIdx = Math.min(
        startIdx + this.state.pageSize,
        this.state.filteredRows.length
      );

      this.state.visibleRows = this.state.filteredRows.slice(startIdx, endIdx);
    }

    updateTableView() {
      this.updatePaginationState();

      const tbody = this.tableElement.querySelector('tbody');
      if (!tbody) return;

      if (this.state.filteredRows.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="${this.tableElement.querySelector('thead tr').childElementCount}"
                style="text-align: center; padding: 1.5rem;">
              ${this.config.texts.empty}
            </td>
          </tr>
        `;

        this.updatePaginationControls(true);
        return;
      }

      tbody.innerHTML = '';

      this.state.visibleRows.forEach((row) => {
        tbody.appendChild(row.cloneNode(true));
      });

      const startIdx = (this.state.currentPage - 1) * this.state.pageSize + 1;
      const endIdx = Math.min(
        startIdx + this.state.pageSize - 1,
        this.state.filteredRows.length
      );

      if (this.elements.paginationInfo) {
        this.elements.paginationInfo.textContent = `${this.config.texts.showing} ${startIdx} ${this.config.texts.to} ${endIdx} ${this.config.texts.of} ${this.state.filteredRows.length} ${this.config.texts.total}`;
      }

      if (this.elements.pageIndicator) {
        this.elements.pageIndicator.textContent = `${this.state.currentPage}/${this.state.totalPages}`;
      }

      this.updatePaginationControls();
    }

    updatePaginationControls(disable = false) {
      if (!this.elements) return;

      const { firstPageBtn, prevPageBtn, nextPageBtn, lastPageBtn } =
        this.elements;

      if (disable) {
        firstPageBtn.disabled = true;
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        lastPageBtn.disabled = true;
        return;
      }

      firstPageBtn.disabled = this.state.currentPage === 1;
      prevPageBtn.disabled = this.state.currentPage === 1;
      nextPageBtn.disabled = this.state.currentPage === this.state.totalPages;
      lastPageBtn.disabled = this.state.currentPage === this.state.totalPages;
    }

    goToPage(pageNumber) {
      pageNumber = Math.max(1, Math.min(pageNumber, this.state.totalPages));

      this.state.currentPage = pageNumber;

      this.updateTableView();

      this.tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    prevPage() {
      if (this.state.currentPage > 1) {
        this.goToPage(this.state.currentPage - 1);
      }
    }

    nextPage() {
      if (this.state.currentPage < this.state.totalPages) {
        this.goToPage(this.state.currentPage + 1);
      }
    }

    changePageSize(newSize) {
      if (newSize !== this.state.pageSize) {
        this.state.pageSize = newSize;

        this.state.currentPage = 1;

        this.updateTableView();

        this.savePageSizePreference();

        this.tableElement.dispatchEvent(
          new CustomEvent('pagesizechange', {
            bubbles: true,
            detail: { pageSize: newSize, tableId: this.tableId },
          })
        );
      }
    }

    setupPersistence() {
      this.savePageSizePreference();
    }

    savePageSizePreference() {
      try {
        const preferences = JSON.parse(
          localStorage.getItem(this.config.storageKey) || '{}'
        );

        preferences[this.tableId] = this.state.pageSize;

        localStorage.setItem(
          this.config.storageKey,
          JSON.stringify(preferences)
        );
      } catch (e) {
        console.warn('Erro ao salvar preferência de tamanho de página:', e);
      }
    }

    sortByColumn(columnIndex) {
      if (this.state.sortColumn === columnIndex) {
        this.state.sortDirection =
          this.state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.state.sortColumn = columnIndex;
        this.state.sortDirection = 'asc';
      }

      this.updateSortIndicators(columnIndex);

      this.state.filteredRows.sort((rowA, rowB) => {
        const cellA = rowA.querySelectorAll('td')[columnIndex];
        const cellB = rowB.querySelectorAll('td')[columnIndex];

        if (!cellA || !cellB) return 0;

        const valueA =
          cellA.dataset.sortValue !== undefined
            ? cellA.dataset.sortValue
            : cellA.textContent.trim();
        const valueB =
          cellB.dataset.sortValue !== undefined
            ? cellB.dataset.sortValue
            : cellB.textContent.trim();

        if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
          return this.state.sortDirection === 'asc'
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
        } else if (isValidDate(valueA) && isValidDate(valueB)) {
          const dateA = new Date(valueA);
          const dateB = new Date(valueB);
          return this.state.sortDirection === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        } else {
          return this.state.sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
      });

      this.state.currentPage = 1;

      this.updateTableView();

      function isValidDate(value) {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
    }

    updateSortIndicators(columnIndex) {
      const thead = this.tableElement.querySelector('thead');
      if (!thead) return;

      const headerCells = thead.querySelectorAll('th');

      headerCells.forEach((cell) => {
        const icon = cell.querySelector('.sort-icon');
        if (icon) {
          icon.className = `fas ${this.config.icons.sort} sort-icon`;
        }

        cell.removeAttribute('aria-sort');
      });

      if (columnIndex >= 0 && columnIndex < headerCells.length) {
        const currentHeader = headerCells[columnIndex];

        currentHeader.setAttribute(
          'aria-sort',
          this.state.sortDirection === 'asc' ? 'ascending' : 'descending'
        );

        const icon = currentHeader.querySelector('.sort-icon');
        if (icon) {
          icon.className = `fas ${
            this.state.sortDirection === 'asc'
              ? this.config.icons.sortAsc
              : this.config.icons.sortDesc
          } sort-icon`;
        }
      }
    }

    search(term) {
      this.state.searchTerm = term.trim().toLowerCase();

      if (!this.state.searchTerm) {
        this.state.filteredRows = [...this.state.allRows];
      } else {
        this.state.filteredRows = this.state.allRows.filter((row) => {
          const cells = Array.from(row.querySelectorAll('td'));

          return cells.some((cell) => {
            const text = cell.textContent.toLowerCase();
            return text.includes(this.state.searchTerm);
          });
        });
      }

      this.state.currentPage = 1;

      this.updateTableView();

      this.tableElement.dispatchEvent(
        new CustomEvent('tablesearch', {
          bubbles: true,
          detail: {
            term: this.state.searchTerm,
            results: this.state.filteredRows.length,
            tableId: this.tableId,
          },
        })
      );
    }

    refresh() {
      this.captureTableRows();

      if (this.state.searchTerm) {
        this.search(this.state.searchTerm);
      }

      if (this.state.sortColumn !== null) {
        this.sortByColumn(this.state.sortColumn);
      } else {
        this.updateTableView();
      }
    }
  }

  function initialize(customConfig = {}) {
    config = Object.assign({}, DEFAULT_CONFIG, customConfig);

    tables = [];

    const tableElements = document.querySelectorAll(config.tableSelector);
    tableElements.forEach((tableElement) => {
      const table = new PaginatedTable(tableElement, config);

      tables.push(table);
    });

    return tables;
  }

  function refreshTables(tableId) {
    if (tableId) {
      const table = tables.find((t) => t.tableId === tableId);
      if (table) {
        table.refresh();
      }
    } else {
      tables.forEach((table) => table.refresh());
    }
  }

  window.TableControls = {
    initialize,
    refreshTables,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize();
    });
  } else {
    initialize();
  }
})();
