import React, { useState } from 'react';
import { FaTimes, FaUpload, FaSpinner } from 'react-icons/fa';
// import { useMessage } from '../../context/MessageContext'; // If needed for messages
// import { importPlayersForTournament } from '../../services/api'; // API call

const ImportPlayersModal = ({
  tournamentId,
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  // const { showMessage } = useMessage();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo JSON para importar.');
      // showMessage('Por favor, selecione um arquivo JSON para importar.', 'warning');
      return;
    }
    if (!tournamentId) {
      alert('ID do torneio não fornecido.');
      // showMessage('ID do torneio não fornecido.', 'error');
      return;
    }

    setIsImporting(true);
    // Simulating API call
    console.log(
      `Simulando importação do arquivo ${selectedFile.name} para o torneio ${tournamentId}`
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

    // try {
    //   const formData = new FormData();
    //   formData.append('jsonFile', selectedFile);
    //   // Assuming an API endpoint like: await importPlayersForTournament(tournamentId, formData);
    //   showMessage('Jogadores importados com sucesso!', 'success');
    //   if (onImportSuccess) onImportSuccess();
    //   onClose();
    // } catch (error) {
    //   showMessage(`Erro ao importar jogadores: ${error.response?.data?.message || error.message}`, 'error');
    // } finally {
    //   setIsImporting(false);
    // }

    setIsImporting(false);
    alert(
      `Simulação de importação concluída para ${selectedFile.name}. Implementar API real.`
    );
    // showMessage(`Simulação de importação concluída para ${selectedFile.name}. Implementar API real.`, 'info');
    // onClose(); // Keep modal open for now in simulation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
          aria-label="Fechar modal"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Importar Jogadores de Arquivo JSON
        </h2>

        <div className="mb-4">
          <label htmlFor="jsonFile" className="label mb-1">
            Selecione o arquivo JSON:
          </label>
          <input
            type="file"
            id="jsonFile"
            accept=".json"
            onChange={handleFileChange}
            className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-dark file:text-white hover:file:bg-primary-darker"
          />
          {selectedFile && (
            <p className="text-xs text-gray-400 mt-1">
              Arquivo selecionado: {selectedFile.name}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-4">
          O arquivo JSON deve ser um array de objetos, onde cada objeto
          representa um jogador e pode conter os campos: `PlayerName`
          (obrigatório), `Nickname`, `gender`, `skill_level`.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="btn btn-primary"
          >
            {isImporting ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Importando...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" /> Importar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPlayersModal;
