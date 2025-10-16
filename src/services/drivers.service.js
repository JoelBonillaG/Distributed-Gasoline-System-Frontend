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
   * Elimina un conductor
   * @param {number} id - ID del conductor
   * @returns {Promise<void>}
   */
  async deleteDriver(id) {
    await api.delete(`/drivers/${id}`);
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
   * @param {import('../types/driver-types').CreateLicenseDto} data - Datos de la licencia
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async createLicense(data) {
    const response = await api.post('/drivers/licenses', data);
    return response.data;
  },

  /**
   * Actualiza una licencia existente
   * @param {number} licenseId - ID de la licencia
   * @param {import('../types/driver-types').UpdateLicenseDto} data - Datos a actualizar
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async updateLicense(licenseId, data) {
    const response = await api.put(`/drivers/licenses/${licenseId}`, data);
    return response.data;
  },

  /**
   * Suspende una licencia
   * @param {number} licenseId - ID de la licencia
   * @param {string} reason - Razón de la suspensión
   * @returns {Promise<import('../types/driver-types').DriverLicense>}
   */
  async suspendLicense(licenseId, reason) {
    const response = await api.post(`/drivers/licenses/${licenseId}/suspend`, { reason });
    return response.data;
  },

  /**
   * Elimina una licencia
   * @param {number} licenseId - ID de la licencia
   * @returns {Promise<void>}
   */
  async deleteLicense(licenseId) {
    await api.delete(`/drivers/licenses/${licenseId}`);
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

export default driversService;
