import { showMessage, setButtonLoading } from '../uiUtils.js';
import { fetchApi } from '../apiService.js';
import ui from '../uiUtils.js';

let securityStatsContainer;
let refreshStatsButton;
let threatStatsTableBody;
let honeypotListContainer;

export function init() {
  securityStatsContainer = document.getElementById('security-stats-container');
  if (!securityStatsContainer) return;

  refreshStatsButton = document.getElementById('refresh-security-stats');
  threatStatsTableBody = document.getElementById('threat-stats-table-body');
  honeypotListContainer = document.getElementById('honeypot-list-container');

  loadSecurityStats();

  if (refreshStatsButton) {
    refreshStatsButton.addEventListener('click', handleRefreshStats);
  }
}

async function loadSecurityStats() {
  try {
    if (securityStatsContainer) {
      securityStatsContainer.classList.add('loading');
    }

    if (refreshStatsButton) {
      setButtonLoading(refreshStatsButton, true);
    }

    const response = await fetchApi('/system/security/honeypot-stats', {
      method: 'GET',
    });

    if (response.success) {
      renderSecurityStats(response.data);
      showMessage(
        'Estatísticas de segurança atualizadas com sucesso',
        'success'
      );
    } else {
      showMessage('Erro ao carregar estatísticas de segurança', 'error');
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas de segurança:', error);
    showMessage(
      'Erro ao carregar estatísticas de segurança: ' + error.message,
      'error'
    );
  } finally {
    if (securityStatsContainer) {
      securityStatsContainer.classList.remove('loading');
    }

    if (refreshStatsButton) {
      setButtonLoading(refreshStatsButton, false);
    }
  }
}

async function handleRefreshStats(event) {
  event.preventDefault();
  await loadSecurityStats();
}

function renderSecurityStats(stats) {
  const totalEventsCounter = document.getElementById('total-threat-events');
  const uniqueIpsCounter = document.getElementById('unique-threat-ips');
  const uniquePatternsCounter = document.getElementById(
    'unique-attack-patterns'
  );

  if (totalEventsCounter)
    totalEventsCounter.textContent = stats.totalEvents || 0;
  if (uniqueIpsCounter) uniqueIpsCounter.textContent = stats.uniqueIps || 0;
  if (uniquePatternsCounter)
    uniquePatternsCounter.textContent = stats.uniquePatterns || 0;

  const lastUpdatedElement = document.getElementById(
    'security-stats-last-updated'
  );
  if (lastUpdatedElement && stats.lastUpdated) {
    const date = new Date(stats.lastUpdated);
    lastUpdatedElement.textContent = date.toLocaleString();
  }

  renderThreatTable(stats.topIps || []);

  renderHoneypotList(stats.activeHoneypots || []);

  renderAttackPatternChart(stats.topPatterns || []);
}

function renderThreatTable(threatIps) {
  if (!threatStatsTableBody) return;

  threatStatsTableBody.innerHTML = '';

  if (threatIps.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML =
      '<td colspan="4" class="text-center">Nenhuma atividade suspeita detectada</td>';
    threatStatsTableBody.appendChild(emptyRow);
    return;
  }

  threatIps.forEach((threatData, index) => {
    let riskClass = 'low-risk';
    if (threatData.count > 10) {
      riskClass = 'high-risk';
    } else if (threatData.count > 5) {
      riskClass = 'medium-risk';
    }

    const lastSeen = ui.formatMatchDateTime(threatData.lastSeen);

    let patternsList = 'Nenhum padrão detectado';
    if (threatData.topPatterns && threatData.topPatterns.length > 0) {
      patternsList = threatData.topPatterns
        .map((p) => `${p.pattern} (${p.count}x)`)
        .join('<br>');
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><code>${threatData.ip}</code></td>
      <td class="${riskClass}">${threatData.count}</td>
      <td>${lastSeen}</td>
      <td>${patternsList}</td>
    `;

    threatStatsTableBody.appendChild(row);
  });
}

function renderHoneypotList(honeypots) {
  if (!honeypotListContainer) return;

  honeypotListContainer.innerHTML = '';

  if (honeypots.length === 0) {
    honeypotListContainer.innerHTML =
      '<p class="text-center">Nenhum honeypot ativo</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'honeypot-list';

  honeypots.forEach((endpoint) => {
    const item = document.createElement('li');
    item.className = 'honeypot-endpoint';
    item.innerHTML = `<code>${endpoint}</code>`;
    list.appendChild(item);
  });

  honeypotListContainer.appendChild(list);
}

function isChartJsAvailable() {
  return typeof window.Chart !== 'undefined';
}

function renderAttackPatternChart(patterns) {
  if (!isChartJsAvailable() || patterns.length === 0) return;

  const chartCanvas = document.getElementById('attack-patterns-chart');
  if (!chartCanvas) return;

  const labels = patterns.map((p) => p.pattern);
  const data = patterns.map((p) => p.count);

  const colors = patterns.map((p) => {
    if (p.pattern.includes('SQL_INJECTION')) return '#e74c3c';
    if (p.pattern.includes('XSS')) return '#e67e22';
    if (p.pattern.includes('PATH_TRAVERSAL')) return '#f1c40f';
    return '#3498db';
  });

  if (window.attackPatternsChart) {
    window.attackPatternsChart.data.labels = labels;
    window.attackPatternsChart.data.datasets[0].data = data;
    window.attackPatternsChart.data.datasets[0].backgroundColor = colors;
    window.attackPatternsChart.update();
  } else {
    window.attackPatternsChart = new window.Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Frequência de Padrões de Ataque',
            data: data,
            backgroundColor: colors,
            borderColor: colors.map((c) => c),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: function (tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function (context) {
                return `Detecções: ${context.raw}`;
              },
            },
          },
        },
      },
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
