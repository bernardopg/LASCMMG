import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { FaSave, FaSpinner, FaTimes, FaUserEdit } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles
import { useMessage } from '../../context/MessageContext';
import { getPlayerDetails, updatePlayerAdmin } from '../../services/api';

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

const EditPlayerPage = () => {
  const { id: playerId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlayerDetails(playerId);
      if (data.player) {
        setInitialValues({
          name: data.player.name || '',
          nickname: data.player.nickname || '',
          email: data.player.email || '',
          gender: data.player.gender || '',
          skill_level: data.player.skill_level || '',
        });
      } else {
        showError('Jogador não encontrado.');
        navigate('/admin/players');
      }
    } catch (err) {
      showError(`Erro ao carregar dados do jogador: ${err.response?.data?.message || err.message}`);
      navigate('/admin/players');
    } finally {
      setLoading(false);
    }
  }, [playerId, showError, navigate]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        nickname: values.nickname || null,
        email: values.email || null,
        gender: values.gender || null,
        skill_level: values.skill_level || null,
      };
      await updatePlayerAdmin(playerId, payload);
      showSuccess('Jogador atualizado com sucesso!');
      navigate('/admin/players');
    } catch (err) {
      showError(`Erro ao atualizar jogador: ${err.response?.data?.message || err.message}`);
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

  if (loading || !initialValues) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" message="Carregando dados do jogador..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Editar Jogador Global" icon={FaUserEdit} iconColor="text-lime-400" />
      <div className={cardBaseClasses}>
        <Formik
          initialValues={initialValues}
          validationSchema={PlayerSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Important to reinitialize form when initialValues change
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditPlayerPage;
