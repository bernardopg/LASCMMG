import { memo, useCallback, useState } from 'react';
import { FaFileImport, FaSpinner, FaTimes, FaUpload } from 'react-icons/fa';
import { useMessage } from '../../../context/MessageContext';
import { importPlayersAdmin } from '../../../services/api';

const ImportPlayersModal = memo(({ tournamentId, isOpen, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const { showError, showSuccess, showWarning } = useMessage();

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  }, []);

  const handleClose = useCallback(() => {
    if (!isImporting) {
      setSelectedFile(null);
      onClose();
    }
  }, [isImporting, onClose]);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      showWarning('Por favor, selecione um arquivo JSON para importar.');
      return;
    }

    if (!tournamentId) {
      showError('ID do torneio não fornecido.');
      return;
    }

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.json')) {
      showError('Por favor, selecione apenas arquivos JSON (.json).');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      showError('O arquivo é muito grande. Tamanho máximo permitido: 5MB.');
      return;
    }

    setIsImporting(true);
    try {
      const responseData = await importPlayersAdmin(selectedFile, tournamentId);

      if (responseData.success) {
        let successMsg = `${responseData.importedCount || 0} jogadores processados com sucesso.`;

        if (responseData.databaseErrors?.length > 0) {
          successMsg += ` ${responseData.databaseErrors.length} falhas no banco de dados (possíveis duplicatas).`;
          console.warn('Erros de banco de dados na importação:', responseData.databaseErrors);
        }

        if (responseData.validationErrors?.length > 0) {
          successMsg += ` ${responseData.validationErrors.length} registros com dados inválidos foram ignorados.`;
          console.warn('Erros de validação na importação:', responseData.validationErrors);
        }

        showSuccess(successMsg);

        if (onImportSuccess) onImportSuccess();
        handleClose();
      } else {
        showError(responseData.message || 'Erro desconhecido ao importar jogadores.');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Erro ao importar jogadores';
      showError(`Erro ao importar jogadores: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  }, [
    selectedFile,
    tournamentId,
    showWarning,
    showError,
    showSuccess,
    onImportSuccess,
    handleClose,
  ]);

  const handleFileInputClick = useCallback((e) => {
    // Reset file input to allow selecting the same file again
    e.target.value = null;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-600 rounded-lg">
              <FaFileImport className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">Importar Jogadores</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Input */}
          <div className="space-y-3">
            <label htmlFor="jsonFile" className="block text-sm font-medium text-slate-300">
              Selecione o arquivo JSON:
            </label>
            <div className="relative">
              <input
                type="file"
                id="jsonFile"
                accept=".json"
                onChange={handleFileChange}
                onClick={handleFileInputClick}
                disabled={isImporting}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-lime-600 file:text-white hover:file:bg-lime-700 file:transition-colors file:duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 border border-slate-600 rounded-lg bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedFile && (
                <div className="mt-2 p-2 bg-slate-700 rounded-lg border border-slate-600">
                  <p className="text-xs text-slate-300 flex items-center gap-2">
                    <FaUpload className="w-3 h-3 text-lime-400" />
                    <span className="font-medium">Arquivo:</span> {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tamanho: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Formato do arquivo JSON:</h3>
            <div className="text-xs text-slate-400 space-y-2">
              <p>
                O arquivo deve ser um array de objetos. Cada objeto representa um jogador e pode
                conter:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <code className="bg-slate-900 px-1 rounded text-lime-400">PlayerName</code>{' '}
                  (obrigatório)
                </li>
                <li>
                  <code className="bg-slate-900 px-1 rounded text-lime-400">Nickname</code>{' '}
                  (opcional)
                </li>
                <li>
                  <code className="bg-slate-900 px-1 rounded text-lime-400">gender</code> (opcional)
                </li>
                <li>
                  <code className="bg-slate-900 px-1 rounded text-lime-400">skill_level</code>{' '}
                  (opcional)
                </li>
              </ul>
              <div className="mt-3 p-2 bg-slate-900 rounded border border-slate-600">
                <p className="text-xs text-slate-300 font-medium mb-1">Exemplo:</p>
                <code className="text-xs text-lime-400">
                  {'[{"PlayerName": "João Silva", "Nickname": "Joãozinho"}, ...]'}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-lime-600 hover:bg-lime-700 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isImporting ? (
              <>
                <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                Importando...
              </>
            ) : (
              <>
                <FaUpload className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ImportPlayersModal.displayName = 'ImportPlayersModal';

export default ImportPlayersModal;
