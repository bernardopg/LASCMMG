import { useCallback, useMemo, useState } from 'react';
import { defaultValidationRules } from '../utils/validationRules';

/**
 * Hook customizado para validação de formulários
 * Fornece funcionalidades robustas de validação com suporte a regras personalizadas
 */
export const useValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validar um campo específico
  const validateField = useCallback(
    async (fieldName, fieldValue = values[fieldName]) => {
      const rules = validationRules[fieldName];
      if (!rules) return null;

      setIsValidating(true);

      try {
        for (const rule of Array.isArray(rules) ? rules : [rules]) {
          let error = null;

          if (typeof rule === 'function') {
            // Regra personalizada
            error = await rule(fieldValue, values);
          } else if (typeof rule === 'object') {
            // Regra com configuração
            const { type, ...config } = rule;
            const validator = defaultValidationRules[type];

            if (validator) {
              if (['minLength', 'maxLength', 'pattern', 'custom'].includes(type)) {
                error = validator(
                  config.value || config.length || config.regex || config.validator,
                  config.message
                )(fieldValue);
              } else {
                error = validator(fieldValue, config.message);
              }
            }
          } else if (typeof rule === 'string') {
            // Regra simples
            const validator = defaultValidationRules[rule];
            if (validator) {
              error = validator(fieldValue);
            }
          }

          if (error) {
            setErrors((prev) => ({ ...prev, [fieldName]: error }));
            return error;
          }
        }

        // Se chegou até aqui, não há erros
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [validationRules, values]
  );

  // Validar todos os campos
  const validateAll = useCallback(async () => {
    setIsValidating(true);
    const newErrors = {};

    try {
      for (const fieldName of Object.keys(validationRules)) {
        const error = await validateField(fieldName);
        if (error) {
          newErrors[fieldName] = error;
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } finally {
      setIsValidating(false);
    }
  }, [validationRules, validateField]);

  // Atualizar valor de campo
  const setValue = useCallback(
    (fieldName, value) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Validar automaticamente se o campo já foi tocado
      if (touched[fieldName]) {
        validateField(fieldName, value);
      }
    },
    [touched, validateField]
  );

  // Atualizar múltiplos valores
  const updateValues = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Marcar campo como tocado
  const setFieldTouched = useCallback(
    (fieldName, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [fieldName]: isTouched }));

      if (isTouched) {
        validateField(fieldName);
      }
    },
    [validateField]
  );

  // Resetar formulário
  const reset = useCallback(
    (newInitialValues = initialValues) => {
      setValues(newInitialValues);
      setErrors({});
      setTouched({});
      setIsValidating(false);
    },
    [initialValues]
  );

  // Limpar erros
  const clearErrors = useCallback((fieldNames = null) => {
    if (fieldNames) {
      const fieldsArray = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      setErrors((prev) => {
        const newErrors = { ...prev };
        fieldsArray.forEach((field) => delete newErrors[field]);
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  // Handler para onChange de inputs
  const getFieldProps = useCallback(
    (fieldName) => ({
      value: values[fieldName] || '',
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        setValue(fieldName, value);
      },
      onBlur: () => setFieldTouched(fieldName, true),
      error: touched[fieldName] && errors[fieldName],
      hasError: Boolean(touched[fieldName] && errors[fieldName]),
    }),
    [values, errors, touched, setValue, setFieldTouched]
  );

  // Verificar se o formulário é válido
  const isValid = useMemo(() => {
    return (
      Object.keys(errors).length === 0 &&
      Object.keys(validationRules).every((field) => touched[field])
    );
  }, [errors, touched, validationRules]);

  // Verificar se há algum campo sujo (modificado)
  const isDirty = useMemo(() => {
    return Object.keys(values).some((key) => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    isDirty,
    setValue,
    updateValues,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    clearErrors,
    getFieldProps,
  };
};

/**
 * Hook para validação de senha com critérios de força
 */
export const usePasswordValidation = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validation = useMemo(() => {
    const results = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[{\]{};':"\\|,.<>/?]/.test(password), // Removido escape desnecessário de ]
      passwordsMatch: password === confirmPassword && password !== '',
    };

    const score = Object.values(results).filter(Boolean).length;
    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

    return {
      ...results,
      score,
      strength,
      isValid: Object.values(results).every(Boolean),
    };
  }, [password, confirmPassword]);

  return {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    validation,
  };
};

export default useValidation;
