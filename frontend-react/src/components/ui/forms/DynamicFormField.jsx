import React from 'react';
import { Field, ErrorMessage } from 'formik';
import PropTypes from 'prop-types';

/**
 * Dynamic Form Field Component
 * Renders different form field types based on configuration
 * Supports text inputs, textareas, selects, and other HTML input types
 */
const DynamicFormField = ({ field }) => {
  const baseInputClasses =
    'mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 disabled:bg-gray-600 disabled:text-gray-400';
  const labelClasses = 'block text-sm font-medium text-gray-300';
  const errorMessageClasses = 'mt-1 text-xs text-red-400';

  const fieldContainerClasses = field.fullWidth ? 'mb-4' : 'mb-4';

  return (
    <div className={fieldContainerClasses}>
      <label htmlFor={field.name} className={labelClasses}>
        {field.label}
      </label>
      {field.type === 'select' ? (
        <Field
          as="select"
          name={field.name}
          id={field.name}
          className={`${baseInputClasses} ${field.className || ''}`}
          disabled={field.disabled || false}
        >
          {field.placeholder && <option value="">{field.placeholder}</option>}
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Field>
      ) : field.type === 'textarea' ? (
        <Field
          as="textarea"
          name={field.name}
          id={field.name}
          className={`${baseInputClasses} ${field.className || ''}`}
          rows={field.rows || 3}
          disabled={field.disabled || false}
          placeholder={field.placeholder || ''}
        />
      ) : (
        <Field
          type={field.type}
          name={field.name}
          id={field.name}
          className={`${baseInputClasses} ${field.className || ''}`}
          placeholder={field.placeholder || ''}
          disabled={field.disabled || false}
        />
      )}
      <ErrorMessage name={field.name} component="div" className={errorMessageClasses} />
    </div>
  );
};

DynamicFormField.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    fullWidth: PropTypes.bool,
    rows: PropTypes.number, // For textarea
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
      })
    ), // For select
  }).isRequired,
};

export default DynamicFormField;
