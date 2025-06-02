import { useCallback, memo } from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

const TournamentSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Nome muito curto! Mínimo de 3 caracteres.')
    .max(100, 'Nome muito longo! Máximo de 100 caracteres.')
    .required('Nome do torneio é obrigatório'),
  date: Yup.date()
    .required('Data é obrigatória')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Data não pode ser no passado'),
  description: Yup.string()
    .max(1000, 'Descrição muito longa! Máximo de 1000 caracteres.')
    .nullable(),
  bracket_type: Yup.string()
    .required('Tipo de chaveamento é obrigatório')
    .oneOf(
      ['single-elimination', 'double-elimination', 'round-robin'],
      'Tipo de chaveamento inválido'
    ),
  numPlayersExpected: Yup.number()
    .min(2, 'Mínimo de 2 jogadores')
    .integer('Deve ser um número inteiro')
    .typeError('Número de jogadores deve ser um número válido')
    .nullable(),
  status: Yup.string()
    .required('Status é obrigatório')
    .oneOf(['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'], 'Status inválido'),
  entry_fee: Yup.number()
    .min(0, 'Taxa de inscrição não pode ser negativa')
    .typeError('Taxa de inscrição deve ser um número válido')
    .nullable(),
  prize_pool: Yup.string().max(255, 'Premiação muito longa! Máximo de 255 caracteres.').nullable(),
  rules: Yup.string().max(2000, 'Regras muito longas! Máximo de 2000 caracteres.').nullable(),
});

