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
import { FaBug, FaExclamationTriangle, FaShieldAlt, FaSyncAlt, FaUser } from 'react-icons/fa'; // Adicionado FaUser
import LoadingSpinner from '../../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../../components/ui/page/PageHeader'; // For consistent page titles
import { useMessage } from '../../../context/MessageContext'; // Adjusted path
import { getSecurityOverviewStats } from '../../../services/api'; // Adjusted path

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Sub-components (could be moved to their own files if they grow larger)
const OverviewStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'neutral', // e.g., 'danger', 'warning', 'info', 'neutral'
  index = 0,
}) => {
  const schemeClasses = {
    danger: {
      bg: 'bg-red-600/20',
      text: 'text-red-200',
      iconBg: 'bg-red-500',
      iconText: 'text-white',
    },
    warning: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-200',
      iconBg: 'bg-yellow-500',
      iconText: 'text-white',
    },
    info: {
      bg: 'bg-sky-600/20',
      text: 'text-sky-200',
      iconBg: 'bg-sky-500',
      iconText: 'text-white',
    },
    neutral: {
      bg: 'bg-slate-700/50',
      text: 'text-slate-200',
      iconBg: 'bg-slate-500',
      iconText: 'text-white',
    },
  };
  const currentScheme = schemeClasses[colorScheme] || schemeClasses.neutral;

  return (
    <div
      className={`${currentScheme.bg} p-4 sm:p-5 rounded-xl shadow-lg border border-slate-700/50`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-sm font-semibold uppercase tracking-wider ${currentScheme.text} opacity-80`}
        >
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${currentScheme.iconBg}`}>
            <Icon className={`h-5 w-5 ${currentScheme.iconText}`} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${currentScheme.text}`}>{value}</p>
      {subtitle && <p className={`text-xs ${currentScheme.text} opacity-70 mt-1`}>{subtitle}</p>}
    </div>
  );
};

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
    <tr key={threat.ip || index} className="hover:bg-slate-700">
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">{index + 1}</td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
        <code>{threat.ip}</code>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">{threat.count}</td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
        {threat.lastSeen ? new Date(threat.lastSeen).toLocaleString('pt-BR') : '-'}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
        {threat.topPatterns && threat.topPatterns.length > 0
          ? threat.topPatterns.map((p) => `${p.pattern} (${p.count}x)`).join(', ')
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
          <code className="bg-slate-700 p-1 rounded text-sm">{hp}</code>
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
          color: '#cbd5e1',
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#cbd5e1',
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleColor: '#fff',
        bodyColor: '#fff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'rgba(255,255,255,0.2)',
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
        <LoadingSpinner size="lg" message="Carregando dados de segurança..." />
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="text-center py-10">
        <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 mb-4" />
        <p className="text-slate-500">
          Não foi possível carregar os dados de segurança. Tente atualizar.
        </p>
      </div>
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

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const outlineButtonClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500 disabled:opacity-60';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Visão Geral de Segurança"
          icon={FaShieldAlt}
          iconColor="text-lime-400"
          smallMargin={true}
        />
        <button
          onClick={fetchData}
          className={`${outlineButtonClasses} text-xs py-1.5 px-3`}
          disabled={loading}
        >
          <FaSyncAlt className={`inline mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OverviewStatCard
          title="Total de Eventos"
          value={totalEvents}
          subtitle="tentativas detectadas"
          colorScheme="danger"
          icon={FaExclamationTriangle}
        />
        <OverviewStatCard
          title="IPs Únicos"
          value={uniqueIps}
          subtitle="endereços distintos"
          colorScheme="warning"
          icon={FaUser}
        />
        <OverviewStatCard
          title="Padrões de Ataque"
          value={uniquePatterns}
          subtitle="tipos detectados"
          colorScheme="info"
          icon={FaBug}
        />
      </div>

      <div className="text-xs text-slate-500 text-right mb-6">
        Última atualização: {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'Nunca'}
      </div>

      <div className={`${cardBaseClasses} p-0`}>
        <h3 className="text-lg font-semibold mb-3 px-4 pt-4 text-slate-100">
          Padrões de Ataque Mais Comuns
        </h3>
        <div className="chart-container h-72 md:h-80 p-2">
          <AttackPatternsChartComponent patterns={topPatterns} />
        </div>
      </div>

      <div className={cardBaseClasses}>
        <h3 className="text-lg font-semibold mb-3 text-slate-100">
          Atividades Suspeitas Recentes (Top IPs)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Endereço IP
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Última Detecção
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Principais Padrões
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <ThreatsTable threats={topIps} />
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardBaseClasses}>
        <h3 className="text-lg font-semibold mb-3 text-slate-100">Honeypots Ativos</h3>
        <div className="p-4">
          <ActiveHoneypotsList honeypots={activeHoneypots} />
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;
