import React from 'react';

/**
 * Indicador de força da senha com feedback visual
 */
const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
  const calculateStrength = (password) => {
    if (!password) return { score: 0, feedback: [], level: 'Muito fraca' };

    let score = 0;
    const feedback = [];

    // Critérios de validação
    const criteria = [
      { test: password.length >= 8, message: 'Pelo menos 8 caracteres', points: 1 },
      { test: /[a-z]/.test(password), message: 'Letra minúscula', points: 1 },
      { test: /[A-Z]/.test(password), message: 'Letra maiúscula', points: 1 },
      { test: /[0-9]/.test(password), message: 'Número', points: 1 },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), message: 'Caractere especial', points: 1 },
    ];

    criteria.forEach(criterion => {
      if (criterion.test) {
        score += criterion.points;
      }
      feedback.push({
        ...criterion,
        passed: criterion.test
      });
    });

    // Determinar nível
    const levels = [
      { min: 0, max: 0, level: 'Muito fraca', color: 'red' },
      { min: 1, max: 2, level: 'Fraca', color: 'red' },
      { min: 3, max: 3, level: 'Razoável', color: 'yellow' },
      { min: 4, max: 4, level: 'Forte', color: 'green' },
      { min: 5, max: 5, level: 'Muito forte', color: 'green' },
    ];

    const currentLevel = levels.find(l => score >= l.min && score <= l.max);

    return {
      score,
      feedback,
      level: currentLevel?.level || 'Muito fraca',
      color: currentLevel?.color || 'red'
    };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  const getColorClasses = (color, intensity = 'normal') => {
    const colors = {
      red: {
        bg: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        bgLight: 'bg-red-100 dark:bg-red-900/20'
      },
      yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        bgLight: 'bg-yellow-100 dark:bg-yellow-900/20'
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600 dark:text-green-400',
        bgLight: 'bg-green-100 dark:bg-green-900/20'
      }
    };
    return colors[color] || colors.red;
  };

  const colorClasses = getColorClasses(strength.color);
  const widthPercentage = (strength.score / 5) * 100;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progresso */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colorClasses.bg}`}
            style={{ width: `${widthPercentage}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${colorClasses.text}`}>
          {strength.level}
        </span>
      </div>

      {/* Detalhes dos critérios */}
      {showDetails && (
        <div className={`p-3 rounded-lg ${colorClasses.bgLight} space-y-1`}>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Critérios de segurança:
          </p>
          <div className="grid grid-cols-1 gap-1">
            {strength.feedback.map((criterion, index) => (
              <div key={index} className="flex items-center space-x-2">
                {criterion.passed ? (
                  <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-xs ${criterion.passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {criterion.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
