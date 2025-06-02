import { FaChartBar, FaExclamationTriangle } from 'react-icons/fa'; // Added icons
import PageHeader from '../../../components/common/PageHeader'; // For consistent page titles

const SecurityThreatAnalytics = () => {
  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const placeholderBoxClasses =
    'h-64 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-600';
  const noteBoxClasses = 'mt-6 p-4 border border-amber-500/50 rounded-lg bg-amber-500/10';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Detalhada de Ameaças"
        subtitle="(Em Desenvolvimento)"
        icon={FaChartBar}
        iconColor="text-lime-400"
      />

      <div className={cardBaseClasses}>
        <p className="text-lg text-slate-300 mb-6">
          Esta seção está planejada para fornecer uma visão aprofundada sobre as atividades de
          segurança e potenciais ameaças detectadas pelo sistema.
        </p>
        <p className="font-semibold text-slate-200 mb-2">Funcionalidades futuras podem incluir:</p>
        <ul className="list-disc list-inside pl-5 space-y-1 text-slate-400">
          <li>
            Gráfico de Distribuição de Tipos de Ataque (ex: SQL Injection, XSS, Path Traversal via
            Honeypot).
          </li>
          <li>Linha do Tempo de Atividades Suspeitas.</li>
          <li>Mapa Geográfico de Origem de Ameaças (baseado em GeoIP).</li>
          <li>Análise de Padrões de Tráfego e Anomalias.</li>
          <li>Relatórios de Segurança Personalizáveis.</li>
        </ul>

        {/* Placeholder para Gráficos */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${cardBaseClasses} border-slate-700/70`}>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              Distribuição de Tipos de Ameaça
            </h3>
            <div className={placeholderBoxClasses}>[Placeholder para Gráfico de Pizza/Barras]</div>
          </div>
          <div className={`${cardBaseClasses} border-slate-700/70`}>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Linha do Tempo de Ameaças</h3>
            <div className={placeholderBoxClasses}>[Placeholder para Gráfico de Linha]</div>
          </div>
        </div>

        <p className="mt-6 text-slate-400">
          A implementação destas funcionalidades dependerá da coleta e agregação de dados relevantes
          pelo backend.
        </p>
        <div className={noteBoxClasses}>
          <p className="font-semibold text-amber-300 flex items-center">
            <FaExclamationTriangle className="inline mr-2 h-5 w-5" />
            Nota:
          </p>
          <p className="text-amber-500 mt-1">
            Atualmente, a &ldquo;Visão Geral de Segurança&rdquo; já apresenta algumas estatísticas
            básicas do Honeypot. Esta página expandirá essas análises com visualizações mais
            detalhadas e interativas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityThreatAnalytics;
