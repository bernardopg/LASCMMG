import { ErrorMessage, Field, Form, Formik } from 'formik';
import { FaSave, FaTimes } from 'react-icons/fa';
import * as Yup from 'yup';

const TournamentSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Nome muito curto! Mínimo de 3 caracteres.')
    .max(100, 'Nome muito longo! Máximo de 100 caracteres.')
    .required('Nome do torneio é obrigatório'),
  date: Yup.date()
    .required('Data é obrigatória')
    .min(
      new Date(new Date().setHours(0, 0, 0, 0)), // Define a hora para o início do dia atual
      'Data não pode ser no passado'
    ),
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

const TournamentForm = ({ initialValues, onSubmit, isEditing = false }) => {
  const defaultInitialValues = {
    name: '',
    date: '', // Será formatado para YYYY-MM-DD pelo input type="date"
    description: '',
    bracket_type: 'single-elimination',
    numPlayersExpected: '', // Alterado para string vazia para melhor controle do placeholder
    entry_fee: '', // Alterado para string vazia
    prize_pool: '',
    rules: '',
    status: 'Pendente',
  };

  // Formata a data para YYYY-MM-DD se estiver presente no initialValues (para edição)
  const processedInitialValues = initialValues
    ? {
        ...defaultInitialValues,
        ...initialValues,
        date: initialValues.date ? new Date(initialValues.date).toISOString().split('T')[0] : '',
        // Garante que números sejam strings vazias se forem null/undefined para placeholders
        numPlayersExpected: initialValues.numPlayersExpected?.toString() || '',
        entry_fee: initialValues.entry_fee?.toString() || '',
      }
    : defaultInitialValues;

  return (
    <Formik
      initialValues={processedInitialValues}
      validationSchema={TournamentSchema}
      onSubmit={(values, actions) => {
        // Converte campos numéricos de volta para números antes de submeter
        const submissionValues = {
          ...values,
          numPlayersExpected:
            values.numPlayersExpected !== '' ? Number(values.numPlayersExpected) : null,
          entry_fee: values.entry_fee !== '' ? Number(values.entry_fee) : null,
        };
        onSubmit(submissionValues, actions);
      }}
      enableReinitialize
    >
      {({ isSubmitting, dirty, isValid, errors, touched /* values */ }) => (
        <Form className="space-y-6">
          {/* Nome do Torneio */}
          <div>
            <label htmlFor="name" className="label">
              <span className="label-text">Nome do Torneio</span>
            </label>
            <Field
              type="text"
              name="name"
              id="name"
              placeholder="Ex: Campeonato dos Calouros 2025"
              className={`input input-bordered w-full mt-1 ${errors.name && touched.name ? 'input-error' : ''}`}
            />
            <ErrorMessage name="name" component="div" className="error-message" />
          </div>

          {/* Data do Torneio */}
          <div>
            <label htmlFor="date" className="label">
              <span className="label-text">Data do Torneio</span>
            </label>
            <Field
              type="date"
              name="date"
              id="date"
              className={`input input-bordered w-full mt-1 ${errors.date && touched.date ? 'input-error' : ''}`}
            />
            <ErrorMessage name="date" component="div" className="error-message" />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="label">
              <span className="label-text">Descrição (Opcional)</span>
            </label>
            <Field
              as="textarea"
              name="description"
              id="description"
              rows="3"
              placeholder="Detalhes sobre o torneio, localização, etc."
              className={`input input-bordered w-full mt-1 ${errors.description && touched.description ? 'input-error' : ''}`}
            />
            <ErrorMessage name="description" component="div" className="error-message" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Tipo de Chaveamento */}
            <div>
              <label htmlFor="bracket_type" className="label">
                <span className="label-text">Tipo de Chaveamento</span>
              </label>
              <Field
                as="select"
                name="bracket_type"
                id="bracket_type"
                className={`input input-bordered w-full mt-1 ${errors.bracket_type && touched.bracket_type ? 'input-error' : ''}`}
              >
                <option value="single-elimination">Eliminatória Simples</option>
                <option value="double-elimination">Dupla Eliminação</option>
                <option value="round-robin">Todos contra Todos (Round Robin)</option>
              </Field>
              <ErrorMessage name="bracket_type" component="div" className="error-message" />
            </div>

            {/* Nº Esperado de Jogadores */}
            <div>
              <label htmlFor="numPlayersExpected" className="label">
                <span className="label-text">Nº Esperado de Jogadores (Opcional)</span>
              </label>
              <Field
                type="number"
                name="numPlayersExpected"
                id="numPlayersExpected"
                placeholder="Ex: 32"
                className={`input input-bordered w-full mt-1 ${errors.numPlayersExpected && touched.numPlayersExpected ? 'input-error' : ''}`}
              />
              <ErrorMessage name="numPlayersExpected" component="div" className="error-message" />
            </div>

            {/* Status do Torneio */}
            <div>
              <label htmlFor="status" className="label">
                <span className="label-text">Status do Torneio</span>
              </label>
              <Field
                as="select"
                name="status"
                id="status"
                className={`input input-bordered w-full mt-1 ${errors.status && touched.status ? 'input-error' : ''}`}
                disabled={!isEditing && initialValues?.status !== undefined} // Desabilita se não estiver editando E um status inicial já existe (para não sobrescrever o default 'Pendente' na criação)
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </Field>
              <ErrorMessage name="status" component="div" className="error-message" />
            </div>

            {/* Taxa de Inscrição */}
            <div>
              <label htmlFor="entry_fee" className="label">
                <span className="label-text">Taxa de Inscrição (R$) (Opcional)</span>
              </label>
              <Field
                type="number"
                step="0.01"
                name="entry_fee"
                id="entry_fee"
                placeholder="Ex: 10.00"
                className={`input input-bordered w-full mt-1 ${errors.entry_fee && touched.entry_fee ? 'input-error' : ''}`}
              />
              <ErrorMessage name="entry_fee" component="div" className="error-message" />
            </div>
          </div>

          {/* Premiação */}
          <div>
            <label htmlFor="prize_pool" className="label">
              <span className="label-text">Premiação (Opcional)</span>
            </label>
            <Field
              type="text"
              name="prize_pool"
              id="prize_pool"
              placeholder="Ex: Medalhas para os 3 primeiros + R$100 para o campeão"
              className={`input input-bordered w-full mt-1 ${errors.prize_pool && touched.prize_pool ? 'input-error' : ''}`}
            />
            <ErrorMessage name="prize_pool" component="div" className="error-message" />
          </div>

          {/* Regras */}
          <div>
            <label htmlFor="rules" className="label">
              <span className="label-text">Regras (Opcional)</span>
            </label>
            <Field
              as="textarea"
              name="rules"
              id="rules"
              rows="5"
              placeholder="Descreva as regras específicas do torneio"
              className={`input input-bordered w-full mt-1 ${errors.rules && touched.rules ? 'input-error' : ''}`}
            />
            <ErrorMessage name="rules" component="div" className="error-message" />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary flex items-center"
              disabled={isSubmitting}
            >
              <FaTimes className="mr-2" /> Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isSubmitting || !dirty || !isValid}
            >
              <FaSave className="mr-2" />
              {isSubmitting
                ? isEditing
                  ? 'Salvando Alterações...'
                  : 'Criando Torneio...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Criar Torneio'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default TournamentForm;
