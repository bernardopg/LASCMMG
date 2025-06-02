import { memo } from 'react';
import {
  MdArrowBack,
  MdBlock,
  MdOutlineAnalytics,
  MdOutlineBugReport,
  MdOutlineSecurity,
} from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';

const securityMenuItems = [
  {
    name: 'Visão Geral',
    path: '/admin/security',
    icon: MdOutlineSecurity,
    description: 'Visão geral do painel de segurança',
  },
  {
    name: 'Honeypots',
    path: '/admin/security/honeypots',
    icon: MdOutlineBugReport,
    description: 'Gerenciar honeypots de segurança',
  },
  {
    name: 'Análise de Ameaças',
    path: '/admin/security/threat-analytics',
    icon: MdOutlineAnalytics,
    description: 'Análise e monitoramento de ameaças',
  },
  {
    name: 'IPs Bloqueados',
    path: '/admin/security/blocked-ips',
    icon: MdBlock,
    description: 'Gerenciar IPs bloqueados',
  },
];

const AdminSecuritySidebar = memo(() => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin/security') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="w-64 bg-slate-800 text-slate-200 min-h-screen flex flex-col border-r border-slate-700"
      role="navigation"
      aria-label="Menu de segurança"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-semibold text-white">Painel de Segurança</h1>
        <p className="text-sm text-slate-400 mt-1">Administração e monitoramento</p>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-2" aria-label="Navegação de segurança">
        {securityMenuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-slate-800
                         ${
                           active
                             ? 'bg-amber-600 text-white shadow-lg border border-amber-500'
                             : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 border border-transparent'
                         }`}
              aria-label={`${item.name} - ${item.description}`}
              title={item.description}
              aria-current={active ? 'page' : undefined}
            >
              <IconComponent
                className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 mt-auto">
        <Link
          to="/admin"
          className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-300
                     hover:bg-slate-700 hover:text-white transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-slate-800
                     border border-transparent hover:border-slate-600"
          aria-label="Voltar ao painel administrativo principal"
        >
          <MdArrowBack className="w-5 h-5 mr-3 text-slate-400" aria-hidden="true" />
          Voltar ao Admin
        </Link>
      </div>
    </aside>
  );
});

AdminSecuritySidebar.displayName = 'AdminSecuritySidebar';

const AdminSecurityLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <AdminSecuritySidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Header */}
        <header className="bg-slate-800 shadow-sm border-b border-slate-700">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold text-slate-200">Administração de Segurança</h1>
            <p className="text-sm text-slate-400 mt-1">
              Gerencie configurações de segurança, monitore ameaças e configure proteções
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto p-6 bg-slate-50"
          role="main"
          aria-label="Conteúdo principal do painel de segurança"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

AdminSecurityLayout.displayName = 'AdminSecurityLayout';

export default AdminSecurityLayout;
