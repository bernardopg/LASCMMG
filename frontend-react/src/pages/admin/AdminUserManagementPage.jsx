import React, { useEffect, useState, useCallback } from 'react';
import { useMessage } from '../../context/MessageContext';
import { getAdminUsers, createAdminUser } from '../../services/api';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUsers, FaPlusCircle, FaUserShield, FaSpinner } from 'react-icons/fa';

const NewAdminSchema = Yup.object().shape({
  username: Yup.string() // This will be treated as an email by the backend
    .email('Deve ser um email válido')
    .required('Email (para username) é obrigatório')
    .max(100, 'Email muito longo'), // Max length for email
  password: Yup.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .matches(/[a-z]/, 'Deve conter uma letra minúscula')
    .matches(/[A-Z]/, 'Deve conter uma letra maiúscula')
    .matches(/[0-9]/, 'Deve conter um número')
    .matches(/[!@#$%^&*]/, 'Deve conter um caractere especial')
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'As senhas não correspondem')
    .required('Confirmação de senha é obrigatória'),
  // role: Yup.string().required("Role is required").oneOf(['admin', 'super_admin'], 'Invalid role'), // If role selection is needed
});

const AdminUserManagementPage = () => {
  const { showError, showSuccess } = useMessage();
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdminUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setAdminUsers(data.users || []);
    } catch (err) {
      showError(`Erro ao buscar administradores: ${err.response?.data?.message || err.message}`);
      setAdminUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const handleCreateAdmin = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      // The backend createAdmin in adminModel currently defaults role to 'admin'.
      // If specific roles like 'super_admin' are needed, the backend model/route needs adjustment.
      const payload = {
        username: values.username,
        password: values.password,
        // role: values.role, // If role is part of the form
      };
      const response = await createAdminUser(payload);
      showSuccess(response.message || 'Administrador criado com sucesso!');
      resetForm();
      fetchAdminUsers(); // Refresh the list
    } catch (err) {
      showError(`Erro ao criar administrador: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center">
        <FaUserShield className="mr-3 text-primary dark:text-primary-light" />
        Gerenciamento de Administradores
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Lista de Administradores
            </h2>
            {loadingUsers ? (
              <div className="flex justify-center items-center py-10">
                <FaSpinner className="animate-spin text-3xl text-primary" />
              </div>
            ) : adminUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum administrador encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Último Login</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Criado Em</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {adminUsers.map(admin => (
                      <tr key={admin.id}>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{admin.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{admin.role}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(admin.last_login)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(admin.created_at)}</td>
                        {/* Add actions like edit/delete if needed */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <FaPlusCircle className="mr-2 text-primary dark:text-primary-light" />
              Criar Novo Administrador
            </h2>
            <Formik
              initialValues={{ username: '', password: '', confirmPassword: '' /* role: 'admin' */ }}
              validationSchema={NewAdminSchema}
              onSubmit={handleCreateAdmin}
            >
              {({ errors, touched, isValid, dirty }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="username" className="label">Email (para Username)</label>
                    <Field type="email" name="username" id="username" placeholder="exemplo@admin.com" className={`input mt-1 ${errors.username && touched.username ? 'border-danger' : ''}`} />
                    <ErrorMessage name="username" component="div" className="error-message" />
                  </div>
                  <div>
                    <label htmlFor="password" className="label">Senha</label>
                    <Field type="password" name="password" id="password" className={`input mt-1 ${errors.password && touched.password ? 'border-danger' : ''}`} />
                    <ErrorMessage name="password" component="div" className="error-message" />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
                    <Field type="password" name="confirmPassword" id="confirmPassword" className={`input mt-1 ${errors.confirmPassword && touched.confirmPassword ? 'border-danger' : ''}`} />
                    <ErrorMessage name="confirmPassword" component="div" className="error-message" />
                  </div>
                  {/* Add role selection if backend supports it and it's desired
                  <div>
                    <label htmlFor="role" className="label">Role</label>
                    <Field as="select" name="role" id="role" className={`input mt-1 ${errors.role && touched.role ? 'border-danger' : ''}`}>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </Field>
                    <ErrorMessage name="role" component="div" className="error-message" />
                  </div>
                  */}
                  <div className="pt-2">
                    <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || !isValid || !dirty}>
                      {isSubmitting ? 'Criando...' : 'Criar Administrador'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
