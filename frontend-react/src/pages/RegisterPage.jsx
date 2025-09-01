import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { AuthLayout, FormField } from '../components/features/auth';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { registerRegularUser } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showError, showSuccess } = useMessage();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const RegisterSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .required('Senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'As senhas devem ser iguais')
      .required('Confirmação de senha é obrigatória'),
  });

  const initialValues = {
    email: '',
    password: '',
    confirmPassword: '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);

      const responseData = await registerRegularUser({
        username: values.email,
        password: values.password,
      });

      if (responseData.success) {
        showSuccess('Registro realizado com sucesso! Por favor, faça login.');
        resetForm();
        navigate('/login');
      } else {
        showError(responseData.message || 'Falha no registro. Tente novamente.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Falha no registro. Tente novamente.';
      showError(message);
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

  const ShieldIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
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
        {({ errors, touched }) => (
          <Form className="space-y-6">
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
              placeholder="Crie uma senha forte"
              required
              showPasswordToggle
              icon={LockIcon}
              errors={errors}
              touched={touched}
            />

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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                  Criando conta...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Criar Conta
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default RegisterPage;