const TournamentForm = memo(({ initialValues, onSubmit, isEditing = false, onCancel }) => {
  const navigate = useNavigate();

  const defaultInitialValues = {
    name: '',
    date: '',
    description: '',
    bracket_type: 'single-elimination',
    numPlayersExpected: '',
    entry_fee: '',
    prize_pool: '',
    rules: '',
    status: 'Pendente',
  };

  const processedInitialValues = initialValues
    ? {
        ...defaultInitialValues,
        ...initialValues,
        date: initialValues.date ? new Date(initialValues.date).toISOString().split('T')[0] : '',
        numPlayersExpected: initialValues.numPlayersExpected?.toString() || '',
        entry_fee: initialValues.entry_fee?.toString() || '',
      }
    : defaultInitialValues;

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  }, [onCancel, navigate]);

  const handleSubmit = useCallback(
    (values, actions) => {
      const submissionValues = {
        ...values,
        numPlayersExpected:
          values.numPlayersExpected !== '' ? Number(values.numPlayersExpected) : null,
        entry_fee: values.entry_fee !== '' ? Number(values.entry_fee) : null,
      };
      onSubmit(submissionValues, actions);
    },
    [onSubmit]
  );

  const getBracketTypeLabel = (value) => {
    const labels = {
      'single-elimination': 'Eliminatória Simples',
      'double-elimination': 'Dupla Eliminação',
      'round-robin': 'Todos contra Todos (Round Robin)',
    };
    return labels[value] || value;
  };

  const getStatusLabel = (value) => {
    const labels = {
      Pendente: 'Pendente',
      'Em Andamento': 'Em Andamento',
      Concluído: 'Concluído',
      Cancelado: 'Cancelado',
    };
    return labels[value] || value;
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-100">
          {isEditing ? 'Editar Torneio' : 'Criar Novo Torneio'}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isEditing
            ? 'Atualize as informações do torneio abaixo'
            : 'Preencha as informações para criar um novo torneio'}
        </p>
      </div>

      <Formik
        initialValues={processedInitialValues}
        validationSchema={TournamentSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, dirty, isValid, errors, touched, values }) => {
          const inputBaseClasses =
            'block w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-colors duration-200';
          const inputErrorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
          const labelClasses = 'block text-sm font-medium text-slate-300 mb-1';
          const errorMessageClasses = 'mt-1 text-xs text-red-400';

          const getFieldClassName = (fieldName) =>
            `${inputBaseClasses} ${errors[fieldName] && touched[fieldName] ? inputErrorClasses : ''}`;

          return (
            <Form className="space-y-6">
              {/* Nome do Torneio */}
              <div>
                <label htmlFor="name" className={labelClasses}>
                  Nome do Torneio *
                </label>
                <Field
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Ex: Campeonato dos Calouros 2025"
                  className={getFieldClassName('name')}
                />
                <ErrorMessage name="name" component="div" className={errorMessageClasses} />
              </div>

              {/* Data do Torneio */}
              <div>
                <label htmlFor="date" className={labelClasses}>
                  Data do Torneio *
                </label>
                <Field type="date" name="date" id="date" className={getFieldClassName('date')} />
                <ErrorMessage name="date" component="div" className={errorMessageClasses} />
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="description" className={labelClasses}>
                  Descrição
                </label>
                <Field
                  as="textarea"
                  name="description"
                  id="description"
                  rows="3"
                  placeholder="Detalhes sobre o torneio, localização, etc."
                  className={getFieldClassName('description')}
                />
                <ErrorMessage name="description" component="div" className={errorMessageClasses} />
              </div>

              {/* Grid para campos menores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Chaveamento */}
                <div>
                  <label htmlFor="bracket_type" className={labelClasses}>
                    Tipo de Chaveamento *
                  </label>
                  <Field
                    as="select"
                    name="bracket_type"
                    id="bracket_type"
                    className={getFieldClassName('bracket_type')}
                  >
                    <option value="single-elimination">Eliminatória Simples</option>
                    <option value="double-elimination">Dupla Eliminação</option>
                    <option value="round-robin">Todos contra Todos (Round Robin)</option>
                  </Field>
                  <ErrorMessage
                    name="bracket_type"
                    component="div"
                    className={errorMessageClasses}
                  />
                </div>

                {/* Nº Esperado de Jogadores */}
                <div>
                  <label htmlFor="numPlayersExpected" className={labelClasses}>
                    Nº Esperado de Jogadores
                  </label>
                  <Field
                    type="number"
                    name="numPlayersExpected"
                    id="numPlayersExpected"
                    placeholder="Ex: 32"
                    min="2"
                    className={getFieldClassName('numPlayersExpected')}
                  />
                  <ErrorMessage
                    name="numPlayersExpected"
                    component="div"
                    className={errorMessageClasses}
                  />
                </div>

                {/* Status do Torneio */}
                <div>
                  <label htmlFor="status" className={labelClasses}>
                    Status do Torneio *
                  </label>
                  <Field
                    as="select"
                    name="status"
                    id="status"
                    className={getFieldClassName('status')}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </Field>
                  <ErrorMessage name="status" component="div" className={errorMessageClasses} />
                </div>

                {/* Taxa de Inscrição */}
                <div>
                  <label htmlFor="entry_fee" className={labelClasses}>
                    Taxa de Inscrição (R$)
                  </label>
                  <Field
                    type="number"
                    step="0.01"
                    name="entry_fee"
                    id="entry_fee"
                    placeholder="Ex: 10.00"
                    min="0"
                    className={getFieldClassName('entry_fee')}
                  />
                  <ErrorMessage name="entry_fee" component="div" className={errorMessageClasses} />
                </div>
              </div>

              {/* Premiação */}
              <div>
                <label htmlFor="prize_pool" className={labelClasses}>
                  Premiação
                </label>
                <Field
                  type="text"
                  name="prize_pool"
                  id="prize_pool"
                  placeholder="Ex: Medalhas para os 3 primeiros + R$100 para o campeão"
                  className={getFieldClassName('prize_pool')}
                />
                <ErrorMessage name="prize_pool" component="div" className={errorMessageClasses} />
              </div>

              {/* Regras */}
              <div>
                <label htmlFor="rules" className={labelClasses}>
                  Regras
                </label>
                <Field
                  as="textarea"
                  name="rules"
                  id="rules"
                  rows="4"
                  placeholder="Descreva as regras específicas do torneio"
                  className={getFieldClassName('rules')}
                />
                <ErrorMessage name="rules" component="div" className={errorMessageClasses} />
              </div>

              {/* Preview Card */}
              {values.name && (
                <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-200 mb-2">Preview do Torneio:</h3>
                  <div className="text-sm text-slate-400 space-y-1">
                    <p>
                      <span className="text-slate-300 font-medium">Nome:</span> {values.name}
                    </p>
                    {values.date && (
                      <p>
                        <span className="text-slate-300 font-medium">Data:</span>{' '}
                        {new Date(values.date).toLocaleDateString()}
                      </p>
                    )}
                    <p>
                      <span className="text-slate-300 font-medium">Chaveamento:</span>{' '}
                      {getBracketTypeLabel(values.bracket_type)}
                    </p>
                    <p>
                      <span className="text-slate-300 font-medium">Status:</span>{' '}
                      {getStatusLabel(values.status)}
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaTimes className="mr-2 h-4 w-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !dirty || !isValid}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-lime-600 hover:bg-lime-700 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? isEditing
                      ? 'Salvando...'
                      : 'Criando...'
                    : isEditing
                      ? 'Salvar Alterações'
                      : 'Criar Torneio'}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
});

TournamentForm.displayName = 'TournamentForm';

export default TournamentForm;
