import { FaChartBar, FaSitemap, FaTachometerAlt, FaTrophy, FaUsers } from 'react-icons/fa';

export const navigationItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: FaTachometerAlt,
    description: 'Visão geral do sistema e estatísticas principais',
  },
  {
    name: 'Torneios',
    path: '/tournaments',
    icon: FaTrophy,
    description: 'Gerenciar e visualizar torneios',
  },
  {
    name: 'Jogadores',
    path: '/players',
    icon: FaUsers,
    description: 'Cadastro e gerenciamento de jogadores',
  },
  {
    name: 'Chaves',
    path: '/brackets',
    icon: FaSitemap,
    description: 'Visualizar e gerenciar chaves dos torneios',
  },
  {
    name: 'Estatísticas',
    path: '/stats',
    icon: FaChartBar,
    description: 'Relatórios e análises detalhadas',
  },
];
