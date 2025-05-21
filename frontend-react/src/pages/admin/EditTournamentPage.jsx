import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TournamentForm from '../../components/admin/TournamentForm';
import { getTournamentDetails, updateTournamentAdmin } from '../../services/api'; // updateTournamentAdmin needs to be created
import { useMessage } from '../../context/MessageContext';
import { FaSpinner } from 'react-icons/fa';

const EditTournamentPage = () => {
  const { tournamentId } = useParams();
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
      // Ensure updateTournamentAdmin can handle the formData structure
      // It might need to make multiple PATCH calls or one PUT call
      // For now, assuming a single call that updates all editable fields.
      const updatedData = await updateTournamentAdmin(tournamentId, formData);
      showSuccess('Torneio atualizado com sucesso!');
      navigate('/admin/tournaments'); // Redirect to tournament list
    } catch (err) {
      showError(`Erro ao atualizar torneio: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-3 text-lg">Carregando dados do torneio...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="px-4 py-8 text-center"> {/* Removed container mx-auto */}
        <h2 className="text-2xl font-semibold text-red-600">Erro</h2>
        <p>{error || 'Não foi possível carregar o torneio para edição.'}</p>
        <button onClick={() => navigate('/admin/tournaments')} className="btn btn-primary mt-4">
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
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Editar Torneio: {tournament.name}
      </h1>
      <TournamentForm
        initialData={initialValues}
        onSubmit={handleSubmit}
        isEditMode={true}
      />
    </div>
  );
};

export default EditTournamentPage;
