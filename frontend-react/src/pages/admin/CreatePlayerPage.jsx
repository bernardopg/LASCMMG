import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { createPlayerAdmin } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaUserPlus, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles

const PlayerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .required('Nome é obrigatório'),
  nickname: Yup.string().max(50, 'Apelido muito longo'),
  email: Yup.string().email('Email inválido').max(100, 'Email muito longo'),
  gender: Yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido').nullable(),
  skill_level: Yup.string()
    .oneOf(['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], 'Nível inválido')
    .nullable(),
});

const CreatePlayerPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      // Ensure payload matches what createGlobalPlayer expects
      // playerModel.createGlobalPlayer expects { name, nickname, email, gender, skill_level }
      // For now, only implementing name, nickname, email.
      const payload = {
        name: values.name,
        nickname: values.nickname || null,
        email: values.email || null,
        gender: values.gender || null,
        skill_level: values.skill_level || null,
        // ipAddress could be added here if needed by backend for auditing, but usually handled by backend from request
      };
      await createPlayerAdmin(payload);
      showSuccess('Jogador criado com sucesso!');
      resetForm();
      navigate('/admin/players'); // Or stay on page to add more
    } catch (err) {
      showError(`Erro ao criar jogador: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBaseClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';
  const inputBaseClasses =
    'block w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-slate-100';
  const inputErrorClasses = 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500';
  const labelClasses = 'block text-sm font-medium text-slate-300';
  const errorMessageClasses = 'mt-1 text-xs text-red-400';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const secondaryButtonClasses = `${buttonBaseClasses} bg-slate-600 hover:bg-slate-500 text-slate-100 focus:ring-slate-400`;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Adicionar Novo Jogador Global"
        icon={FaUserPlus}
        iconColor="text-lime-400"
      />

      <div className={cardBaseClasses}>
        <Formik
          initialValues={{
            name: '',
            nickname: '',
            email: '',
            gender: '',
            skill_level: '',
          }}
          validationSchema={PlayerSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isValid, dirty }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="name" className={labelClasses}>
                  Nome Completo
                </label>
                <Field
                  type="text"
                  name="name"
                  id="name"
                  className={`${inputBaseClasses} ${errors.name && touched.name ? inputErrorClasses : 'border-slate-600'}`}
                />
                <ErrorMessage name="name" component="div" className={errorMessageClasses} />
              </div>

              <div>
                <label htmlFor="nickname" className={labelClasses}>
                  Apelido (Opcional)
                </label>
                <Field
                  type="text"
                  name="nickname"
                  id="nickname"
                  className={`${inputBaseClasses} ${errors.nickname && touched.nickname ? inputErrorClasses : 'border-slate-600'}`}
                />
                <ErrorMessage name="nickname" component="div" className={errorMessageClasses} />
              </div>

              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email (Opcional)
                </label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  className={`${inputBaseClasses} ${errors.email && touched.email ? inputErrorClasses : 'border-slate-600'}`}
                />
                <ErrorMessage name="email" component="div" className={errorMessageClasses} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gender" className={labelClasses}>
                    Gênero (Opcional)
                  </label>
                  <Field
                    as="select"
                    name="gender"
                    id="gender"
                    className={`${inputBaseClasses} ${errors.gender && touched.gender ? inputErrorClasses : 'border-slate-600'}`}
                  >
                    <option value="" className="bg-slate-700">
                      Não especificado
                    </option>
                    <option value="Masculino" className="bg-slate-700">
                      Masculino
                    </option>
                    <option value="Feminino" className="bg-slate-700">
                      Feminino
                    </option>
                    <option value="Outro" className="bg-slate-700">
                      Outro
                    </option>
                  </Field>
                  <ErrorMessage name="gender" component="div" className={errorMessageClasses} />
                </div>
                <div>
                  <label htmlFor="skill_level" className={labelClasses}>
                    Nível de Habilidade (Opcional)
                  </label>
                  <Field
                    as="select"
                    name="skill_level"
                    id="skill_level"
                    className={`${inputBaseClasses} ${errors.skill_level && touched.skill_level ? inputErrorClasses : 'border-slate-600'}`}
                  >
                    <option value="" className="bg-slate-700">
                      Não especificado
                    </option>
                    <option value="Iniciante" className="bg-slate-700">
                      Iniciante
                    </option>
                    <option value="Intermediário" className="bg-slate-700">
                      Intermediário
                    </option>
                    <option value="Avançado" className="bg-slate-700">
                      Avançado
                    </option>
                    <option value="Profissional" className="bg-slate-700">
                      Profissional
                    </option>
                  </Field>
                  <ErrorMessage
                    name="skill_level"
                    component="div"
                    className={errorMessageClasses}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/players')}
                  className={secondaryButtonClasses}
                  disabled={isSubmitting}
                >
                  <FaTimes className="mr-2 h-4 w-4" /> Cancelar
                </button>
                <button
                  type="submit"
                  className={primaryButtonClasses}
                  disabled={isSubmitting || !isValid || !dirty}
                >
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <FaSave className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Salvando...' : 'Salvar Jogador'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreatePlayerPage;
