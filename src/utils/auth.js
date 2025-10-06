import { jwtDecode } from "jwt-decode";

/**
 * Decodifica el token JWT guardado en localStorage
 * @returns {Object|null} Devuelve el payload decodificado o null si no hay token
 */
export function getDecodedToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
}

/**
 * Devuelve el centerId del usuario logueado
 * @returns {number|null} centerId o null si no hay token
 */
export function getUserCenterId() {
  const decoded = getDecodedToken();
  return decoded?.centerId ? Number(decoded.centerId) : null;
}

/**
 * Devuelve el userId del usuario logueado
 * @returns {number|null} userId o null si no hay token
 */
export function getUserId() {
  const decoded = getDecodedToken();
  return decoded?.userId ? Number(decoded.userId) : null;
}

/**
 * Devuelve los roles del usuario logueado
 * @returns {string[]} roles o arreglo vacío si no hay token
 */
export function getUserRoles() {
  const decoded = getDecodedToken();
  return decoded?.roles ?? [];
}
