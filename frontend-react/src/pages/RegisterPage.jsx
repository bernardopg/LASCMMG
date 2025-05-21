import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // To potentially redirect if already logged in
import ThemeContext from '../context/ThemeContext'; // For styling consistency

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme } = React.useContext(ThemeContext);
  const [serverError, setServerError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redirect if already logged in
    }
  }, [isAuthenticated, navigate]);

  const initialValues = {
    username: '',
    password: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, 'Usuário deve ter pelo menos 3 caracteres')
      .max(30, 'Usuário não pode ter mais de 30 caracteres')
      .matches(/^[a-zA-Z0-9]+$/, 'Usuário deve ser alfanumérico')
      .required('Usuário é obrigatório'),
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
    setServerError('');
    try {
      const response = await api.post('/users/register', {
        username: values.username,
        password: values.password,
      });
      // Handle successful registration
      // e.g., show success message and redirect to login
      alert(
        response.data.message || 'Registro bem-sucedido! Por favor, faça login.'
      );
      resetForm();
      navigate('/login');
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Falha no registro. Tente novamente.');
      }
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
                  htmlFor="username"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Usuário
                </label>
                <Field
                  type="text"
                  name="username"
                  id="username"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.username && touched.username
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white placeholder-gray-400'
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <ErrorMessage
                  name="username"
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
