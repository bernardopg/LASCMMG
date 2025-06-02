import React from 'react';
import { Formik, Form } from 'formik';
import { DynamicFormField } from '.';
import PropTypes from 'prop-types';

/**
 * FormModal Component
 * Reusable modal form component for entity creation/editing
 * Dynamically renders form fields based on configuration
 * Uses Formik for form state management and validation
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  initialValues,
  validationSchema,
  fields,
  onSubmit,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  isSubmittingExternal = false,
  extraFooter = null,
}) => {
  if (!isOpen) return null;

  // Base button classes - can be further customized via props if needed
  const baseButtonClasses =
    'px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150';
  const primaryButtonClasses = `${baseButtonClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500 disabled:bg-gray-500`;
  const secondaryButtonClasses = `${baseButtonClasses} bg-gray-600 hover:bg-gray-500 text-gray-200 focus:ring-gray-400 disabled:bg-gray-700 disabled:text-gray-500`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <h3 className="text-xl font-semibold mb-6 text-gray-100 border-b border-slate-700 pb-4">
          {title}
        </h3>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            onSubmit(values);
            setSubmitting(false);
          }}
          enableReinitialize
        >
          {({ isSubmitting, dirty, isValid }) => (
            <Form className="space-y-4">
              {fields.map((field) => (
                <DynamicFormField key={field.name} field={field} />
              ))}
              <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className={secondaryButtonClasses}
                  disabled={isSubmitting || isSubmittingExternal}
                >
                  {cancelLabel}
                </button>
                <button
                  type="submit"
                  className={primaryButtonClasses}
                  disabled={isSubmitting || isSubmittingExternal || !dirty || !isValid}
                >
                  {isSubmitting || isSubmittingExternal ? (
                    <span className="flex items-center">
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
                      Salvando...
                    </span>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
              {extraFooter && <div className="mt-4">{extraFooter}</div>}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

FormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  initialValues: PropTypes.object.isRequired,
  validationSchema: PropTypes.object,
  fields: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  isSubmittingExternal: PropTypes.bool,
  extraFooter: PropTypes.node,
};

export default FormModal;
