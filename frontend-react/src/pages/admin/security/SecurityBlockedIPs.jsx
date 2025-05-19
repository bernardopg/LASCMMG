import React, { useState, useEffect, useCallback } from 'react';
import { getBlockedIps, blockIpManually, unblockIp } from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaPlusCircle, FaTrashAlt, FaSyncAlt } from 'react-icons/fa';

const SecurityBlockedIPs = () => {
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchBlockedIps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getBlockedIps({ page, limit });
      setBlockedIps(data.blocked_ips || data.items || []); // Adapt to actual API response key
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      showMessage(`Erro ao carregar IPs bloqueados: ${error.message || 'Erro desconhecido'}`, 'error');
      setBlockedIps([]);
    } finally {
      setLoading(false);
    }
  }, [limit, showMessage]);

  useEffect(() => {
    fetchBlockedIps(currentPage);
  }, [fetchBlockedIps, currentPage]);

  const handleUnblock = async (ipAddress) => {
    if (window.confirm(`Tem certeza que deseja desbloquear o IP ${ipAddress}?`)) {
      try {
        await unblockIp(ipAddress);
        showMessage(`IP ${ipAddress} desbloqueado com sucesso.`, 'success');
        fetchBlockedIps(currentPage);
      } catch (error) {
        showMessage(`Erro ao desbloquear IP: ${error.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  const manualBlockValidationSchema = Yup.object().shape({
    ip_address: Yup.string().required('Endereço IP é obrigatório').matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Formato de IP inválido (IPv4)'),
    duration_hours: Yup.number().required('Duração é obrigatória').min(1, 'Mínimo 1 hora').integer('Deve ser um número inteiro'),
    reason: Yup.string().required('Motivo é obrigatório').min(5, 'Motivo muito curto').max(255, 'Motivo muito longo'),
  });

  const handleManualBlock = async (values, { setSubmitting, resetForm }) => {
    try {
      await blockIpManually(values);
      showMessage(`IP ${values.ip_address} bloqueado manualmente.`, 'success');
      fetchBlockedIps(currentPage); // Refresh list
      resetForm();
    } catch (error) {
      showMessage(`Erro ao bloquear IP: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Adicionar Bloqueio Manual</h2>
        <Formik
          initialValues={{ ip_address: '', duration_hours: 24, reason: '' }}
          validationSchema={manualBlockValidationSchema}
          onSubmit={handleManualBlock}
        >
          {({ isSubmitting, dirty, isValid }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ip_address" className="label">Endereço IP</label>
                  <Field type="text" name="ip_address" id="ip_address" className="input mt-1" placeholder="Ex: 192.168.1.100" />
                  <ErrorMessage name="ip_address" component="div" className="error-message" />
                </div>
                <div>
                  <label htmlFor="duration_hours" className="label">Duração (horas)</label>
                  <Field type="number" name="duration_hours" id="duration_hours" className="input mt-1" />
                  <ErrorMessage name="duration_hours" component="div" className="error-message" />
                </div>
                <div>
                  <label htmlFor="reason" className="label">Motivo</label>
                  <Field type="text" name="reason" id="reason" className="input mt-1" placeholder="Ex: Atividade suspeita" />
                  <ErrorMessage name="reason" component="div" className="error-message" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn btn-danger" disabled={isSubmitting || !dirty || !isValid}>
                  <FaPlusCircle className="inline mr-2" />
                  {isSubmitting ? 'Bloqueando...' : 'Bloquear IP'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-100">Lista de Bloqueio Ativa</h2>
            <button
                onClick={() => fetchBlockedIps(currentPage)}
                className="btn btn-outline btn-sm text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                disabled={loading}
            >
                <FaSyncAlt className={`inline mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Lista
            </button>
        </div>
        {loading && <div className="text-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div></div>}
        {!loading && error && <p className="text-red-400 text-center py-4">Erro ao carregar IPs: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bloqueado Desde</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bloqueado Até</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {blockedIps.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">Nenhum IP bloqueado atualmente.</td></tr>
                ) : (
                  blockedIps.map((ipInfo) => (
                    <tr key={ipInfo.ip_address} className="hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100"><code>{ipInfo.ip_address}</code></td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(ipInfo.blocked_since || ipInfo.timestamp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(ipInfo.blocked_until)}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{ipInfo.reason || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleUnblock(ipInfo.ip_address)} className="text-green-400 hover:text-green-300" title="Desbloquear IP">
                          <FaUndo />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="py-4 flex justify-between items-center text-sm text-gray-400">
            <span>Página {currentPage} de {totalPages}</span>
            <div className="space-x-2">
              <button onClick={() => fetchBlockedIps(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || loading} className="btn btn-outline btn-sm disabled:opacity-50">Anterior</button>
              <button onClick={() => fetchBlockedIps(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || loading} className="btn btn-outline btn-sm disabled:opacity-50">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityBlockedIPs;
