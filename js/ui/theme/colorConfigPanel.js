import { dynamicColorSystem } from './dynamicColorSystem.js';

export function createColorPanel() {
  if (document.getElementById('dynamic-color-panel')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '🎨';
  toggleBtn.title = 'Configurações de Cores';
  toggleBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--surface-color);
        border: 2px solid var(--border-color);
        font-size: 24px;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--box-shadow);
    `;

  const panel = document.createElement('div');
  panel.id = 'dynamic-color-panel';
  panel.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 300px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 15px;
        z-index: 999;
        box-shadow: var(--hover-shadow);
        display: none;
    `;

  const title = document.createElement('h3');
  title.textContent = 'Personalização de Cores';
  title.style.marginBottom = '15px';
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
  resetBtn.className = 'btn btn-secondary';
  resetBtn.style.marginTop = '15px';
  resetBtn.style.width = '100%';

  resetBtn.addEventListener('click', () => {
    dynamicColorSystem.userPreferences = {
      contrastLevel: 'normal',
      colorIntensity: 'medium',
      preferredHue: null,
      reduceMotion: false,
    };

    dynamicColorSystem.saveUserPreferences();
    dynamicColorSystem.updateColorsByTimeOfDay();

    panel.querySelectorAll('select, input').forEach((el) => {
      if (el.type === 'checkbox') {
        el.checked = false;
      } else if (el.type === 'color') {
        el.value = '#0d6efd';
      } else {
        el.value = dynamicColorSystem.userPreferences[el.dataset.preference];
      }
    });
  });

  panel.appendChild(resetBtn);
}

function addSelectControl(panel, label, prefKey, options, currentValue) {
  const container = document.createElement('div');
  container.style.marginBottom = '10px';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.display = 'block';
  labelEl.style.marginBottom = '5px';
  container.appendChild(labelEl);

  const select = document.createElement('select');
  select.style.width = '100%';
  select.style.padding = '8px';
  select.dataset.preference = prefKey;

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
  container.style.marginBottom = '10px';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.display = 'block';
  labelEl.style.marginBottom = '5px';
  container.appendChild(labelEl);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';

  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = currentValue
    ? dynamicColorSystem.hslToHex(currentValue, 80, 50)
    : '#0d6efd';
  colorPicker.style.marginRight = '10px';
  colorPicker.dataset.preference = prefKey;

  const useDefaultCheck = document.createElement('input');
  useDefaultCheck.type = 'checkbox';
  useDefaultCheck.id = 'use-default-color';
  useDefaultCheck.checked = !currentValue;
  useDefaultCheck.style.marginRight = '5px';

  const useDefaultLabel = document.createElement('label');
  useDefaultLabel.htmlFor = 'use-default-color';
  useDefaultLabel.textContent = 'Usar padrão do sistema';

  colorPicker.addEventListener('input', () => {
    const hexValue = colorPicker.value;
    const hsl = dynamicColorSystem.hexToHsl(hexValue);

    if (useDefaultCheck.checked) {
      useDefaultCheck.checked = false;
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
  container.style.marginBottom = '10px';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'space-between';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.marginRight = '10px';
  container.appendChild(labelEl);

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = currentValue;
  toggle.dataset.preference = prefKey;
  toggle.style.cursor = 'pointer';

  toggle.addEventListener('change', () => {
    dynamicColorSystem.setUserPreference(prefKey, toggle.checked);
  });

  container.appendChild(toggle);
  panel.appendChild(container);
}

document.addEventListener('DOMContentLoaded', createColorPanel);
