import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useCallback, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaSyncAlt } from 'react-icons/fa';
import { useMessage } from '../../../context/MessageContext'; // Adjusted path
import { getSecurityOverviewStats } from '../../../services/api'; // Adjusted path

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Sub-components (could be moved to their own files if they grow larger)
const OverviewStatCard = ({
  title,
  value,
  subtitle,
  icon: _icon, // Adicionado para consistência, embora não usado no design original do card
  // bgColorClass e textColorClass para controle mais fino e adaptação ao tema
  bgColorClass = 'bg-blue-500 dark:bg-blue-700',
  textColorClass = 'text-white',
}) => (
  <div className={`stats-card ${bgColorClass} ${textColorClass} p-4 rounded-lg shadow`}>
    <div className="stats-card-title text-sm opacity-80">{title}</div>
    <div className="stats-card-value text-3xl font-bold">{value}</div>
    <div className="stats-card-subtitle text-xs opacity-70">{subtitle}</div>
  </div>
);

const ThreatsTable = ({ threats }) => {
  if (!threats || threats.length === 0) {
    return (
      <tr>
        <td colSpan="5" className="text-center py-4 text-gray-500 dark:text-gray-400">
          Nenhuma atividade suspeita recente.
        </td>
      </tr>
    );
  }
  return threats.map((threat, index) => (
    <tr key={threat.ip || index} className="hover:bg-gray-100 dark:hover:bg-slate-700">
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        {index + 1}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        <code>{threat.ip}</code>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        {threat.count}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        {threat.lastSeen ? new Date(threat.lastSeen).toLocaleString('pt-BR') : '-'}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        {threat.topPatterns && threat.topPatterns.length > 0
          ? threat.topPatterns.map((p) => `${p.pattern} (${p.count}x)`).join(', ')
          : 'N/A'}
      </td>
    </tr>
  ));
};

const ActiveHoneypotsList = ({ honeypots }) => {
  if (!honeypots || honeypots.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Nenhum honeypot ativo.</p>;
  }
  return (
    <ul className="list-disc list-inside pl-5 space-y-1 text-gray-700 dark:text-gray-300">
      {honeypots.map((hp, index) => (
        <li key={index}>
          <code className="bg-gray-100 dark:bg-slate-700 p-1 rounded text-sm">{hp}</code>
        </li>
      ))}
    </ul>
  );
};

const AttackPatternsChartComponent = ({ patterns }) => {
  if (!patterns || patterns.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
        Sem dados para o gráfico de padrões de ataque.
      </p>
    );
  }

  // TODO: As cores do gráfico precisam ser adaptáveis ao tema ou usar cores neutras.
  // Atualmente, são fixas e podem não ter bom contraste no tema claro se o fundo do card for claro.
  const chartData = {
    labels: patterns.map((p) => p.pattern),
    datasets: [
      {
        label: 'Frequência de Padrões',
        data: patterns.map((p) => p.count),
        backgroundColor: patterns.map((p) => {
          if (p.pattern.includes('SQL_INJECTION')) return 'rgba(239, 68, 68, 0.7)'; // Corrigido para Tailwind red-500
          if (p.pattern.includes('XSS')) return 'rgba(245, 158, 11, 0.7)'; // Corrigido para Tailwind amber-500
          if (p.pattern.includes('PATH_TRAVERSAL')) return 'rgba(234, 179, 8, 0.7)'; // Corrigido para Tailwind yellow-500
          return 'rgba(59, 130, 246, 0.7)'; // Corrigido para Tailwind blue-500
        }),
        borderColor: patterns.map((p) => {
          if (p.pattern.includes('SQL_INJECTION')) return 'rgba(239, 68, 68, 1)';
          if (p.pattern.includes('XSS')) return 'rgba(245, 158, 11, 1)';
          if (p.pattern.includes('PATH_TRAVERSAL')) return 'rgba(234, 179, 8, 1)';
          return 'rgba(59, 130, 246, 1)';
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
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#4b5563',
        }, // Adaptado
        grid: {
          color: document.documentElement.classList.contains('dark')
            ? 'rgba(203, 213, 225, 0.1)'
            : 'rgba(209, 213, 219, 0.5)',
        }, // Adaptado
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#4b5563',
        }, // Adaptado
        grid: {
          color: document.documentElement.classList.contains('dark')
            ? 'rgba(203, 213, 225, 0.1)'
            : 'rgba(209, 213, 219, 0.5)',
        }, // Adaptado
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleColor: document.documentElement.classList.contains('dark') ? '#fff' : '#000', // Adaptado
        bodyColor: document.documentElement.classList.contains('dark') ? '#fff' : '#000', // Adaptado
        backgroundColor: document.documentElement.classList.contains('dark')
          ? 'rgba(0,0,0,0.8)'
          : 'rgba(255,255,255,0.9)', // Adaptado
        borderColor: document.documentElement.classList.contains('dark')
          ? 'rgba(255,255,255,0.2)'
          : 'rgba(0,0,0,0.2)', // Adaptado
        borderWidth: 1,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

const SecurityOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useMessage(); // Corrigido

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSecurityOverviewStats();
      setOverviewData(data);
    } catch (error) {
      console.error('Erro ao carregar visão geral de segurança:', error);
      showError(
        // Corrigido
        `Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`
      );
      setOverviewData(null);
    } finally {
      setLoading(false);
    }
  }, [showError]); // Corrigido

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
        <span className="ml-4 text-gray-700 dark:text-gray-300">
          Carregando dados de segurança...
        </span>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-10">
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
          className="text-xl font-semibold text-gray-800 dark:text-gray-100"
        >
          Visão Geral de Segurança
        </h2>
        <button
          onClick={fetchData}
          className="btn btn-outline btn-sm text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
          disabled={loading}
        >
          <FaSyncAlt className={`inline mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OverviewStatCard
          title="Total de Eventos"
          value={totalEvents}
          subtitle="tentativas detectadas"
          bgColorClass="bg-red-100 dark:bg-red-700"
          textColorClass="text-red-700 dark:text-red-100"
        />
        <OverviewStatCard
          title="IPs Únicos"
          value={uniqueIps}
          subtitle="endereços distintos"
          bgColorClass="bg-yellow-100 dark:bg-yellow-700"
          textColorClass="text-yellow-700 dark:text-yellow-100"
        />
        <OverviewStatCard
          title="Padrões de Ataque"
          value={uniquePatterns}
          subtitle="tipos detectados"
          bgColorClass="bg-blue-100 dark:bg-blue-700"
          textColorClass="text-blue-700 dark:text-blue-100"
        />
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-right mb-6">
        Última atualização: {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'Nunca'}
      </div>

      <div className="card bg-white dark:bg-slate-800 p-0 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3 px-4 pt-4 text-gray-800 dark:text-gray-100">
          Padrões de Ataque Mais Comuns
        </h3>
        <div className="chart-container h-72 md:h-80 p-2">
          <AttackPatternsChartComponent patterns={topPatterns} />
        </div>
      </div>

      <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3 px-4 pt-4 text-gray-800 dark:text-gray-100">
          Atividades Suspeitas Recentes (Top IPs)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-750">
              {' '}
              {/* 750 is custom, maybe slate-700 or 800 */}
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Endereço IP
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Detecção
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Principais Padrões
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              <ThreatsTable threats={topIps} />
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3 px-4 pt-4 text-gray-800 dark:text-gray-100">
          Honeypots Ativos
        </h3>
        <div className="p-4">
          <ActiveHoneypotsList honeypots={activeHoneypots} />
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;
