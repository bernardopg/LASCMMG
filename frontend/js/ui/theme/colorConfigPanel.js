import { dynamicColorSystem } from './dynamicColorSystem.js';

export function createColorPanel() {
  if (document.getElementById('dynamic-color-panel')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '🎨';
  toggleBtn.title = 'Configurações de Cores';
  toggleBtn.id = 'toggle-color-panel-btn'; // Adiciona um ID para estilização via CSS
  toggleBtn.classList.add('color-panel-toggle-btn'); // Adiciona uma classe para estilização via CSS

  const panel = document.createElement('div');
  panel.id = 'dynamic-color-panel';
  panel.classList.add('color-config-panel'); // Adiciona uma classe para estilização via CSS

  const title = document.createElement('h3');
  title.textContent = 'Personalização de Cores';
  title.classList.add('panel-title'); // Adiciona uma classe para estilização via CSS
  panel.appendChild(title);

  addControlsToPanels(panel);

  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  toggleBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== toggleBtn) {
      panel.style.display = 'none';
    }
  });
}

function addControlsToPanels(panel) {
  addSelectControl(
    panel,
    'Nível de Contraste:',
    'contrastLevel',
    {
      normal: 'Normal',
      high: 'Alto',
      'very-high': 'Muito Alto',
    },
    dynamicColorSystem.userPreferences.contrastLevel
  );

  addSelectControl(
    panel,
    'Intensidade de Cores:',
    'colorIntensity',
    {
      low: 'Suave',
      medium: 'Média',
      high: 'Vibrante',
    },
    dynamicColorSystem.userPreferences.colorIntensity
  );

  addColorPicker(
    panel,
    'Cor de Preferência:',
    'preferredHue',
    dynamicColorSystem.userPreferences.preferredHue
  );

  addToggleControl(
    panel,
    'Reduzir Movimento:',
    'reduceMotion',
    dynamicColorSystem.userPreferences.reduceMotion
  );

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Restaurar Padrões';
  resetBtn.className = 'btn btn-secondary reset-button'; // Adiciona classe para estilização

  resetBtn.addEventListener('click', () => {
    dynamicColorSystem.userPreferences = {
      contrastLevel: 'normal',
      colorIntensity: 'medium',
      preferredHue: null,
      reduceMotion: false,
    };

    dynamicColorSystem.saveUserPreferences();
    dynamicColorSystem.updateColorsByTimeOfDay();

    // Atualiza os controles do painel para refletir os padrões restaurados
    updatePanelControls(panel);
  });

  panel.appendChild(resetBtn);
}

function updatePanelControls(panel) {
  panel.querySelectorAll('[data-preference]').forEach((el) => {
    const prefKey = el.dataset.preference;
    const currentValue = dynamicColorSystem.userPreferences[prefKey];

    if (el.type === 'checkbox') {
      el.checked = currentValue;
    } else if (el.type === 'color') {
      el.value = currentValue
        ? dynamicColorSystem.hslToHex(currentValue, 80, 50)
        : '#0d6efd';
      const useDefaultCheck = panel.querySelector('#use-default-color');
      if (useDefaultCheck) {
        useDefaultCheck.checked = !currentValue;
      }
    } else {
      el.value = currentValue;
    }
  });
}

function addSelectControl(panel, label, prefKey, options, currentValue) {
  const container = document.createElement('div');
  container.classList.add('control-group'); // Adiciona classe para estilização

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  container.appendChild(labelEl);

  const select = document.createElement('select');
  select.dataset.preference = prefKey;
  select.classList.add('control-input'); // Adiciona classe para estilização

  for (const [value, text] of Object.entries(options)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    if (value === currentValue) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    dynamicColorSystem.setUserPreference(prefKey, select.value);
  });

  container.appendChild(select);
  panel.appendChild(container);
}

function addColorPicker(panel, label, prefKey, currentValue) {
  const container = document.createElement('div');
  container.classList.add('control-group'); // Adiciona classe para estilização

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  container.appendChild(labelEl);

  const row = document.createElement('div');
  row.classList.add('color-picker-row'); // Adiciona classe para estilização

  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = currentValue
    ? dynamicColorSystem.hslToHex(currentValue, 80, 50)
    : '#0d6efd';
  colorPicker.dataset.preference = prefKey;
  colorPicker.classList.add('control-input'); // Adiciona classe para estilização

  const useDefaultCheck = document.createElement('input');
  useDefaultCheck.type = 'checkbox';
  useDefaultCheck.id = 'use-default-color';
  useDefaultCheck.checked = !currentValue;

  const useDefaultLabel = document.createElement('label');
  useDefaultLabel.htmlFor = 'use-default-color';
  useDefaultLabel.textContent = 'Usar padrão do sistema';

  colorPicker.addEventListener('input', () => {
    const hexValue = colorPicker.value;
    const hsl = dynamicColorSystem.hexToHsl(hexValue);

    if (useDefaultCheck.checked) {
      useDefaultCheck.checked = false;
    }
    dynamicColorSystem.setUserPreference(prefKey, hsl[0]);
  });

  useDefaultCheck.addEventListener('change', () => {
    if (useDefaultCheck.checked) {
      dynamicColorSystem.setUserPreference(prefKey, null);
      colorPicker.value = '#0d6efd'; // Reset color picker visual
    } else {
      const hexValue = colorPicker.value;
      const hsl = dynamicColorSystem.hexToHsl(hexValue);
      dynamicColorSystem.setUserPreference(prefKey, hsl[0]);
    }
  });

  row.appendChild(colorPicker);
  row.appendChild(useDefaultCheck);
  row.appendChild(useDefaultLabel);
  container.appendChild(row);
  panel.appendChild(container);
}

function addToggleControl(panel, label, prefKey, currentValue) {
  const container = document.createElement('div');
  container.classList.add('control-group', 'toggle-control'); // Adiciona classes para estilização

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  container.appendChild(labelEl);

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = currentValue;
  toggle.dataset.preference = prefKey;
  toggle.classList.add('control-input'); // Adiciona classe para estilização

  toggle.addEventListener('change', () => {
    dynamicColorSystem.setUserPreference(prefKey, toggle.checked);
  });

  container.appendChild(toggle);
  panel.appendChild(container);
}
