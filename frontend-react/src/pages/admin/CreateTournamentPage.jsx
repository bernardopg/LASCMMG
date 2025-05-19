import React from 'react';
import TournamentForm from '../../components/admin/TournamentForm';
import { useMessage } from '../../context/MessageContext';
// import { createTournamentAdmin } from '../../services/api'; // To be used later
// import { useNavigate } from 'react-router-dom';

const CreateTournamentPage = () => {
  const { showMessage } = useMessage();
  // const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log('Valores do formulário para criar torneio:', values);
    showMessage('Simulando criação de torneio...', 'info');
    // TODO: Implementar chamada à API createTournamentAdmin(values)
    // try {
    //   const response = await createTournamentAdmin(values);
    //   showMessage('Torneio criado com sucesso!', 'success');
    //   resetForm();
    //   navigate(`/admin/tournaments/${response.tournament.id}`); // Ou para a lista de torneios
    // } catch (error) {
    //   showMessage(`Erro ao criar torneio: ${error.message || 'Erro desconhecido'}`, 'error');
    // } finally {
    //   setSubmitting(false);
    // }
    setTimeout(() => { // Simulação de delay da API
      setSubmitting(false);
      showMessage('Criação de torneio simulada com sucesso (implementar API).', 'success');
      // resetForm(); // Descomentar quando a API estiver integrada
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Criar Novo Torneio</h1>
        <div className="card p-6 md:p-8">
          <TournamentForm onSubmit={handleSubmit} isEditing={false} />
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
