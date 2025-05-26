const redis = require('redis');
const { logger } = require('../logger/logger');
const { REDIS_URL } = require('../config/config'); // Assuming REDIS_URL will be in config

let redisClient;
let попыткиПодключения = 0;
const МАКС_ПОПЫТКИ = 5;
const ЗАДЕРЖКА_ПЕРЕПОДКЛЮЧЕНИЯ = 5000; // 5 секунд

const connectToRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  попыткиПодключения++;
  logger.info(
    'RedisClient',
    `Попытка подключения к Redis (${попыткиПодключения}/${МАКС_ПОПЫТКИ})... URL: ${REDIS_URL || 'redis://localhost:6379'}`
  );

  const client = redis.createClient({
    url: REDIS_URL || 'redis://localhost:6379', // Default URL if not in config
    socket: {
      connectTimeout: 5000, // 5 секунд
      reconnectStrategy: (retries) => {
        if (retries >= 20) {
          // Stop retrying after 20 attempts for this strategy
          logger.error(
            'RedisClient',
            'Достигнуто максимальное количество попыток переподключения к Redis. Отключение.'
          );
          return new Error('Слишком много попыток переподключения.');
        }
        return Math.min(retries * 100, 3000); // Reconnect after 0ms, 100ms, 200ms, ..., 3s
      },
    },
  });

  client.on('connect', () => {
    logger.info('RedisClient', 'Успешное подключение к Redis.');
    попыткиПодключения = 0; // Сбросить счетчик при успешном подключении
  });

  client.on('error', (err) => {
    logger.error('RedisClient', 'Ошибка клиента Redis:', {
      error: err.message,
      stack: err.stack,
    });
    // Логика переподключения обрабатывается встроенной стратегией, но можно добавить дополнительную логику здесь
  });

  client.on('reconnecting', () => {
    logger.info('RedisClient', 'Переподключение к Redis...');
  });

  client.on('end', () => {
    logger.info('RedisClient', 'Соединение с Redis закрыто.');
    // Можно попытаться переподключиться здесь, если это не автоматическое закрытие
  });

  try {
    await client.connect();
    redisClient = client;
    return redisClient;
  } catch (err) {
    logger.error('RedisClient', `Не удалось подключиться к Redis при запуске: ${err.message}`, {
      stack: err.stack,
    });
    if (попыткиПодключения < МАКС_ПОПЫТКИ) {
      logger.info(
        'RedisClient',
        `Повторная попытка подключения через ${ЗАДЕРЖКА_ПЕРЕПОДКЛЮЧЕНИЯ / 1000} секунд.`
      );
      await new Promise((resolve) => setTimeout(resolve, ЗАДЕРЖКА_ПЕРЕПОДКЛЮЧЕНИЯ));
      return connectToRedis(); // Рекурсивный вызов для повторной попытки
    } else {
      logger.error(
        'RedisClient',
        'Достигнуто максимальное количество начальных попыток подключения к Redis. Сервер может работать с ограниченной функциональностью.'
      );
      // В этом случае приложение может продолжить работу без Redis,
      // или можно выбросить ошибку, чтобы остановить запуск сервера, если Redis критичен.
      // throw new Error('Не удалось подключиться к Redis после нескольких попыток.');
      return null; // Или вернуть null, чтобы вызывающий код мог обработать это
    }
  }
};

// Функция для получения клиента, гарантирующая, что он подключен
const getClient = async () => {
  if (!redisClient || !redisClient.isOpen) {
    logger.warn(
      'RedisClient',
      'Клиент Redis не подключен или соединение закрыто. Попытка переподключения...'
    );
    return await connectToRedis();
  }
  return redisClient;
};

// Инициализировать соединение при загрузке модуля, но не блокировать запуск приложения
// connectToRedis().catch(err => {
//   logger.error('RedisClient', 'Начальное подключение к Redis не удалось при загрузке модуля.', { error: err.message });
// });
// Лучше вызывать connectToRedis при старте сервера в server.js

module.exports = {
  getClient,
  connectToRedis, // Экспортируем для явного вызова при старте сервера
};
