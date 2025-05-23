import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { registerRegularUser } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/auth/FormField';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

/**
 * Página de Registro refatorada com melhor UX/UI e validação de senha
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showError, showSuccess } = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  // Redirecionamento se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Esquema de validação
  const RegisterSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email inválido')
      .required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .matches(/[a-z]/, 'Deve conter uma letra minúscula')
      .matches(/[A-Z]/, 'Deve conter uma letra maiúscula')
      .matches(/[0-9]/, 'Deve conter um número')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Deve conter um caractere especial')
      .required('Senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'As senhas devem ser iguais')
      .required('Confirmação de senha é obrigatória'),
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
    confirmPassword: '',
    botField: '',
  };

  // Função de submit
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);

      const responseData = await registerRegularUser({
        username: values.email,
        password: values.password,
      });

      if (responseData.success) {
        showSuccess(responseData.message || 'Registro realizado com sucesso! Por favor, faça login.');
        resetForm();
        navigate('/login');
      } else {
        showError(responseData.message || 'Falha no registro. Tente novamente.');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Falha no registro. Tente novamente.';
      showError(message);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Ícones para os campos
  const EmailIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  const LockIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const ShieldIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  return (
    <AuthLayout
      title="Criar Nova Conta"
      subtitle="Registre-se para participar dos torneios"
      alternativeText="Já tem uma conta?"
      alternativeLink="/login"
      alternativeLinkText="Faça login"
      maxWidth="md"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={RegisterSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, setFieldValue }) => (
          <Form className="space-y-6">
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
            <div>
              <FormField
                name="password"
                label="Senha"
                type="password"
                placeholder="Crie uma senha forte"
                required
                showPasswordToggle
                icon={LockIcon}
                errors={errors}
                touched={touched}
                onChange={(e) => {
                  setFieldValue('password', e.target.value);
                  setCurrentPassword(e.target.value);
                }}
              />

              {/* Indicador de força da senha */}
              <PasswordStrengthIndicator
                password={currentPassword}
                showDetails={true}
              />
            </div>

            {/* Campo de Confirmação de Senha */}
            <FormField
              name="confirmPassword"
              label="Confirmar Senha"
              type="password"
              placeholder="Digite a senha novamente"
              required
              showPasswordToggle
              icon={ShieldIcon}
              errors={errors}
              touched={touched}
            />

            {/* Campo honeypot - invisível */}
            <div className="hidden" aria-hidden="true">
              <FormField
                name="botField"
                type="text"
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

            {/* Informações sobre os dados */}
            <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Proteção de Dados
                  </h3>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Seus dados são protegidos e criptografados</li>
                      <li>Usamos apenas para gestão de torneios</li>
                      <li>Nunca compartilhamos informações pessoais</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                group relative w-full flex justify-center py-3 px-4
                border border-transparent text-sm font-medium rounded-lg
                text-white bg-gradient-to-r from-green-600 to-emerald-600
                hover:from-green-700 hover:to-emerald-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                shadow-lg hover:shadow-xl
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Criando conta...
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </span>
                  Criar Conta
                </>
              )}
            </button>

            {/* Informação sobre termos */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ao criar uma conta, você concorda com os{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  onClick={() => {
                    // TODO: Implementar modal de termos de uso
                    showError('Termos de uso em desenvolvimento');
                  }}
                >
                  termos de uso
                </button>{' '}
                e{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  onClick={() => {
                    // TODO: Implementar modal de política de privacidade
                    showError('Política de privacidade em desenvolvimento');
                  }}
                >
                  política de privacidade
                </button>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default RegisterPage;
