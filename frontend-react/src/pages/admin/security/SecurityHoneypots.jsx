import React, { useState, useEffect, useCallback } from 'react';
import { getHoneypotConfig, updateHoneypotConfig, getSecurityOverviewStats } from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaSave, FaSyncAlt } from 'react-icons/fa';

const SecurityHoneypots = () => {
  const [config, setConfig] = useState(null);
  const [activeHoneypots, setActiveHoneypots] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const { showMessage } = useMessage();

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getHoneypotConfig();
      setConfig(data);
    } catch (error) {
      showMessage(`Erro ao carregar configuração de honeypots: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoadingConfig(false);
    }
  }, [showMessage]);

  const fetchActiveHoneypots = useCallback(async () => {
    setLoadingActive(true);
    try {
      // Assuming overview stats also contain active honeypots list
      const data = await getSecurityOverviewStats();
      setActiveHoneypots(data.activeHoneypots || []);
    } catch (error) {
      showMessage(`Erro ao carregar lista de honeypots ativos: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoadingActive(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchConfig();
    fetchActiveHoneypots();
  }, [fetchConfig, fetchActiveHoneypots]);

  const validationSchema = Yup.object().shape({
    threshold: Yup.number().required('Limite é obrigatório').min(1, 'Mínimo 1').max(20, 'Máximo 20').integer(),
    blockDurationHours: Yup.number().required('Duração é obrigatória').min(1, 'Mínimo 1 hora').max(720, 'Máximo 720 horas (30 dias)').integer(),
    whitelist: Yup.string().test(
      'is-ip-list',
      'Formato de IP inválido na whitelist. Use um IP por linha.',
      (value) => {
        if (!value || value.trim() === '') return true; // Allow empty
        const ips = value.split('\n').map(ip => ip.trim()).filter(ip => ip);
        // Basic IPv4 regex, can be improved
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        return ips.every(ip => ipRegex.test(ip));
      }
    )
  });

  const handleSaveConfig = async (values, { setSubmitting }) => {
    try {
      await updateHoneypotConfig({
        threshold: values.threshold,
        block_duration_hours: values.blockDurationHours, // Ensure backend expects this key
        whitelist_ips: values.whitelist.split('\n').map(ip => ip.trim()).filter(ip => ip),
      });
      showMessage('Configuração de honeypots salva com sucesso!', 'success');
      fetchConfig(); // Re-fetch to confirm changes
    } catch (error) {
      showMessage(`Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig || loadingActive) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-4 text-gray-300">Carregando dados de honeypots...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Endpoints Honeypot Ativos</h2>
        {activeHoneypots.length > 0 ? (
          <ul className="list-disc list-inside pl-5 space-y-1 text-gray-300 bg-gray-800 p-4 rounded-md">
            {activeHoneypots.map((hp, index) => <li key={index}><code>{hp}</code></li>)}
          </ul>
        ) : (
          <p className="text-gray-400">Nenhum honeypot ativo no momento.</p>
        )}
         <button
          onClick={fetchActiveHoneypots}
          className="btn btn-outline btn-sm text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white mt-3"
          disabled={loadingActive}
        >
          <FaSyncAlt className={`inline mr-1.5 ${loadingActive ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Configuração de Honeypots</h2>
        {config ? (
          <Formik
            initialValues={{
              threshold: config.threshold || 3,
              blockDurationHours: config.block_duration_hours || 6,
              whitelist: (config.whitelist_ips || []).join('\n'),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSaveConfig}
            enableReinitialize
          >
            {({ isSubmitting, dirty, isValid }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="threshold" className="label">Limite para Bloqueio (tentativas)</label>
                  <Field type="number" name="threshold" id="threshold" className="input mt-1" />
                  <ErrorMessage name="threshold" component="div" className="error-message" />
                  <p className="text-xs text-gray-400 mt-1">Número de acessos a honeypots antes de bloquear um IP.</p>
                </div>
                <div>
                  <label htmlFor="blockDurationHours" className="label">Duração do Bloqueio (horas)</label>
                  <Field type="number" name="blockDurationHours" id="blockDurationHours" className="input mt-1" />
                  <ErrorMessage name="blockDurationHours" component="div" className="error-message" />
                  <p className="text-xs text-gray-400 mt-1">Tempo que um IP ficará bloqueado.</p>
                </div>
                <div>
                  <label htmlFor="whitelist" className="label">IPs na Whitelist (um por linha)</label>
                  <Field as="textarea" name="whitelist" id="whitelist" rows="4" className="input mt-1" placeholder="127.0.0.1&#10;192.168.1.100" />
                  <ErrorMessage name="whitelist" component="div" className="error-message" />
                  <p className="text-xs text-gray-400 mt-1">IPs que nunca serão bloqueados.</p>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || !dirty || !isValid}>
                    <FaSave className="inline mr-2" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Configuração'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <p className="text-gray-400">Não foi possível carregar a configuração.</p>
        )}
      </div>
    </div>
  );
};

export default SecurityHoneypots;
