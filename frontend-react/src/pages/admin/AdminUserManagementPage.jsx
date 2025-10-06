import React, { useEffect, useState, useCallback } from 'react';
import { useMessage } from '../../context/MessageContext';
import { getAdminUsers, createAdminUser } from '../../services/api';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUsers, FaPlusCircle, FaUserShield, FaSpinner } from 'react-icons/fa';
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles

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

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const inputBaseClasses =
    'block w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-slate-100';
  const inputErrorClasses = 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500';
  const labelClasses = 'block text-sm font-medium text-slate-300';
  const errorMessageClasses = 'mt-1 text-xs text-red-400';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Gerenciamento de Administradores"
        icon={FaUserShield}
        iconColor="text-lime-400"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className={cardBaseClasses}>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
              <FaUsers className="mr-3 h-5 w-5 text-lime-400" />
              Lista de Administradores
            </h2>
            {loadingUsers ? (
              <div className="flex justify-center items-center py-10">
                <LoadingSpinner message="Carregando administradores..." />
              </div>
            ) : adminUsers.length === 0 ? (
              <p className="text-slate-400">Nenhum administrador encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Criado Em
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {adminUsers.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-sm text-slate-100">{admin.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{admin.role}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {formatDate(admin.last_login)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {formatDate(admin.created_at)}
                        </td>
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
          <div className={cardBaseClasses}>
            <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center">
              <FaPlusCircle className="mr-3 h-5 w-5 text-lime-400" />
              Criar Novo Administrador
            </h2>
            <Formik
              initialValues={{
                username: '',
                password: '',
                confirmPassword: '' /* role: 'admin' */,
              }}
              validationSchema={NewAdminSchema}
              onSubmit={handleCreateAdmin}
            >
              {({ errors, touched, isValid, dirty }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="username" className={labelClasses}>
                      Email (para Username)
                    </label>
                    <Field
                      type="email"
                      name="username"
                      id="username"
                      placeholder="exemplo@admin.com"
                      className={`${inputBaseClasses} ${errors.username && touched.username ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage name="username" component="div" className={errorMessageClasses} />
                  </div>
                  <div>
                    <label htmlFor="password" className={labelClasses}>
                      Senha
                    </label>
                    <Field
                      type="password"
                      name="password"
                      id="password"
                      className={`${inputBaseClasses} ${errors.password && touched.password ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage name="password" component="div" className={errorMessageClasses} />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className={labelClasses}>
                      Confirmar Senha
                    </label>
                    <Field
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className={`${inputBaseClasses} ${errors.confirmPassword && touched.confirmPassword ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className={errorMessageClasses}
                    />
                  </div>
                  {/* Add role selection if backend supports it and it's desired
                  <div>
                    <label htmlFor="role" className={labelClasses}>Role</label>
                    <Field as="select" name="role" id="role" className={`${inputBaseClasses} ${errors.role && touched.role ? inputErrorClasses : 'border-slate-600'}`}>
                      <option value="admin" className="bg-slate-700">Admin</option>
                      <option value="super_admin" className="bg-slate-700">Super Admin</option>
                    </Field>
                    <ErrorMessage name="role" component="div" className={errorMessageClasses} />
                  </div>
                  */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className={`${primaryButtonClasses} w-full`}
                      disabled={isSubmitting || !isValid || !dirty}
                    >
                      {isSubmitting ? (
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                      ) : (
                        <FaPlusCircle className="mr-2 h-4 w-4" />
                      )}
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
