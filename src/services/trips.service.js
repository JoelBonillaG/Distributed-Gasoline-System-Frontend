import api from "./api";

/**
 * Obtener todos los viajes segmentados por estado
 * @param {string} status - Filtro opcional por estado (1=CREADO, 2=EN_RUTA, 3=EN_REVISION, 4=TERMINADO)
 * @param {string} driverId - Filtro opcional por ID de conductor
 * @returns {Promise<Object>} Objeto con trips segmentados, userRole y totalTrips
 */
export const getAllTrips = async (status = null, driverId = null) => {
  const params = {};
  if (status) params.status = status;
  if (driverId) params.driverId = driverId;
  
  const res = await api.get("/trips", { params });
  return res.data || {
    trips: { CREADO: [], EN_RUTA: [], EN_REVISION: [], TERMINADO: [] },
    userRole: "GUEST",
    totalTrips: 0,
  };
};

/**
 * Obtener un viaje por ID (con información enriquecida)
 * @param {string} id - ID del viaje
 * @returns {Promise<Object>} Datos del viaje con información adicional
 */
export const getTrip = async (id) => {
  const res = await api.get(`/trips/${id}`);
  return res.data;
};

/**
 * Crear un nuevo viaje
 * @param {Object} payload - Datos del viaje {routeId, supervisorId, driverId, vehicleId}
 * @returns {Promise<Object>} Respuesta con id y fuelEstimated
 */
export const addTrip = async (payload) => {
  const res = await api.post("/trips", payload);
  return res.data;
};

/**
 * Actualizar un viaje existente
 * @param {string} id - ID del viaje
 * @param {Object} payload - Datos actualizados {driverId?, vehicleId?}
 * @returns {Promise<Object>} Viaje actualizado
 */
export const updateTrip = async (id, payload) => {
  const res = await api.put(`/trips/${id}`, payload);
  return res.data;
};

/**
 * Iniciar un viaje
 * @param {string} id - ID del viaje
 * @param {Object} body - {currentLat?, currentLng?}
 * @returns {Promise<Object>} Respuesta con startTime
 */
export const startTrip = async (id, body = {}) => {
  const res = await api.post(`/trips/${id}/start`, body);
  return res.data;
};

/**
 * Finalizar un viaje
 * @param {string} id - ID del viaje
 * @param {Object} body - {currentLat?, currentLng?}
 * @returns {Promise<Object>} Respuesta de finalización
 */
export const finishTrip = async (id, body = {}) => {
  const res = await api.post(`/trips/${id}/finish`, body);
  return res.data;
};

/**
 * Revisar un viaje (confirmar odómetro y comentarios)
 * @param {string} id - ID del viaje
 * @param {Object} body - {odometerEnd, reviewComment?}
 * @returns {Promise<Object>} Respuesta de revisión
 */
export const reviewTrip = async (id, body) => {
  const res = await api.post(`/trips/${id}/review`, body);
  return res.data;
};

/**
 * Actualizar ubicación actual de un viaje
 * @param {string} id - ID del viaje
 * @param {Object} body - {currentLat, currentLng, currentDistance?}
 * @returns {Promise<Object>} Respuesta de actualización
 */
export const updateTripLocation = async (id, body) => {
  const res = await api.put(`/trips/${id}/location`, body);
  return res.data;
};

/**
 * Calcular métricas de un viaje sin persistir
 * @param {string} id - ID del viaje
 * @param {Object} body - {odometerEnd}
 * @returns {Promise<Object>} Métricas calculadas
 */
export const calculateTripMetrics = async (id, body) => {
  const res = await api.post(`/trips/${id}/calc-metrics`, body);
  return res.data;
};

/**
 * Obtener conductores asignables
 * @returns {Promise<Array>} Lista de conductores disponibles
 */
export const getAssignableDrivers = async () => {
  const res = await api.get("/trips/assignable/drivers");
  // El backend puede devolver { drivers: [...] } o directamente un array
  return res.data?.drivers || res.data || [];
};

/**
 * Obtener vehículos asignables
 * @param {Object} filters - Filtros opcionales
 * @param {string[]} filters.driverLicenseTypeCodes - Códigos de licencia del conductor (ej: ["B", "C"])
 * @param {string} filters.routeVehicleType - Tipo de vehículo de la ruta (LIVIANO, PESADO, CUALQUIERA)
 * @returns {Promise<Array>} Lista de vehículos disponibles
 */
export const getAssignableVehicles = async (filters = {}) => {
  // Si hay filtros (especialmente arrays), usar POST para evitar problemas con serialización de arrays en query params
  const hasFilters = (filters.driverLicenseTypeCodes && filters.driverLicenseTypeCodes.length > 0) || filters.routeVehicleType;
  
  if (hasFilters) {
    // Usar POST cuando hay filtros para enviar arrays correctamente en el body
    const body = {};
    if (filters.driverLicenseTypeCodes && filters.driverLicenseTypeCodes.length > 0) {
      body.driverLicenseTypeCodes = filters.driverLicenseTypeCodes;
    }
    if (filters.routeVehicleType) {
      body.routeVehicleType = filters.routeVehicleType;
    }
    
    const res = await api.post("/trips/assignable/vehicles", body);
    return res.data?.vehicles || res.data || [];
  } else {
    // Sin filtros, usar GET
    const res = await api.get("/trips/assignable/vehicles");
    return res.data?.vehicles || res.data || [];
  }
};

/**
 * Obtener supervisores asignables
 * @returns {Promise<Array>} Lista de supervisores disponibles
 */
export const getAssignableSupervisors = async () => {
  const res = await api.get("/trips/assignable/supervisors");
  // El backend puede devolver { supervisors: [...] } o directamente un array
  return res.data?.supervisors || res.data || [];
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

