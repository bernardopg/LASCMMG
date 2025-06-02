import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { FaKey, FaSave, FaSpinner, FaUserCircle } from 'react-icons/fa'; // Added FaSpinner
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
// Import specific API functions
import { changePassword as changeAdminPassword, changeRegularUserPassword } from '../services/api';

const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Senha atual é obrigatória'),
  newPassword: Yup.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .matches(/[a-z]/, 'Deve conter uma letra minúscula')
    .matches(/[A-Z]/, 'Deve conter uma letra maiúscula')
    .matches(/[0-9]/, 'Deve conter um número')
    .matches(/[!@#$%^&*]/, 'Deve conter um caractere especial')
    .required('Nova senha é obrigatória'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'As senhas não correspondem')
    .required('Confirmação da nova senha é obrigatória'),
});

const ProfilePage = () => {
  const { currentUser } = useAuth(); // updateCurrentUser is not used
  const { showSuccess, showError } = useMessage();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  if (!currentUser) {
    return (
      <div className="px-4 py-8 text-center">
        <p>Carregando informações do usuário...</p>
      </div>
    );
  }

  const handlePasswordChange = async (values, { resetForm }) => {
    setIsSubmittingPassword(true);
    try {
      let responseData;
      if (currentUser.role === 'admin') {
        // Admin password change
        responseData = await changeAdminPassword({
          // changePassword from api.js maps to /api/change-password (admin)
          username: currentUser.username, // Admin route expects username
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      } else {
        // Regular user password change
        responseData = await changeRegularUserPassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }

      if (responseData.success) {
        showSuccess(responseData.message || 'Senha alterada com sucesso!');
        resetForm();
      } else {
        // If API call resolves but indicates failure
        showError(responseData.message || 'Erro ao alterar senha.');
      }
    } catch (err) {
      // Catches errors thrown by the API service functions (e.g., network error, non-2xx response)
      showError(err.response?.data?.message || err.message || 'Erro ao alterar senha.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const inputBaseClasses =
    'block w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500';
  const inputErrorClasses = 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500';
  const labelClasses = 'block text-sm font-medium text-slate-300';
  const errorMessageClasses = 'mt-1 text-xs text-red-400';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-10 text-center sm:text-left">
        Meu Perfil
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Information Section */}
        <div className="lg:col-span-1">
          <div className={cardBaseClasses}>
            <FaUserCircle className="text-6xl sm:text-7xl text-lime-400 mx-auto mb-5" />
            <h2 className="text-2xl font-semibold text-center text-gray-100 mb-1">
              {currentUser.name || currentUser.username}
            </h2>
            <p className="text-sm text-center text-slate-400 mb-6 capitalize">{currentUser.role}</p>
            <div className="text-sm text-slate-300 space-y-2 border-t border-slate-700 pt-4">
              <p>
                <strong>Username/Email:</strong> {currentUser.username}
              </p>
              {/* TODO: Add more user details here if available and desired, e.g., registration date */}
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="lg:col-span-2">
          <div className={cardBaseClasses}>
            <h2 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
              <FaKey className="mr-3 text-lime-400 h-5 w-5" />
              Alterar Senha
            </h2>
            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
              }}
              validationSchema={ChangePasswordSchema}
              onSubmit={handlePasswordChange}
            >
              {({ errors, touched, isValid, dirty }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className={labelClasses}>
                      Senha Atual
                    </label>
                    <Field
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className={`${inputBaseClasses} ${errors.currentPassword && touched.currentPassword ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage
                      name="currentPassword"
                      component="div"
                      className={errorMessageClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className={labelClasses}>
                      Nova Senha
                    </label>
                    <Field
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className={`${inputBaseClasses} ${errors.newPassword && touched.newPassword ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage
                      name="newPassword"
                      component="div"
                      className={errorMessageClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmNewPassword" className={labelClasses}>
                      Confirmar Nova Senha
                    </label>
                    <Field
                      type="password"
                      name="confirmNewPassword"
                      id="confirmNewPassword"
                      className={`${inputBaseClasses} ${errors.confirmNewPassword && touched.confirmNewPassword ? inputErrorClasses : 'border-slate-600'}`}
                    />
                    <ErrorMessage
                      name="confirmNewPassword"
                      component="div"
                      className={errorMessageClasses}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className={`${primaryButtonClasses} w-full sm:w-auto`}
                      disabled={isSubmittingPassword || !isValid || !dirty}
                    >
                      {isSubmittingPassword ? (
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                      ) : (
                        <FaSave className="mr-2 h-4 w-4" />
                      )}
                      {isSubmittingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
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

export default ProfilePage;
