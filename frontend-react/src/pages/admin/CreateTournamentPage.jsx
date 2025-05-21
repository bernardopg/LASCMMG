import React from 'react';
import TournamentForm from '../../components/admin/TournamentForm';
import { useMessage } from '../../context/MessageContext';
import { createTournamentAdmin } from '../../services/api'; // Descomentado para uso futuro
import { useNavigate } from 'react-router-dom'; // Descomentado para uso futuro

const CreateTournamentPage = () => {
  const { showInfo, showSuccess, showError } = useMessage(); // Corrigido
  const navigate = useNavigate(); // Descomentado

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log('Valores do formulário para criar torneio:', values);
    showInfo('Criando torneio...');

    const payload = {
      name: values.name,
      date: values.date,
      description: values.description,
      numPlayersExpected: values.numPlayersExpected
        ? parseInt(values.numPlayersExpected, 10)
        : null,
      bracket_type: values.bracket_type,
      entry_fee: values.entry_fee ? parseFloat(values.entry_fee) : null,
      prize_pool: values.prize_pool,
      rules: values.rules,
    };

    try {
      const response = await createTournamentAdmin(payload);
      showSuccess('Torneio criado com sucesso!');
      resetForm();
      // Redireciona para a página do torneio criado, se disponível, ou para a lista de torneios
      if (response && response.tournament && response.tournament.id) {
        navigate(`/admin/tournaments/${response.tournament.id}`);
      } else {
        navigate('/admin/tournaments');
      }
    } catch (error) {
      showError(
        `Erro ao criar torneio: ${error.message || 'Erro desconhecido'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <div className="max-w-3xl mx-auto"> {/* This will keep the form content centered and constrained */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Criar Novo Torneio
        </h1>
        <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 md:p-8">
          <TournamentForm onSubmit={handleSubmit} isEditing={false} />
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
