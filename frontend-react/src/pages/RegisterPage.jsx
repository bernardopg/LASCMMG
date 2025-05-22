import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { registerRegularUser } from '../services/api'; // Import the specific API function
import { useAuth } from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { useMessage } from '../context/MessageContext'; // For consistent messages

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme } = React.useContext(ThemeContext);
  const { showError, showSuccess } = useMessage(); // Use MessageContext
  const [serverError, setServerError] = useState(''); // Kept for direct form error

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const initialValues = {
    email: '', // Changed from username to email
    password: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string() // Changed from username to email
      .email('Email inválido')
      .required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .matches(/[a-z]/, 'Deve conter uma letra minúscula')
      .matches(/[A-Z]/, 'Deve conter uma letra maiúscula')
      .matches(/[0-9]/, 'Deve conter um número')
      .matches(/[!@#$%^&*]/, 'Deve conter um caractere especial')
      .required('Senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'As senhas devem ser iguais')
      .required('Confirmação de senha é obrigatória'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setServerError(''); // Clear previous server errors shown directly on form
    try {
      // Use the specific API function from services/api.js
      const responseData = await registerRegularUser({
        username: values.email, // Send email as username
        password: values.password,
      });

      if (responseData.success) {
        showSuccess(responseData.message || 'Registro bem-sucedido! Por favor, faça login.');
        resetForm();
        navigate('/login');
      } else {
        // If registerRegularUser resolves but indicates failure (e.g. {success: false, message: ...})
        const message = responseData.message || 'Falha no registro. Tente novamente.';
        showError(message); // Use MessageContext for consistency
        setServerError(message); // Also set local serverError if needed for specific form display
      }
    } catch (error) {
      // This catches errors thrown by registerRegularUser (e.g., network errors, or if it throws on non-2xx)
      const message = error.response?.data?.message || error.message || 'Falha no registro. Tente novamente.';
      showError(message);
      setServerError(message);
    }
    setSubmitting(false);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'} p-4`}
    >
      <div
        className={`w-full max-w-md p-8 space-y-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl`}
      >
        <h2
          className={`text-3xl font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          Criar Conta
        </h2>
        {serverError && (
          <div
            className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
            role="alert"
          >
            {serverError}
          </div>
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              <div>
                <label
                  htmlFor="email" // Changed from username to email
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Email
                </label>
                <Field
                  type="email" // Changed from text to email
                  name="email"   // Changed from username to email
                  id="email"     // Changed from username to email
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email && touched.email // Changed from username to email
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white placeholder-gray-400'
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="seu@email.com" // Added placeholder
                />
                <ErrorMessage
                  name="email" // Changed from username to email
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Senha
                </label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.password && touched.password
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white placeholder-gray-400'
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Confirmar Senha
                </label>
                <Field
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white placeholder-gray-400'
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
        <p
          className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-light hover:text-primary"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
