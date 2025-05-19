import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MdOutlineSecurity,
  MdOutlineBugReport,
  MdOutlineAnalytics,
  MdBlock,
  MdArrowBack,
} from 'react-icons/md';

// Placeholder for security-specific sidebar items
const securityMenuItems = [
  {
    name: 'Visão Geral',
    path: '/admin/security',
    icon: <MdOutlineSecurity className="w-5 h-5" />,
  },
  {
    name: 'Honeypots',
    path: '/admin/security/honeypots',
    icon: <MdOutlineBugReport className="w-5 h-5" />,
  },
  {
    name: 'Análise de Ameaças',
    path: '/admin/security/threat-analytics',
    icon: <MdOutlineAnalytics className="w-5 h-5" />,
  },
  {
    name: 'IPs Bloqueados',
    path: '/admin/security/blocked-ips',
    icon: <MdBlock className="w-5 h-5" />,
  },
];

const AdminSecuritySidebar = () => {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path ||
    (path === '/admin/security' &&
      location.pathname.startsWith('/admin/security/'));

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 min-h-screen p-4 space-y-2 flex flex-col border-r border-gray-200 dark:border-slate-700">
      <div className="sidebar-header mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Segurança</h1>
      </div>
      <nav className="flex-grow">
        {securityMenuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                        ${isActive(item.path)
                          ? 'bg-primary-light dark:bg-primary-dark text-primary dark:text-white' // Active classes
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white' // Inactive classes
                        }`}
          >
            <span className={`mr-3 ${isActive(item.path) ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-slate-700">
        <Link
          to="/admin"
          className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
        >
          <MdArrowBack className="w-5 h-5 mr-3" />
          Voltar ao Admin
        </Link>
        {/* Logout button can be added here if needed */}
      </div>
    </aside>
  );
};

const AdminSecurityLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900"> {/* Adjusted main bg for consistency */}
      <AdminSecuritySidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Header for Admin Security Section - ensure it's theme-aware if uncommented */}
        {/* <header className="bg-white dark:bg-slate-800 shadow-sm p-4 border-b dark:border-slate-700">
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Painel de Segurança</h1>
        </header> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6"> {/* Removed redundant bg, inherits from parent */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminSecurityLayout;
