import api from "./api";

/**
 * Obtener todas las rutas
 * @param {string} vehicleType - Filtro opcional por tipo de vehículo (LIVIANO, PESADO, CUALQUIERA)
 * @returns {Promise<Array>} Lista de rutas
 */
export const getAllRoutes = async (vehicleType = null) => {
  const params = vehicleType ? { vehicleType } : {};
  const res = await api.get("/routes", { params });
  return res.data || [];
};

/**
 * Obtener una ruta por ID
 * @param {string} id - ID de la ruta
 * @returns {Promise<Object>} Datos de la ruta
 */
export const getRoute = async (id) => {
  const res = await api.get(`/routes/${id}`);
  return res.data;
};

/**
 * Crear una nueva ruta
 * @param {Object} payload - Datos de la ruta
 * @returns {Promise<Object>} Ruta creada
 */
export const addRoute = async (payload) => {
  const res = await api.post("/routes", payload);
  return res.data;
};

/**
 * Actualizar una ruta existente
 * @param {string} id - ID de la ruta
 * @param {Object} payload - Datos actualizados
 * @returns {Promise<Object>} Ruta actualizada
 */
export const updateRoute = async (id, payload) => {
  const res = await api.put(`/routes/${id}`, payload);
  return res.data;
};

/**
 * Eliminar una ruta
 * @param {string} id - ID de la ruta
 * @returns {Promise<Object>} Respuesta de éxito
 */
export const deleteRoute = async (id) => {
  const res = await api.delete(`/routes/${id}`);
  return res.data;
};

/**
 * Parsear errores de validación del servidor
 * @param {Object} error - Error de la API
 * @returns {Object} Objeto con errores por campo
 */
export const parseFieldErrors = (error) => {
  const errs = error?.data?.errors;
  return errs && typeof errs === "object" ? errs : {};
};

/**
 * Obtener detalle del error
 * @param {Object} error - Error de la API
 * @param {string} fallback - Mensaje por defecto
 * @returns {string} Mensaje de error
 */
export const getErrorDetail = (error, fallback = "Ha ocurrido un error") => {
  return (
    error?.data?.detail ||
    error?.message ||
    error?.data?.message ||
    fallback
  );
};

