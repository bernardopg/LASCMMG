import { fetchApi } from '../api/apiService.js';

async function criarTorneiosExemplo() {
  const torneios = [
    {
      name: 'Copa Ouro 2025',
      date: '2025-06-10',
      description: 'Torneio anual de sinuca - Ouro',
      numPlayers: 8,
      type: 'single-elimination',
      entry_fee: 50,
      prize_pool: 'R$ 1000 + Troféu',
      rules: 'Regulamento oficial CBBS',
    },
    {
      name: 'Desafio Prata 2025',
      date: '2025-07-15',
      description: 'Desafio regional de sinuca - Prata',
      numPlayers: 16,
      type: 'double-elimination',
      entry_fee: 30,
      prize_pool: 'R$ 500 + Medalhas',
      rules: 'Regras adaptadas para duplas',
    },
    {
      name: 'Open Bronze 2025',
      date: '2025-08-20',
      description: 'Aberto de sinuca - Bronze',
      numPlayers: 8,
      type: 'single-elimination',
      entry_fee: 20,
      prize_pool: 'R$ 200 + Medalha',
      rules: 'Regulamento simplificado',
    },
  ];

  for (const t of torneios) {
    try {
      const res = await fetchApi('/tournaments/create', {
        method: 'POST',
        body: t,
      });
      console.log('[Torneio criado]', res);
    } catch (e) {
      console.error('[Erro ao criar torneio]', t.name, e);
    }
  }
}

window.criarTorneiosExemplo = criarTorneiosExemplo;
console.log(
  'Função window.criarTorneiosExemplo pronta para uso. Execute criarTorneiosExemplo() no console.'
);

// Executa automaticamente após login (quando o token está disponível)
function waitForTokenAndCreate() {
  const token = sessionStorage.getItem('adminSessionToken');
  if (token) {
    criarTorneiosExemplo();
  } else {
    setTimeout(waitForTokenAndCreate, 1000);
  }
}
waitForTokenAndCreate();
