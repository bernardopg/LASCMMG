import { useState, useEffect, useCallback } from 'react';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useMessage } from '../../../context/MessageContext';
import { updateUserProfile, getUserProfile } from '../../../services/api';
import * as Yup from 'yup';

const UserProfile = ({ userId, onClose, isModal = false }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { user: currentUser, hasPermission } = useAuth();
  const { showMessage } = useMessage();

  const userSchema = Yup.object().shape({
    username: Yup.string()
      .required('Nome de usuário é obrigatório')
      .min(3, 'Mínimo 3 caracteres')
      .max(50, 'Máximo 50 caracteres'),
    email: Yup.string()
      .email('Email inválido')
      .required('Email é obrigatório')
      .max(100, 'Máximo 100 caracteres'),
    first_name: Yup.string()
      .required('Nome é obrigatório')
      .min(2, 'Mínimo 2 caracteres')
      .max(50, 'Máximo 50 caracteres'),
    last_name: Yup.string()
      .required('Sobrenome é obrigatório')
      .min(2, 'Mínimo 2 caracteres')
      .max(50, 'Máximo 50 caracteres'),
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserProfile(userId || currentUser?.id);
      setUser(response.user);
      setFormData({
        username: response.user.username || '',
        email: response.user.email || '',
        first_name: response.user.first_name || '',
        last_name: response.user.last_name || '',
      });
    } catch {
      showMessage('Erro ao carregar perfil do usuário', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id, showMessage]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await userSchema.validate(formData, { abortEarly: false });
      setErrors({});

      setSaving(true);
      await updateUserProfile(userId || currentUser?.id, formData);

      showMessage('Perfil atualizado com sucesso!', 'success');
      setEditing(false);
      fetchUserProfile();
    } catch (error) {
      if (error.inner) {
        const validationErrors = {};
        error.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else {
        showMessage('Erro ao atualizar perfil', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    });
  };

  const canEdit = hasPermission('admin') || currentUser?.id === (userId || currentUser?.id);

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="bg-slate-900 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <FaUser className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-100">
            {editing ? 'Editar Perfil' : 'Perfil do Usuário'}
          </h2>
        </div>

        <div className="flex gap-2">
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FaTimes className="w-4 h-4" />
              Fechar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome de Usuário
            </label>
            {editing ? (
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-slate-600'
                }`}
              />
            ) : (
              <p className="text-slate-100 py-2">{user?.username || 'Não informado'}</p>
            )}
            {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                }`}
              />
            ) : (
              <p className="text-slate-100 py-2">{user?.email || 'Não informado'}</p>
            )}
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome
            </label>
            {editing ? (
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-500' : 'border-slate-600'
                }`}
              />
            ) : (
              <p className="text-slate-100 py-2">{user?.first_name || 'Não informado'}</p>
            )}
            {errors.first_name && <p className="text-red-400 text-sm mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sobrenome
            </label>
            {editing ? (
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-500' : 'border-slate-600'
                }`}
              />
            ) : (
              <p className="text-slate-100 py-2">{user?.last_name || 'Não informado'}</p>
            )}
            {errors.last_name && <p className="text-red-400 text-sm mt-1">{errors.last_name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Função
          </label>
          <p className="text-slate-100 py-2">{user?.role || 'Usuário'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Data de Cadastro
          </label>
          <div className="flex items-center gap-2 text-slate-100 py-2">
            <FaCalendarAlt className="w-4 h-4 text-slate-400" />
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('pt-BR')
              : 'Não informado'
            }
          </div>
        </div>

        {editing && (
          <div className="flex gap-4 pt-6 border-t border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSave className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <FaTimes className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default UserProfile;
