import React, { useState, useEffect, useCallback } from 'react';
import { getSecurityOverviewStats } from '../../../services/api'; // Adjusted path
import { useMessage } from '../../../context/MessageContext'; // Adjusted path
import { FaSyncAlt } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Sub-components (could be moved to their own files if they grow larger)
const OverviewStatCard = ({
  title,
  value,
  subtitle,
  bgColorClass = 'bg-primary-500',
}) => (
  <div
    className={`stats-card ${bgColorClass} text-white p-4 rounded-lg shadow`}
  >
    <div className="stats-card-title text-sm opacity-80">{title}</div>
    <div className="stats-card-value text-3xl font-bold">{value}</div>
    <div className="stats-card-subtitle text-xs opacity-70">{subtitle}</div>
  </div>
);

const ThreatsTable = ({ threats }) => {
  if (!threats || threats.length === 0) {
    return (
      <tr>
        <td colSpan="5" className="text-center py-4 text-gray-400">
          Nenhuma atividade suspeita recente.
        </td>
      </tr>
    );
  }
  return threats.map((threat, index) => (
    <tr key={threat.ip || index} className="hover:bg-gray-700">
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-100">
        {index + 1}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-100">
        <code>{threat.ip}</code>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-100">
        {threat.count}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-100">
        {threat.lastSeen
          ? new Date(threat.lastSeen).toLocaleString('pt-BR')
          : '-'}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-100">
        {threat.topPatterns && threat.topPatterns.length > 0
          ? threat.topPatterns
              .map((p) => `${p.pattern} (${p.count}x)`)
              .join(', ')
          : 'N/A'}
      </td>
    </tr>
  ));
};

const ActiveHoneypotsList = ({ honeypots }) => {
  if (!honeypots || honeypots.length === 0) {
    return <p className="text-center text-gray-400">Nenhum honeypot ativo.</p>;
  }
  return (
    <ul className="list-disc list-inside pl-5 space-y-1 text-gray-300">
      {honeypots.map((hp, index) => (
        <li key={index}>
          <code>{hp}</code>
        </li>
      ))}
    </ul>
  );
};

const AttackPatternsChartComponent = ({ patterns }) => {
  if (!patterns || patterns.length === 0) {
    return (
      <p className="text-center text-gray-400 h-full flex items-center justify-center">
        Sem dados para o gráfico de padrões de ataque.
      </p>
    );
  }

  const chartData = {
    labels: patterns.map((p) => p.pattern),
    datasets: [
      {
        label: 'Frequência de Padrões',
        data: patterns.map((p) => p.count),
        backgroundColor: patterns.map((p) => {
          if (p.pattern.includes('SQL_INJECTION'))
            return 'rgba(231, 76, 60, 0.7)';
          if (p.pattern.includes('XSS')) return 'rgba(230, 126, 34, 0.7)';
          if (p.pattern.includes('PATH_TRAVERSAL'))
            return 'rgba(241, 196, 15, 0.7)';
          return 'rgba(52, 152, 219, 0.7)';
        }),
        borderColor: patterns.map((p) => {
          if (p.pattern.includes('SQL_INJECTION'))
            return 'rgba(231, 76, 60, 1)';
          if (p.pattern.includes('XSS')) return 'rgba(230, 126, 34, 1)';
          if (p.pattern.includes('PATH_TRAVERSAL'))
            return 'rgba(241, 196, 15, 1)';
          return 'rgba(52, 152, 219, 1)';
        }),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(203, 213, 225, 0.1)' },
      },
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(203, 213, 225, 0.1)' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleColor: '#fff',
        bodyColor: '#fff',
        backgroundColor: 'rgba(0,0,0,0.8)',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

const SecurityOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSecurityOverviewStats();
      setOverviewData(data);
    } catch (error) {
      console.error('Erro ao carregar visão geral de segurança:', error);
      showMessage(
        `Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`,
        'error'
      );
      setOverviewData(null);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-4 text-gray-300">
          Carregando dados de segurança...
        </span>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <p className="text-center text-gray-400 py-10">
        Não foi possível carregar os dados de segurança.
      </p>
    );
  }

  const {
    totalEvents = 0,
    uniqueIps = 0,
    uniquePatterns = 0,
    lastUpdated,
    topIps = [],
    activeHoneypots = [],
    topPatterns = [],
  } = overviewData;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2
          id="security-overview-heading"
          className="text-xl font-semibold text-gray-100"
        >
          Visão Geral de Segurança
        </h2>
        <button
          onClick={fetchData}
          className="btn btn-outline btn-sm text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
          disabled={loading}
        >
          <FaSyncAlt
            className={`inline mr-1.5 ${loading ? 'animate-spin' : ''}`}
          />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OverviewStatCard
          title="Total de Eventos"
          value={totalEvents}
          subtitle="tentativas detectadas"
          bgColorClass="bg-red-700"
        />
        <OverviewStatCard
          title="IPs Únicos"
          value={uniqueIps}
          subtitle="endereços distintos"
          bgColorClass="bg-yellow-600"
        />
        <OverviewStatCard
          title="Padrões de Ataque"
          value={uniquePatterns}
          subtitle="tipos detectados"
          bgColorClass="bg-blue-600"
        />
      </div>

      <div className="text-xs text-gray-400 text-right mb-6">
        Última atualização:{' '}
        {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'Nunca'}
      </div>

      <div className="card p-0">
        <h3 className="text-lg font-semibold mb-3 px-4 pt-4">
          Padrões de Ataque Mais Comuns
        </h3>
        <div className="chart-container h-72 md:h-80 p-2">
          <AttackPatternsChartComponent patterns={topPatterns} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3">
          Atividades Suspeitas Recentes (Top IPs)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Endereço IP
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Última Detecção
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Principais Padrões
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <ThreatsTable threats={topIps} />
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Honeypots Ativos</h3>
        <ActiveHoneypotsList honeypots={activeHoneypots} />
      </div>
    </div>
  );
};

export default SecurityOverview;
