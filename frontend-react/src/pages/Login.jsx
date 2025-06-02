import { Form, Formik } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/auth/FormField';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { loginUser as loginAdminUser, loginRegularUser } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();
  const { showError, showSuccess } = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('user');

  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Email é obrigatório'),
    password: Yup.string().required('Senha é obrigatória'),
    rememberMe: Yup.boolean(),
  });

  const initialValues = {
    email: '',
    password: '',
    rememberMe: false,
  };

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
      navigate(loginType === 'admin' ? '/admin' : '/');
    } catch (error) {
      console.error('Erro no login:', error);
      showError(error.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

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
            <div className="flex rounded-lg p-1 bg-slate-700">
              <button
                type="button"
                onClick={() => setLoginType('user')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'user'
                    ? 'bg-slate-800 text-lime-400'
                    : 'text-gray-400 hover:text-lime-400'
                }`}
              >
                Usuário
              </button>
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'admin'
                    ? 'bg-slate-800 text-lime-400'
                    : 'text-gray-400 hover:text-lime-400'
                }`}
              >
                Administrador
              </button>
            </div>

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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe}
                  onChange={(e) => setFieldValue('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-slate-600 rounded bg-slate-700"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300">
                  Lembrar-me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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
                  <LockIcon className="h-5 w-5 mr-2" />
                  Entrar {loginType === 'admin' ? 'como Admin' : ''}
                </>
              )}
            </button>

            {loginType === 'admin' && (
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-sm text-slate-300 text-center">
                  Acesso administrativo ao sistema
                </p>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default Login;
