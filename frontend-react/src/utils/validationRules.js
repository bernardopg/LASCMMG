// Regras de validação padrão
export const defaultValidationRules = {
  required: (value, message = 'Campo obrigatório') => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message;
    }
    return null;
  },
  email: (value, message = 'E-mail inválido') => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },
  minLength: (minLength, message) => (value) => {
    if (!value) return null;
    return value.length >= minLength ? null : message || `Mínimo de ${minLength} caracteres`;
  },
  maxLength: (maxLength, message) => (value) => {
    if (!value) return null;
    return value.length <= maxLength ? null : message || `Máximo de ${maxLength} caracteres`;
  },
  pattern:
    (regex, message = 'Formato inválido') =>
    (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },
  custom: (validator, message) => (value) => {
    if (!value) return null;
    return validator(value) ? null : message;
  },
};
