import api from "./api";

/**
 * Servicio para gestión de conductores, licencias y tipos de licencia
 */
const driversService = {
  // ========== CRUD DRIVERS ==========

  /**
   * Obtiene lista de todos los conductores
   * @returns {Promise<import('../types/driver-types').Driver[]>}
   */
  async getDrivers() {
    const response = await api.get('/drivers');
    return response.data;
  },

  /**
   * Obtiene un conductor por ID (incluye licencias y user data)
   * @param {number} id - ID del conductor
   * @returns {Promise<import('../types/driver-types').Driver>}
   */
  async getDriverById(id) {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo conductor
   * @param {import('../types/driver-types').CreateDriverDto} data - Datos del conductor
   * @returns {Promise<import('../types/driver-types').Driver>}
   */
  async createDriver(data) {
    const response = await api.post('/drivers', data);
    return response.data;
  },

  /**
   * Actualiza un conductor existente
   * @param {number} id - ID del conductor
   * @param {import('../types/driver-types').UpdateDriverDto} data - Datos a actualizar
   * @returns {Promise<import('../types/driver-types').Driver>}
   */
  async updateDriver(id, data) {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un conductor (eliminación lógica)
   * @param {number} id - ID del conductor
   * @returns {Promise<void>}
   */
  async deleteDriver(id) {
    await api.delete(`/drivers/${id}`);
  },

  /**
   * Obtiene lista de conductores inactivos/eliminados
   * @returns {Promise<import('../types/driver-types').Driver[]>}
   */
  async getInactiveDrivers() {
    const response = await api.get('/drivers/inactive');
    const driversList = Array.isArray(response.data) ? response.data : response.data.drivers || [];
    return driversList;
  },

  /**
   * Restaura un conductor eliminado lógicamente
   * @param {number} id - ID del conductor
   * @returns {Promise<import('../types/driver-types').Driver>}
   */
  async restoreDriver(id) {
    const response = await api.post(`/drivers/${id}/undelete`);
    return response.data;
  },

  // ========== CRUD LICENSES ==========

  /**
   * Obtiene todas las licencias de un conductor
   * @param {number} driverId - ID del conductor
   * @returns {Promise<import('../types/driver-types').DriverLicense[]>}
   */
  async getDriverLicenses(driverId) {
    const response = await api.get(`/drivers/${driverId}/licenses`);
    return response.data;
  },

  /**
   * Obtiene una licencia por ID
   * @param {number} licenseId - ID de la licencia
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async getLicenseById(licenseId) {
    const response = await api.get(`/drivers/licenses/${licenseId}`);
    return response.data;
  },

  /**
   * Crea una nueva licencia para un conductor
   * @param {number} driverId - ID del conductor
   * @param {Object} data - Datos de la licencia
   * @param {number} data.licenseTypeId - ID del tipo de licencia
   * @param {string} data.number - Número de licencia
   * @param {string} data.issuedAt - Fecha de emisión (ISO string)
   * @param {string} data.expiresAt - Fecha de vencimiento (ISO string)
   * @param {string} [data.status] - Estado (VALID, EXPIRED, SUSPENDED)
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async createLicense(driverId, data) {
    const response = await api.post(`/drivers/${driverId}/licenses`, data);
    return response.data;
  },

  /**
   * Actualiza una licencia de un conductor
   * @param {number} driverId - ID del conductor
   * @param {number} licenseId - ID de la licencia
   * @param {Object} data - Datos a actualizar (todos opcionales)
   * @param {number} [data.licenseTypeId] - ID del tipo de licencia
   * @param {string} [data.number] - Número de licencia
   * @param {string} [data.issuedAt] - Fecha de emisión (ISO string)
   * @param {string} [data.expiresAt] - Fecha de vencimiento (ISO string)
   * @param {string} [data.status] - Estado (VALID, EXPIRED, SUSPENDED)
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async updateLicense(driverId, licenseId, data) {
    const response = await api.put(`/drivers/${driverId}/licenses/${licenseId}`, data);
    return response.data;
  },

  /**
   * Suspende una licencia
   * @param {number} driverId - ID del conductor
   * @param {number} licenseId - ID de la licencia
   * @param {string} [reason] - Razón de la suspensión (opcional)
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async suspendLicense(driverId, licenseId, reason) {
    const response = await api.post(`/drivers/${driverId}/licenses/${licenseId}/suspend`, { reason });
    return response.data;
  },

  /**
   * Reactiva una licencia suspendida
   * @param {number} driverId - ID del conductor
   * @param {number} licenseId - ID de la licencia
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async reactivateLicense(driverId, licenseId) {
    const response = await api.post(`/drivers/${driverId}/licenses/${licenseId}/reactivate`);
    return response.data;
  },

  // ========== CRUD LICENSE TYPES ==========

  /**
   * Obtiene todos los tipos de licencia
   * @returns {Promise<import('../types/driver-types').LicenseType[]>}
   */
  async getLicenseTypes() {
    const response = await api.get('/drivers/license-types');
    return response.data;
  },

  /**
   * Obtiene un tipo de licencia por ID
   * @param {number} id - ID del tipo de licencia
   * @returns {Promise<import('../types/driver-types').LicenseType>}
   */
  async getLicenseTypeById(id) {
    const response = await api.get(`/drivers/license-types/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo tipo de licencia
   * @param {Object} data - Datos del tipo de licencia
   * @param {string} data.code - Código (A, B, C, etc.)
   * @param {string} data.name - Nombre
   * @param {string} data.description - Descripción
   * @returns {Promise<import('../types/driver-types').LicenseType>}
   */
  async createLicenseType(data) {
    const response = await api.post('/drivers/license-types', data);
    return response.data;
  },

  /**
   * Actualiza un tipo de licencia
   * @param {number} id - ID del tipo
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<import('../types/driver-types').LicenseType>}
   */
  async updateLicenseType(id, data) {
    const response = await api.put(`/drivers/license-types/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un tipo de licencia
   * @param {number} id - ID del tipo
   * @returns {Promise<void>}
   */
  async deleteLicenseType(id) {
    await api.delete(`/drivers/license-types/${id}`);
  },

  /**
   * Añade una inclusión a un tipo de licencia
   * @param {number} licenseTypeId - ID del tipo que incluye
   * @param {number} includedLicenseTypeId - ID del tipo incluido
   * @returns {Promise<import('../types/driver-types').LicenseInclude>}
   */
  async addLicenseInclusion(licenseTypeId, includedLicenseTypeId) {
    const response = await api.post(
      `/drivers/license-types/${licenseTypeId}/includes`,
      { includedLicenseTypeId }
    );
    return response.data;
  },

  /**
   * Elimina una inclusión de un tipo de licencia
   * @param {number} licenseTypeId - ID del tipo que incluye
   * @param {number} includedLicenseTypeId - ID del tipo incluido
   * @returns {Promise<void>}
   */
  async removeLicenseInclusion(licenseTypeId, includedLicenseTypeId) {
    await api.delete(
      `/drivers/license-types/${licenseTypeId}/includes/${includedLicenseTypeId}`
    );
  },

  // ========== VERIFICACIÓN CAN-DRIVE ==========

  /**
   * Verifica si un conductor puede conducir un tipo de vehículo
   * @param {number} driverId - ID del conductor
   * @param {number} licenseTypeId - ID del tipo de licencia requerido
   * @returns {Promise<Object>} - { canDrive: boolean, matchingLicenses: DriverLicense[] }
   */
  async canDrive(driverId, licenseTypeId) {
    const response = await api.get(
      `/drivers/${driverId}/can-drive/${licenseTypeId}`
    );
    return response.data;
  }
};

/**
 * Obtener detalle del error del backend
 * Prioriza: details > message > data.message > data.detail > fallback
 * @param {Object} error - Error de la API
 * @param {string} fallback - Mensaje por defecto
 * @returns {string} Mensaje de error
 */
export const getErrorDetail = (error, fallback = "Ha ocurrido un error") => {
  // El error puede venir de diferentes formas según cómo se maneje
  const errorData = error?.response?.data || error?.data || error;
  
  // Prioridad: details > message > data.message > data.detail
  return (
    errorData?.details ||
    errorData?.message ||
    error?.message ||
    errorData?.detail ||
    fallback
  );
};

export default driversService;
