import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { FaKey, FaSave, FaUserCircle } from 'react-icons/fa';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import api from '../services/api'; // For direct API call

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
  const { currentUser, updateCurrentUser } = useAuth(); // Usando currentUser do AuthContext
  const { showSuccess, showError } = useMessage();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  if (!currentUser) {
    return (
      <div className="px-4 py-8 text-center"> {/* Removed container mx-auto */}
        <p>Carregando informações do usuário...</p>
      </div>
    );
  }

  const handlePasswordChange = async (values, { resetForm }) => {
    setIsSubmittingPassword(true);
    try {
      // The API expects username, currentPassword, newPassword
      const payload = {
        username: currentUser.username, // Get username from the authenticated user context
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };
      // API endpoint is /api/change-password as per backend/routes/auth.js
      const response = await api.post('/api/change-password', payload);
      showSuccess(response.data.message || 'Senha alterada com sucesso!');
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Erro ao alterar senha.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Meu Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Information Section */}
        <div className="md:col-span-1">
          <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <FaUserCircle className="text-5xl text-primary dark:text-primary-light mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-1">
              {currentUser.name || currentUser.username}
            </h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
              Role: {currentUser.role}
            </p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p><strong>Username:</strong> {currentUser.username}</p>
              {/* Add more user details here if available and desired */}
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="md:col-span-2">
          <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
              <FaKey className="mr-3 text-primary dark:text-primary-light" />
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
                    <label
                      htmlFor="currentPassword"
                      className="label"
                    >
                      Senha Atual
                    </label>
                    <Field
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className={`input ${errors.currentPassword && touched.currentPassword ? 'border-danger' : ''}`}
                    />
                    <ErrorMessage
                      name="currentPassword"
                      component="div"
                      className="error-message"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="label"
                    >
                      Nova Senha
                    </label>
                    <Field
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className={`input ${errors.newPassword && touched.newPassword ? 'border-danger' : ''}`}
                    />
                    <ErrorMessage
                      name="newPassword"
                      component="div"
                      className="error-message"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmNewPassword"
                      className="label"
                    >
                      Confirmar Nova Senha
                    </label>
                    <Field
                      type="password"
                      name="confirmNewPassword"
                      id="confirmNewPassword"
                      className={`input ${errors.confirmNewPassword && touched.confirmNewPassword ? 'border-danger' : ''}`}
                    />
                    <ErrorMessage
                      name="confirmNewPassword"
                      component="div"
                      className="error-message"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary w-full md:w-auto"
                      disabled={isSubmittingPassword || !isValid || !dirty}
                    >
                      <FaSave className="mr-2" />
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
