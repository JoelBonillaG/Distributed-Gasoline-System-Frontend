const KEY = 'access_token';
export const getAccessToken = () => localStorage.getItem(KEY);
export const setAccessToken = (t) => localStorage.setItem(KEY, t ?? '');
export const clearTokens = () => localStorage.removeItem(KEY);
