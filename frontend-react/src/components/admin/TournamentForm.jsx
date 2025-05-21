import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaSave } from 'react-icons/fa';

const TournamentSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Nome muito curto!')
    .max(100, 'Nome muito longo!')
    .required('Nome do torneio é obrigatório'),
  date: Yup.date()
    .required('Data é obrigatória')
    .min(new Date(), 'Data não pode ser no passado'), // Basic past date check
  description: Yup.string().max(1000, 'Descrição muito longa!'),
  bracket_type: Yup.string()
    .required('Tipo de chaveamento é obrigatório')
    .oneOf(
      ['single-elimination', 'double-elimination', 'round-robin'],
      'Tipo inválido'
    ),
  numPlayersExpected: Yup.number()
    .min(2, 'Mínimo de 2 jogadores')
    .integer('Deve ser um número inteiro')
    .typeError('Deve ser um número'),
  status: Yup.string().oneOf(
    ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'],
    'Status inválido'
  ),
  entry_fee: Yup.number()
    .min(0, 'Taxa não pode ser negativa')
    .typeError('Deve ser um número'),
  prize_pool: Yup.string().max(255, 'Premiação muito longa!'),
  rules: Yup.string().max(2000, 'Regras muito longas!'),
});

const TournamentForm = ({ initialValues, onSubmit, isEditing = false }) => {
  const defaultInitialValues = {
    name: '',
    date: '',
    description: '',
    bracket_type: 'single-elimination',
    numPlayersExpected: 32,
    entry_fee: 0,
    prize_pool: '',
    rules: '',
    status: 'Pendente', // Default status for new tournaments
  };

  return (
    <Formik
      initialValues={initialValues || defaultInitialValues}
      validationSchema={TournamentSchema}
      onSubmit={onSubmit}
      enableReinitialize // Important if initialValues can change (e.g., for editing)
    >
      {({ isSubmitting, dirty, isValid, errors, touched }) => (
        <Form className="space-y-6">
          <div>
            <label htmlFor="name" className="label">
              Nome do Torneio
            </label>
            <Field
              type="text"
              name="name"
              id="name"
              className={`input mt-1 ${touched.name && errors.name ? 'input-error' : ''}`}
            />
            <ErrorMessage
              name="name"
              component="div"
              className="error-message"
            />
          </div>

          <div>
            <label htmlFor="date" className="label">
              Data do Torneio
            </label>
            <Field
              type="date"
              name="date"
              id="date"
              className={`input mt-1 ${touched.date && errors.date ? 'input-error' : ''}`}
            />
            <ErrorMessage
              name="date"
              component="div"
              className="error-message"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Descrição
            </label>
            <Field
              as="textarea"
              name="description"
              id="description"
              rows="3"
              className={`input mt-1 ${touched.description && errors.description ? 'input-error' : ''}`}
            />
            <ErrorMessage
              name="description"
              component="div"
              className="error-message"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bracket_type" className="label">
                Tipo de Chaveamento
              </label>
              <Field
                as="select"
                name="bracket_type"
                id="bracket_type"
                className={`input mt-1 ${touched.bracket_type && errors.bracket_type ? 'input-error' : ''}`}
              >
                <option value="single-elimination">Eliminatória Simples</option>
                <option value="double-elimination">Dupla Eliminação</option>
                <option value="round-robin">
                  Todos contra Todos (Round Robin)
                </option>
              </Field>
              <ErrorMessage
                name="bracket_type"
                component="div"
                className="error-message"
              />
            </div>
            <div>
              <label htmlFor="numPlayersExpected" className="label">
                Nº Esperado de Jogadores
              </label>
              <Field
                type="number"
                name="numPlayersExpected"
                id="numPlayersExpected"
                className={`input mt-1 ${touched.numPlayersExpected && errors.numPlayersExpected ? 'input-error' : ''}`}
              />
              <ErrorMessage
                name="numPlayersExpected"
                component="div"
                className="error-message"
              />
            </div>
            <div>
              <label htmlFor="status" className="label">
                Status do Torneio
              </label>
              <Field
                as="select"
                name="status"
                id="status"
                className={`input mt-1 ${touched.status && errors.status ? 'input-error' : ''}`}
                disabled={!isEditing} // Status might only be editable in edit mode, or have specific logic
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </Field>
              <ErrorMessage
                name="status"
                component="div"
                className="error-message"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="entry_fee" className="label">
                Taxa de Inscrição (R$)
              </label>
              <Field
                type="number"
                step="0.01"
                name="entry_fee"
                id="entry_fee"
                className={`input mt-1 ${touched.entry_fee && errors.entry_fee ? 'input-error' : ''}`}
              />
              <ErrorMessage
                name="entry_fee"
                component="div"
                className="error-message"
              />
            </div>
            <div>
              <label htmlFor="prize_pool" className="label">
                Premiação
              </label>
              <Field
                type="text"
                name="prize_pool"
                id="prize_pool"
                className={`input mt-1 ${touched.prize_pool && errors.prize_pool ? 'input-error' : ''}`}
              />
              <ErrorMessage
                name="prize_pool"
                component="div"
                className="error-message"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rules" className="label">
              Regras
            </label>
            <Field
              as="textarea"
              name="rules"
              id="rules"
              rows="5"
              className={`input mt-1 ${touched.rules && errors.rules ? 'input-error' : ''}`}
            />
            <ErrorMessage
              name="rules"
              component="div"
              className="error-message"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !dirty || !isValid}
            >
              <FaSave className="inline mr-2" />
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
