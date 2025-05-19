import React from 'react';

/**
 * Página de Configurações (Admin)
 * Permite ajustar configurações globais do sistema, preferências do usuário admin, e integrações futuras.
 * Integração futura: endpoints de configurações, preferências, integrações externas.
 */
const SettingsPage = () => {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Configurações (Admin)</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Esta página permitirá o ajuste de configurações globais do sistema, preferências do usuário administrador e integrações futuras.
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400">
          <li>Configurações de tema, idioma e notificações.</li>
          <li>Preferências de exibição e acessibilidade.</li>
          <li>Integração com serviços externos (ex: Sentry, Google Analytics).</li>
          <li>Gerenciamento de tokens de API e credenciais.</li>
        </ul>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <strong>Em breve:</strong> Integração com a API real e UI completa.
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
