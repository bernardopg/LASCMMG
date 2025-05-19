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
    <aside className="w-64 bg-gray-800 text-gray-100 min-h-screen p-4 space-y-2 flex flex-col">
      <div className="sidebar-header mb-6">
        <h1 className="text-xl font-semibold">Segurança</h1>
      </div>
      <nav className="flex-grow">
        {securityMenuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                        ${isActive(item.path) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-gray-700">
        <Link
          to="/admin"
          className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
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
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSecuritySidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Header for Admin Security Section */}
        {/* <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Painel de Segurança</h1>
        </header> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminSecurityLayout;
