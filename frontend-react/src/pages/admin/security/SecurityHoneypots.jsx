import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { FaBug, FaListUl, FaSave, FaShieldAlt, FaSpinner, FaSyncAlt } from 'react-icons/fa'; // Adicionado FaBug
import * as Yup from 'yup';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../../components/common/PageHeader'; // For consistent page titles
import { useMessage } from '../../../context/MessageContext';
import {
  getHoneypotConfig,
  getSecurityOverviewStats,
  updateHoneypotConfig,
} from '../../../services/api';

const SecurityHoneypots = () => {
  const [config, setConfig] = useState(null);
  const [activeHoneypots, setActiveHoneypots] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const { showError, showSuccess } = useMessage(); // Corrigido

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getHoneypotConfig();
      setConfig(data);
    } catch (error) {
      showError(
        // Corrigido
        `Erro ao carregar configuração de honeypots: ${error.message || 'Erro desconhecido'}`
      );
    } finally {
      setLoadingConfig(false);
    }
  }, [showError]); // Corrigido

  const fetchActiveHoneypots = useCallback(async () => {
    setLoadingActive(true);
    try {
      // Assuming overview stats also contain active honeypots list
      const data = await getSecurityOverviewStats();
      setActiveHoneypots(data.activeHoneypots || []);
    } catch (error) {
      showError(
        // Corrigido
        `Erro ao carregar lista de honeypots ativos: ${error.message || 'Erro desconhecido'}`
      );
    } finally {
      setLoadingActive(false);
    }
  }, [showError]); // Corrigido

  useEffect(() => {
    fetchConfig();
    fetchActiveHoneypots();
  }, [fetchConfig, fetchActiveHoneypots]);

  const validationSchema = Yup.object().shape({
    threshold: Yup.number()
      .required('Limite é obrigatório')
      .min(1, 'Mínimo 1')
      .max(100, 'Máximo 100') // Increased max based on Joi schema in validationUtils
      .integer(),
    block_duration_hours: Yup.number()
      .required('Duração é obrigatória')
      .min(1, 'Mínimo 1 hora')
      .max(720, 'Máximo 720 horas (30 dias)') // Joi schema has max 720
      .integer(),
    whitelist: Yup.string().test(
      'is-ip-list',
      'Formato de IP inválido na whitelist. Use um IP por linha.',
      (value) => {
        if (!value || value.trim() === '') return true; // Allow empty
        const ips = value
          .split('\n')
          .map((ip) => ip.trim())
          .filter((ip) => ip);
        // Basic IPv4 regex, can be improved
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        return ips.every((ip) => ipRegex.test(ip));
      }
    ),
  });

  const handleSaveConfig = async (values, { setSubmitting }) => {
    try {
      // Values sent to API should match Joi schema and backend expectations
      await updateHoneypotConfig({
        threshold: values.threshold,
        block_duration_hours: values.block_duration_hours,
        whitelist_ips: values.whitelist
          .split('\n')
          .map((ip) => ip.trim())
          .filter((ip) => ip),
      });
      showSuccess('Configuração de honeypots salva com sucesso!'); // Corrigido
      fetchConfig(); // Re-fetch to confirm changes
    } catch (error) {
      showError(
        // Corrigido
        `Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const inputBaseClasses =
    'block w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-slate-100';
  const inputErrorClasses = 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500';
  const labelClasses = 'block text-sm font-medium text-slate-300';
  const errorMessageClasses = 'mt-1 text-xs text-red-400';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;

  if (loadingConfig || loadingActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
        <LoadingSpinner size="lg" message="Carregando dados de honeypots..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Gerenciamento de Honeypots" icon={FaBug} iconColor="text-lime-400" />

      <div className={cardBaseClasses}>
        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
          <FaListUl className="mr-3 h-5 w-5 text-lime-400" />
          Endpoints Honeypot Ativos ({activeHoneypots.length})
        </h2>
        {activeHoneypots.length > 0 ? (
          <ul className="list-disc list-inside pl-5 space-y-1 text-slate-300 bg-slate-700/50 p-4 rounded-md">
            {activeHoneypots.map((hp, index) => (
              <li key={index}>
                <code className="bg-slate-600 p-1 rounded text-sm text-slate-200">{hp}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">Nenhum honeypot ativo no momento.</p>
        )}
        <button
          onClick={fetchActiveHoneypots}
          className={`${outlineButtonClasses} text-xs py-1.5 px-3 mt-4`}
          disabled={loadingActive}
        >
          <FaSyncAlt
            className={`inline mr-1.5 h-3.5 w-3.5 ${loadingActive ? 'animate-spin' : ''}`}
          />
          Atualizar Lista
        </button>
      </div>

      <div className={cardBaseClasses}>
        <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center">
          <FaShieldAlt className="mr-3 h-5 w-5 text-lime-400" />
          Configuração de Honeypots
        </h2>
        {config ? (
          <Formik
            initialValues={{
              threshold: config.threshold || 5,
              block_duration_hours: config.block_duration_hours || 24, // Padronizado
              whitelist: (config.whitelist_ips || ['127.0.0.1', '::1']).join('\n'),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSaveConfig}
            enableReinitialize
          >
            {({ isSubmitting, dirty, isValid, formik }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="threshold" className={labelClasses}>
                    Limite para Bloqueio (tentativas)
                  </label>
                  <Field
                    type="number"
                    name="threshold"
                    id="threshold"
                    className={`${inputBaseClasses} ${formik.errors.threshold && formik.touched.threshold ? inputErrorClasses : 'border-slate-600'}`} // Usa formik.errors e formik.touched
                  />
                  <ErrorMessage name="threshold" component="div" className={errorMessageClasses} />
                  <p className="text-xs text-slate-400 mt-1">
                    Número de acessos a honeypots (em {config.activityWindowMinutes || 60} min)
                    antes de bloquear um IP. (1-100)
                  </p>
                </div>
                <div>
                  <label htmlFor="block_duration_hours" className={labelClasses}>
                    Duração do Bloqueio (horas)
                  </label>
                  <Field
                    type="number"
                    name="block_duration_hours"
                    id="block_duration_hours"
                    className={`${inputBaseClasses} ${formik.errors.block_duration_hours && formik.touched.block_duration_hours ? inputErrorClasses : 'border-slate-600'}`} // Usa formik.errors e formik.touched
                  />
                  <ErrorMessage
                    name="block_duration_hours"
                    component="div"
                    className={errorMessageClasses}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Tempo que um IP ficará bloqueado (1-720 horas).
                  </p>
                </div>
                <div>
                  <label htmlFor="whitelist" className={labelClasses}>
                    IPs na Whitelist (um por linha)
                  </label>
                  <Field
                    as="textarea"
                    name="whitelist"
                    id="whitelist"
                    rows="4"
                    className={`${inputBaseClasses} ${formik.errors.whitelist && formik.touched.whitelist ? inputErrorClasses : 'border-slate-600'}`} // Usa formik.errors e formik.touched
                    placeholder="127.0.0.1&#10;192.168.1.100"
                  />
                  <ErrorMessage name="whitelist" component="div" className={errorMessageClasses} />
                  <p className="text-xs text-slate-400 mt-1">IPs que nunca serão bloqueados.</p>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className={primaryButtonClasses}
                    disabled={isSubmitting || !dirty || !isValid}
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    ) : (
                      <FaSave className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? 'Salvando...' : 'Salvar Configuração'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <p className="text-slate-400">Não foi possível carregar a configuração.</p>
        )}
      </div>
    </div>
  );
};

export default SecurityHoneypots;
