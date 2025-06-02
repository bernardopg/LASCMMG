let currentCsrfToken = null;
let csrfTokenPromise = null;
let csrfErrorRetryCount = 0;
let csrfTokenExpirationTime = null;
const CSRF_TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
const CSRF_ERROR_RETRY_MAX = 3;

// This needs to be callable without creating a circular dependency loop
// if api.js directly imports from this file at the top.
// One way is to pass the api instance or have a setter.
// For now, assuming apiInstance is the configured axios instance from api.js
// This will likely require api.js to initialize this service or pass its instance.

// The fetchCsrfToken function is not directly used by exported functions,
// its logic is incorporated into ensureCsrfTokenInternal.
// It can be removed for clarity.

// export const ensureCsrfToken = async (axiosInstance) => { // This function is not used, ensureCsrfTokenInternal is.
//   const now = Date.now();
//   if (currentCsrfToken && csrfTokenExpirationTime && now < csrfTokenExpirationTime) {
//     return currentCsrfToken;
//   }

//   if (csrfTokenPromise) return csrfTokenPromise;

//   // The original fetchCsrfToken logic is now part of ensureCsrfTokenInternal's promise
//   csrfTokenPromise = fetchCsrfToken(axiosInstance).finally(() => { // fetchCsrfToken was an internal helper
//     csrfTokenPromise = null;
//   });

//   return csrfTokenPromise;
// };

export const getCurrentCsrfToken = () => currentCsrfToken;
export { CSRF_ERROR_RETRY_MAX }; // Export the constant

export const clearCsrfToken = () => {
  currentCsrfToken = null;
  csrfTokenExpirationTime = null;
};

export const getCsrfErrorRetryCount = () => csrfErrorRetryCount;

export const incrementCsrfErrorRetryCount = () => {
  csrfErrorRetryCount++;
};

export const resetCsrfErrorRetryCount = () => {
  csrfErrorRetryCount = 0;
};

export const isCsrfRetryLimitExceeded = () => csrfErrorRetryCount >= CSRF_ERROR_RETRY_MAX;

// This function will be called by api.js to initialize with its instance
// This avoids the direct import cycle issue at the module's top level.
// However, a cleaner way might be to have csrfService be a class,
// or to have api.js pass its instance to each function.
// Comments related to the old import strategy can be cleaned up.

export const ensureCsrfTokenInternal = async (axiosInstance) => {
  if (!axiosInstance) {
    console.error(
      'Axios instance not provided to ensureCsrfTokenInternal. CSRF token cannot be fetched.'
    );
    return null;
  }
  const now = Date.now();
  if (currentCsrfToken && csrfTokenExpirationTime && now < csrfTokenExpirationTime) {
    return currentCsrfToken;
  }

  if (csrfTokenPromise) return csrfTokenPromise;

  console.info('Fetching new CSRF token from csrfService...');

  csrfTokenPromise = axiosInstance // Use passed axiosInstance
    .get('/api/csrf-token')
    .then((response) => {
      if (response.data && response.data.csrfToken) {
        currentCsrfToken = response.data.csrfToken;
        csrfErrorRetryCount = 0;
        csrfTokenExpirationTime = Date.now() + CSRF_TOKEN_LIFETIME;
        console.info('CSRF token fetched successfully by csrfService');
        return currentCsrfToken;
      }
      console.warn('CSRF token not found in response (csrfService)');
      return null;
    })
    .catch((err) => {
      console.error('Error fetching CSRF token (csrfService):', err);
      return null;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};
