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
    showInfo('Simulando criação de torneio...'); // Corrigido

    // TODO: Implementar chamada à API createTournamentAdmin(values)
    // try {
    //   const response = await createTournamentAdmin(values); // Usar a função importada
    //   showSuccess('Torneio criado com sucesso!'); // Corrigido
    //   resetForm();
    //   navigate(`/admin/tournaments/${response.tournament.id}`); // Ou para a lista de torneios
    // } catch (error) {
    //   showError(`Erro ao criar torneio: ${error.message || 'Erro desconhecido'}`); // Corrigido
    // } finally {
    //   setSubmitting(false);
    // }

    // Simulação atual:
    setTimeout(() => {
      setSubmitting(false);
      showSuccess('Criação de torneio simulada com sucesso (API precisa ser implementada).'); // Corrigido
      // resetForm();
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Criar Novo Torneio</h1>
        <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 md:p-8">
          <TournamentForm onSubmit={handleSubmit} isEditing={false} />
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
