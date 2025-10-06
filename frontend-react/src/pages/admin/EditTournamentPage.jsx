import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TournamentForm from '../../components/admin/TournamentForm';
import { getTournamentDetails, updateTournamentAdmin } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaSpinner, FaEdit, FaExclamationTriangle } from 'react-icons/fa'; // Added FaEdit, FaExclamationTriangle
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles

const EditTournamentPage = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useMessage();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTournament = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTournamentDetails(tournamentId);
      setTournament(data.tournament);
    } catch (err) {
      setError('Erro ao carregar dados do torneio para edição.');
      showError(`Erro ao carregar torneio: ${err.response?.data?.message || err.message}`);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleSubmit = async (formData) => {
    try {
      // updateTournamentAdmin in services/api.js now handles making multiple PATCH calls
      // for individual fields if necessary.
      const responseData = await updateTournamentAdmin(tournamentId, formData);

      // updateTournamentAdmin returns { success, tournament, errors }
      if (responseData.success) {
        showSuccess('Torneio atualizado com sucesso!');
        navigate('/admin/tournaments'); // Redirect to tournament list
      } else {
        const errorMessages =
          responseData.errors?.map((e) => `${e.field}: ${e.message}`).join('; ') ||
          'Falha ao atualizar alguns campos.';
        showError(errorMessages);
      }
    } catch (err) {
      showError(`Erro ao atualizar torneio: ${err.response?.data?.message || err.message}`);
    }
  };

  const cardBaseClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" message="Carregando dados do torneio..." />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FaExclamationTriangle className="mx-auto text-5xl text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-300">Erro ao Carregar Torneio</h2>
        <p className="text-slate-400 mt-2">
          {error || 'Não foi possível carregar o torneio para edição.'}
        </p>
        <button
          onClick={() => navigate('/admin/tournaments')}
          className={`${primaryButtonClasses} mt-6`}
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Prepare initial values for the form from the fetched tournament data
  const initialValues = {
    name: tournament.name || '',
    date: tournament.date ? new Date(tournament.date).toISOString().split('T')[0] : '', // Format for date input
    description: tournament.description || '',
    numPlayersExpected: tournament.num_players_expected || 32,
    bracket_type: tournament.bracket_type || 'single-elimination',
    entry_fee: tournament.entry_fee || '',
    prize_pool: tournament.prize_pool || '',
    rules: tournament.rules || '',
    status: tournament.status || 'Pendente', // Include status if editable via this form
    // playersFile: null, // Not typically edited this way
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={`Editar Torneio: ${tournament.name}`}
          icon={FaEdit}
          iconColor="text-lime-400"
        />
        <div className={cardBaseClasses}>
          <TournamentForm initialValues={initialValues} onSubmit={handleSubmit} isEditing={true} />
        </div>
      </div>
    </div>
  );
};

export default EditTournamentPage;
