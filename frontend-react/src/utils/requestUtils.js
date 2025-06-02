/**
 * Controls concurrent requests to prevent race conditions and redundant API calls.
 * If a request with the same key is already pending, it returns the existing promise.
 * Otherwise, it executes the new request and stores its promise.
 *
 * @param {React.MutableRefObject<Map<string, Promise<any>>>} pendingRequestsRef - Ref to a Map storing pending request promises.
 * @param {string} key - A unique key identifying the request type (e.g., 'loadTournaments', `getTournamentPlayers-${id}`).
 * @param {() => Promise<any>} requestFn - An async function that performs the actual request.
 * @returns {Promise<any>} A promise that resolves with the result of the request.
 */
export const controlRequest = async (pendingRequestsRef, key, requestFn) => {
  if (pendingRequestsRef.current.has(key)) {
    return pendingRequestsRef.current.get(key);
  }

  const requestPromise = (async () => {
    try {
      return await requestFn();
    } finally {
      pendingRequestsRef.current.delete(key);
    }
  })();

  pendingRequestsRef.current.set(key, requestPromise);
  return requestPromise;
};
