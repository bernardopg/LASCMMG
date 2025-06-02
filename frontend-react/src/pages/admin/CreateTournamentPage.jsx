import React from 'react';
import TournamentForm from '../../components/admin/TournamentForm';
import { useMessage } from '../../context/MessageContext';
import { useTournament } from '../../context/TournamentContext';
import { createTournamentAdmin } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader'; // For consistent page titles
import { FaPlusCircle } from 'react-icons/fa'; // For PageHeader icon

const CreateTournamentPage = () => {
  const { showInfo, showSuccess, showError } = useMessage();
  const { createTournament, selectTournament } = useTournament();
  const navigate = useNavigate();

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
      status: values.status,
    };

    try {
      const response = await createTournamentAdmin(payload);
      console.log('Resposta da criação do torneio:', response);

      if (response && response.success && response.tournament && response.tournament.id) {
        showSuccess('Torneio criado com sucesso!');
        resetForm();

        // Atualizar o contexto do torneio
        try {
          await createTournament(payload);
          selectTournament(response.tournament.id);
        } catch (contextError) {
          console.warn('Erro ao atualizar contexto do torneio:', contextError);
          // Continuar mesmo se o contexto falhar
        }

        // Redirecionar para a página do torneio criado
        navigate(`/admin/tournaments/${response.tournament.id}`);
      } else {
        console.error('Resposta inválida da API:', response);
        showError('Torneio criado, mas houve um problema com a resposta da API.');
        navigate('/admin/tournaments');
      }
    } catch (error) {
      console.error('Erro ao criar torneio:', error);
      showError(
        `Erro ao criar torneio: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardBaseClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="Criar Novo Torneio" icon={FaPlusCircle} iconColor="text-lime-400" />
        <div className={cardBaseClasses}>
          <TournamentForm onSubmit={handleSubmit} isEditing={false} />
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
