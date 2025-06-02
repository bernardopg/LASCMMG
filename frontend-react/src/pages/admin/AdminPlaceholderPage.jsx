import { useLocation } from 'react-router-dom';

const AdminPlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop().replace('-', ' ');
  const capitalizedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold text-gray-100 mb-4">
        {capitalizedPageName || 'Página Administrativa'}
      </h1>
      <p className="text-lg text-gray-300">
        Esta funcionalidade está em desenvolvimento e estará disponível em breve.
      </p>
    </div>
  );
};

export default AdminPlaceholderPage;
