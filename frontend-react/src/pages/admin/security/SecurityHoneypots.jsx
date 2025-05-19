import React, { useState, useEffect, useCallback } from 'react';
import {
  getHoneypotConfig,
  updateHoneypotConfig,
  getSecurityOverviewStats,
} from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaSave, FaSyncAlt } from 'react-icons/fa';

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
      showError( // Corrigido
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
      showError( // Corrigido
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
      showError( // Corrigido
        `Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig || loadingActive) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
        <span className="ml-4 text-gray-700 dark:text-gray-300">
          Carregando dados de honeypots...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Endpoints Honeypot Ativos
        </h2>
        {activeHoneypots.length > 0 ? (
          <ul className="list-disc list-inside pl-5 space-y-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 p-4 rounded-md">
            {activeHoneypots.map((hp, index) => (
              <li key={index}>
                <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded text-sm">{hp}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Nenhum honeypot ativo no momento.</p>
        )}
        <button
          onClick={fetchActiveHoneypots}
          className="btn btn-outline btn-sm text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white mt-3"
          disabled={loadingActive}
        >
          <FaSyncAlt
            className={`inline mr-1.5 ${loadingActive ? 'animate-spin' : ''}`}
          />
          Atualizar Lista
        </button>
      </div>

      <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
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
            {({ isSubmitting, dirty, isValid }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="threshold" className="label block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Limite para Bloqueio (tentativas)
                  </label>
                  <Field
                    type="number"
                    name="threshold"
                    id="threshold"
                    className="input mt-1 form-input block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                  <ErrorMessage
                    name="threshold"
                    component="div"
                    className="error-message text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Número de acessos a honeypots (em {config.activityWindowMinutes || 60} min) antes de bloquear um IP. (1-100)
                  </p>
                </div>
                <div>
                  <label htmlFor="block_duration_hours" className="label block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duração do Bloqueio (horas)
                  </label>
                  <Field
                    type="number"
                    name="block_duration_hours" // Padronizado
                    id="block_duration_hours"   // Padronizado
                    className="input mt-1 form-input block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                  <ErrorMessage
                    name="block_duration_hours" // Padronizado
                    component="div"
                    className="error-message text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tempo que um IP ficará bloqueado (1-720 horas).
                  </p>
                </div>
                <div>
                  <label htmlFor="whitelist" className="label block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IPs na Whitelist (um por linha)
                  </label>
                  <Field
                    as="textarea"
                    name="whitelist"
                    id="whitelist"
                    rows="4"
                    className="input mt-1 form-textarea block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    placeholder="127.0.0.1&#10;192.168.1.100"
                  />
                  <ErrorMessage
                    name="whitelist"
                    component="div"
                    className="error-message text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    IPs que nunca serão bloqueados.
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary" // btn e btn-primary devem ser responsivos ao tema
                    disabled={isSubmitting || !dirty || !isValid}
                  >
                    <FaSave className="inline mr-2" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Configuração'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Não foi possível carregar a configuração.
          </p>
        )}
      </div>
    </div>
  );
};

export default SecurityHoneypots;
