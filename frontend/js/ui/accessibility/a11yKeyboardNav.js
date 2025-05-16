document.addEventListener('DOMContentLoaded', () => {
  setupTabOrder();
  setupKeyboardNavigation();
});

/**
 * Configura a ordem de tabulação correta para os elementos interativos
 */
function setupTabOrder() {
  const elementsInOrder = [
    ...document.querySelectorAll('.sidebar .nav-item'),
    document.querySelector('#mobile-sidebar-toggle'),
    document.querySelector('.profile-btn'),
    document.querySelector('#current-tournament, #tournament-selector select'),
    ...document.querySelectorAll(
      '.active-section button, .active-section a, .active-content button, .active-content a'
    ),
    ...document.querySelectorAll(
      '.active-section input, .active-section select, .active-section textarea, .active-content input, .active-content select, .active-content textarea'
    ),
  ].filter((el) => el !== null);

  elementsInOrder.forEach((element, index) => {
    element.setAttribute('tabindex', index === 0 ? '0' : '0');
  });
}

/**
 * Configura navegação aprimorada com teclado para elementos complexos
 */
function setupKeyboardNavigation() {
  document.querySelectorAll('.sidebar-nav ul').forEach((navList) => {
    navList.addEventListener('keydown', handleNavListKeypress);
  });

  document.querySelectorAll('table').forEach((table) => {
    table.addEventListener('keydown', handleTableKeypress);
  });
}

/**
 * Manipula teclas para navegação entre itens de lista
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleNavListKeypress(event) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

  const currentItem = event.target.closest('li');
  if (!currentItem) return;

  const listItems = Array.from(event.currentTarget.querySelectorAll('li'));
  const currentIndex = listItems.indexOf(currentItem);

  let targetIndex;
  if (event.key === 'ArrowDown') {
    targetIndex = (currentIndex + 1) % listItems.length;
  } else {
    targetIndex = (currentIndex - 1 + listItems.length) % listItems.length;
  }

  const targetElement = listItems[targetIndex].querySelector('button, a');
  if (targetElement) {
    event.preventDefault();
    targetElement.focus();
  }
}

/**
 * Manipula teclas para navegação entre células de tabela
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleTableKeypress(event) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
    return;

  const currentCell = event.target.closest('td, th');
  if (!currentCell) return;

  const table = event.currentTarget;
  const rows = Array.from(table.querySelectorAll('tr'));
  const currentRow = currentCell.parentElement;
  const rowIndex = rows.indexOf(currentRow);
  const cells = Array.from(currentRow.querySelectorAll('td, th'));
  const cellIndex = cells.indexOf(currentCell);

  let targetRow, targetCell;

  switch (event.key) {
    case 'ArrowUp':
      if (rowIndex > 0) {
        targetRow = rows[rowIndex - 1];
        const targetCells = targetRow.querySelectorAll('td, th');
        targetCell = targetCells[Math.min(cellIndex, targetCells.length - 1)];
      }
      break;
    case 'ArrowDown':
      if (rowIndex < rows.length - 1) {
        targetRow = rows[rowIndex + 1];
        const targetCells = targetRow.querySelectorAll('td, th');
        targetCell = targetCells[Math.min(cellIndex, targetCells.length - 1)];
      }
      break;
    case 'ArrowLeft':
      if (cellIndex > 0) {
        targetCell = cells[cellIndex - 1];
      }
      break;
    case 'ArrowRight':
      if (cellIndex < cells.length - 1) {
        targetCell = cells[cellIndex + 1];
      }
      break;
  }

  if (targetCell) {
    event.preventDefault();

    const focusableElement = targetCell.querySelector(
      'button, a, input, select, textarea'
    );
    if (focusableElement) {
      focusableElement.focus();
    } else {
      targetCell.setAttribute('tabindex', '0');
      targetCell.focus();
    }
  }
}

document.addEventListener('a11y-section-changed', setupTabOrder);

export { setupTabOrder, setupKeyboardNavigation };
