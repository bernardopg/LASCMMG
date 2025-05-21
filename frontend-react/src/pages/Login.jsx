import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError, showSuccess } = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar a visibilidade da senha
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Função para calcular a força da senha
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Critérios de força
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  // Esquema de validação com Yup
  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email inválido')
      .required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .matches(/[a-z]/, 'Deve conter uma letra minúscula')
      .matches(/[A-Z]/, 'Deve conter uma letra maiúscula')
      .matches(/[0-9]/, 'Deve conter um número')
      .matches(/[!@#$%^&*]/, 'Deve conter um caractere especial')
      .required('Senha é obrigatória'),
    // Campo honeypot para proteção contra bots
    botField: Yup.string().test(
      'is-empty',
      'Bot detectado',
      (value) => !value
    ),
  });

  // Valores iniciais
  const initialValues = {
    email: '',
    password: '',
    rememberMe: false, // Adicionado para controlar o checkbox
    botField: '', // Campo honeypot que deve permanecer vazio
  };

  // Função de submit do formulário
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password, values.rememberMe); // Passou rememberMe para login
      showSuccess('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      showError(
        error.response?.data?.message || // Priorizar mensagem do backend
        error.message || // Mensagem de erro do JS (ex: rede)
        'Falha na autenticação. Verifique suas credenciais.' // Fallback
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 p-4 sm:p-8 bg-white dark:bg-slate-800 shadow-xl rounded-xl">
        <div className="text-center">
          <img
            className="mx-auto h-16 sm:h-20 w-auto"
            src="/assets/logo-removebg.png"
            alt="LASCMMG Logo"
          />
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Login - LASCMMG
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sistema de gerenciamento de torneios da Liga Academica de Sinuca -
            CMMG
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="mt-8 space-y-6">
              {/* Removed -space-y-px to allow space for labels */}
              <div className="rounded-md shadow-sm">
                <div className="mb-4">
                  {' '}
                  {/* Added margin for spacing */}
                  <label htmlFor="email" className="label mb-1">
                    {' '}
                    {/* Changed htmlFor and text to email */}{' '}
                    {/* Use .label class */}
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email" // Changed name to email
                    type="email" // Changed type to email
                    autoComplete="email" // Changed autoComplete
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.email && touched.email // Changed to email
                      ? 'border-red-500 text-red-700 dark:text-red-400 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:ring-primary focus:border-primary dark:bg-slate-700'
                      } rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="Endereço de email" // Changed placeholder
                  />
                  <ErrorMessage
                    name="email" // Changed to email
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                </div>
                <div className="mb-4">
                  {' '}
                  {/* Added margin for spacing */}
                  <label htmlFor="password" className="label mb-1">
                    {' '}
                    {/* Use .label class */}
                    Senha
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.password && touched.password
                        ? 'border-red-500 text-red-700 dark:text-red-400 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:ring-primary focus:border-primary dark:bg-slate-700'
                        } rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                      placeholder="Senha"
                      onChange={(e) => {
                        setFieldValue('password', e.target.value);
                        setPassword(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />

                  {password && (
                    <div className="mt-1">
                      <div className="flex items-center mb-1">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div
                            className={`h-2 rounded-full ${passwordStrength === 0 ? 'bg-red-500 w-0' :
                              passwordStrength === 1 ? 'bg-red-500 w-1/5' :
                                passwordStrength === 2 ? 'bg-yellow-500 w-2/5' :
                                  passwordStrength === 3 ? 'bg-yellow-500 w-3/5' :
                                    passwordStrength === 4 ? 'bg-green-500 w-4/5' :
                                      'bg-green-500 w-full'
                              }`}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {passwordStrength === 0 && 'Senha muito fraca'}
                        {passwordStrength === 1 && 'Senha fraca'}
                        {passwordStrength === 2 && 'Senha razoável'}
                        {passwordStrength === 3 && 'Senha média'}
                        {passwordStrength === 4 && 'Senha forte'}
                        {passwordStrength === 5 && 'Senha muito forte'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campo honeypot - invisível para usuários humanos, mas bots podem preenchê-lo */}
              <div className="hidden" aria-hidden="true">
                <Field
                  id="botField"
                  name="botField"
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Field
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                  >
                    Lembrar-me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${(isSubmitting || isLoading) &&
                    'opacity-70 cursor-not-allowed'
                    }`}
                >
                  {isLoading || isSubmitting ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  {isLoading || isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                LASCMMG &copy; {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
          >
            Crie uma agora
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
