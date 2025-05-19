import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

// Páginas públicas
import Home from '../pages/Home';
import Login from '../pages/Login';
import Chaveamento from '../pages/Chaveamento';
import Placares from '../pages/Placares';
import Estatisticas from '../pages/Estatisticas';
import Jogadores from '../pages/Jogadores';
import Busca from '../pages/Busca';
import PaginaNaoEncontrada from '../pages/PaginaNaoEncontrada';

// Páginas administrativas
import Dashboard from '../pages/admin/Dashboard';
import TorneiosList from '../pages/admin/TorneiosList';
import TorneioForm from '../pages/admin/TorneioForm';
import JogadoresList from '../pages/admin/JogadoresList';
import JogadorForm from '../pages/admin/JogadorForm';
import PartidasList from '../pages/admin/PartidasList';
import PartidaForm from '../pages/admin/PartidaForm';
import Configuracoes from '../pages/admin/Configuracoes';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Se estiver carregando, exibe uma tela de loading
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza o componente filho
  return children;
};

// Componente para rotas que exigem permissão de admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  // Se estiver carregando, exibe uma tela de loading
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Se não estiver autenticado ou não for admin, redireciona
  if (!isAuthenticated() || !hasRole('admin')) {
    return <Navigate to="/" replace />;
  }

  // Se for admin, renderiza o componente filho
  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Rota raiz */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        {/* Rotas públicas */}
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/chaveamento"
          element={
            <Layout>
              <Chaveamento />
            </Layout>
          }
        />
        <Route
          path="/placares"
          element={
            <Layout>
              <Placares />
            </Layout>
          }
        />
        <Route
          path="/estatisticas"
          element={
            <Layout>
              <Estatisticas />
            </Layout>
          }
        />
        <Route
          path="/jogadores"
          element={
            <Layout>
              <Jogadores />
            </Layout>
          }
        />
        <Route
          path="/busca"
          element={
            <Layout>
              <Busca />
            </Layout>
          }
        />

        {/* Rota de logout - redireciona para a home */}
        <Route path="/logout" element={<Navigate to="/" replace />} />

        {/* Rotas administrativas protegidas */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/torneios"
          element={
            <AdminRoute>
              <Layout>
                <TorneiosList />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/torneios/novo"
          element={
            <AdminRoute>
              <Layout>
                <TorneioForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/torneios/:id"
          element={
            <AdminRoute>
              <Layout>
                <TorneioForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jogadores"
          element={
            <AdminRoute>
              <Layout>
                <JogadoresList />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jogadores/novo"
          element={
            <AdminRoute>
              <Layout>
                <JogadorForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jogadores/:id"
          element={
            <AdminRoute>
              <Layout>
                <JogadorForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/partidas"
          element={
            <AdminRoute>
              <Layout>
                <PartidasList />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/partidas/nova"
          element={
            <AdminRoute>
              <Layout>
                <PartidaForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/partidas/:id"
          element={
            <AdminRoute>
              <Layout>
                <PartidaForm />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/configuracoes"
          element={
            <AdminRoute>
              <Layout>
                <Configuracoes />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Rota para página não encontrada */}
        <Route
          path="*"
          element={
            <Layout>
              <PaginaNaoEncontrada />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
