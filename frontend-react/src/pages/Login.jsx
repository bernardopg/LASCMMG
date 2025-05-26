import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { loginRegularUser, loginUser as loginAdminUser } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/auth/FormField';

/**
 * Página de Login refatorada com melhor UX/UI e responsividade
 */
const Login = () => {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();
  const { showError, showSuccess } = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'user' ou 'admin'

  // Esquema de validação
  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .required('Senha é obrigatória'),
    rememberMe: Yup.boolean(),
    // Campo honeypot para proteção contra bots
    botField: Yup.string().test('is-empty', 'Bot detectado', (value) => !value),
  });

  // Valores iniciais
  const initialValues = {
    email: '',
    password: '',
    rememberMe: false,
    botField: '',
  };

  // Função de submit
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoading(true);

      const loginApiFunc = loginType === 'admin' ? loginAdminUser : loginRegularUser;
      const credentials = {
        username: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      };

      await authContextLogin(loginApiFunc, credentials, values.rememberMe);
      showSuccess('Login realizado com sucesso!');

      // Redirecionamento baseado no tipo de login
      navigate(loginType === 'admin' ? '/admin' : '/');
    } catch (error) {
      console.error('Erro no login:', error);
      showError(error.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Ícones para os campos
  const EmailIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
      />
    </svg>
  );

  const LockIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  return (
    <AuthLayout
      title="Entrar no Sistema"
      subtitle="Acesse sua conta para gerenciar torneios"
      alternativeText="Não tem uma conta?"
      alternativeLink="/register"
      alternativeLinkText="Crie uma agora"
      maxWidth="md"
    >
      <Formik initialValues={initialValues} validationSchema={LoginSchema} onSubmit={handleSubmit}>
        {({ errors, touched, values, setFieldValue }) => (
          <Form className="space-y-6">
            {/* Seletor de tipo de login */}
            <div className="flex rounded-lg p-1 bg-gray-100 dark:bg-slate-700">
              <button
                type="button"
                onClick={() => setLoginType('user')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === 'user'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Usuário
              </button>
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Administrador
              </button>
            </div>

            {/* Campo de Email */}
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              required
              icon={EmailIcon}
              errors={errors}
              touched={touched}
            />

            {/* Campo de Senha */}
            <FormField
              name="password"
              label="Senha"
              type="password"
              placeholder="Sua senha"
              required
              showPasswordToggle
              icon={LockIcon}
              errors={errors}
              touched={touched}
            />

            {/* Campo honeypot - invisível */}
            <div className="hidden" aria-hidden="true">
              <FormField name="botField" type="text" tabIndex="-1" autoComplete="off" />
            </div>

            {/* Opções adicionais */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe}
                  onChange={(e) => setFieldValue('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                  onClick={() => {
                    // TODO: Implementar modal de recuperação de senha
                    showError('Funcionalidade em desenvolvimento');
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </div>

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                group relative w-full flex justify-center py-3 px-4
                border border-transparent text-sm font-medium rounded-lg
                text-white bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                shadow-lg hover:shadow-xl
              `}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <LockIcon className="h-5 w-5 text-white opacity-75" />
                  </span>
                  Entrar {loginType === 'admin' ? 'como Admin' : ''}
                </>
              )}
            </button>

            {/* Informação adicional para admin */}
            {loginType === 'admin' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Acesso Administrativo
                    </h3>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      <p>Você está fazendo login como administrador do sistema.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default Login;
