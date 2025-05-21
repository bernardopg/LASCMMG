import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { createPlayerAdmin } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaUserPlus, FaSave, FaTimes } from 'react-icons/fa';

const PlayerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .required('Nome é obrigatório'),
  nickname: Yup.string()
    .max(50, 'Apelido muito longo'),
  email: Yup.string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  gender: Yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido').nullable(),
  skill_level: Yup.string().oneOf(['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], 'Nível inválido').nullable(),
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

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
        <FaUserPlus className="mr-3 text-primary dark:text-primary-light" />
        Adicionar Novo Jogador Global
      </h1>
      <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
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
                <label htmlFor="name" className="label">Nome Completo</label>
                <Field type="text" name="name" id="name" className={`input mt-1 ${errors.name && touched.name ? 'input-error' : ''}`} />
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>

              <div>
                <label htmlFor="nickname" className="label">Apelido (Opcional)</label>
                <Field type="text" name="nickname" id="nickname" className={`input mt-1 ${errors.nickname && touched.nickname ? 'input-error' : ''}`} />
                <ErrorMessage name="nickname" component="div" className="error-message" />
              </div>

              <div>
                <label htmlFor="email" className="label">Email (Opcional)</label>
                <Field type="email" name="email" id="email" className={`input mt-1 ${errors.email && touched.email ? 'input-error' : ''}`} />
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gender" className="label">Gênero (Opcional)</label>
                  <Field as="select" name="gender" id="gender" className={`input mt-1 ${errors.gender && touched.gender ? 'input-error' : ''}`}>
                    <option value="">Não especificado</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </Field>
                  <ErrorMessage name="gender" component="div" className="error-message" />
                </div>
                <div>
                  <label htmlFor="skill_level" className="label">Nível de Habilidade (Opcional)</label>
                  <Field as="select" name="skill_level" id="skill_level" className={`input mt-1 ${errors.skill_level && touched.skill_level ? 'input-error' : ''}`}>
                    <option value="">Não especificado</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Profissional">Profissional</option>
                  </Field>
                  <ErrorMessage name="skill_level" component="div" className="error-message" />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/players')}
                  className="btn btn-secondary flex items-center"
                  disabled={isSubmitting}
                >
                  <FaTimes className="mr-2" /> Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={isSubmitting || !isValid || !dirty}
                >
                  <FaSave className="mr-2" />
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
