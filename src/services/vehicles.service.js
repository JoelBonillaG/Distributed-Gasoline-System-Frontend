import api from "./api";

const vehiclesService = {
  /**
   * Obtener todos los modelos de vehículos
   * @returns {Promise<Array>} Lista de modelos de vehículos
   */
  async getAllVehicles() {
    const response = await api.get("/vehicles/models");
    return response.data;
  },

  /**
   * Crear un nuevo modelo de vehículo
   * @param {Object} vehicleData - Datos del vehículo con motor y licencias
   * @returns {Promise<Object>} Respuesta con modelId
   */
  async createVehicle(vehicleData) {
    const response = await api.post("/vehicles/models", vehicleData);
    return response.data;
  },

  /**
   * Actualizar un modelo de vehículo existente
   * @param {string} modelId - ID del modelo
   * @param {Object} vehicleData - Datos actualizados
   * @returns {Promise<Object>} Modelo actualizado
   */
  async updateVehicle(modelId, vehicleData) {
    const response = await api.patch(`/vehicles/models/${modelId}`, vehicleData);
    return response.data;
  },

  /**
   * Eliminar un modelo de vehículo
   * @param {string} modelId - ID del modelo
   * @param {string} expectedVersion - Versión esperada (opcional)
   * @returns {Promise<Object>} Respuesta de éxito
   */
  async deleteVehicle(modelId, expectedVersion) {
    const params = expectedVersion ? { expectedVersion } : {};
    const response = await api.delete(`/vehicles/models/${modelId}`, { params });
    return response.data;
  },

  /**
   * Obtener un modelo de vehículo por ID
   * @param {string} modelId - ID del modelo
   * @returns {Promise<Object>} Datos completos del modelo
   */
  async getVehicleById(modelId) {
    const response = await api.get(`/vehicles/models/${modelId}`);
    return response.data;
  },

  /**
   * Obtener un modelo por identidad (brand, family, trim, yearFrom, yearTo)
   * @param {Object} identity - Objeto con brand, family, trim, yearFrom, yearTo
   * @returns {Promise<Object>} Datos del modelo
   */
  async getVehicleByIdentity({ brand, family, trim, yearFrom, yearTo }) {
    const params = {
      brand,
      family,
      yearFrom,
    };
    if (trim) params.trim = trim;
    if (yearTo) params.yearTo = yearTo;

    const response = await api.get("/vehicles/models/by-identity", { params });
    return response.data;
  },

  /**
   * Listar licencias requeridas para un modelo
   * @param {string} modelId - ID del modelo
   * @returns {Promise<Array>} Lista de licencias
   */
  async getModelLicenses(modelId) {
    const response = await api.get(`/vehicles/models/${modelId}/license-reqs`);
    return response.data;
  },

  /**
   * Establecer licencias requeridas para un modelo (reemplaza el array completo)
   * @param {string} modelId - ID del modelo
   * @param {Array} licenses - Array de licencias
   * @returns {Promise<Object>} Respuesta con licencias actualizadas
   */
  async setModelLicenses(modelId, licenses) {
    const response = await api.put(`/vehicles/models/${modelId}/license-reqs`, { licenses });
    return response.data;
  },

  /**
   * Eliminar una licencia específica de un modelo
   * @param {string} modelId - ID del modelo
   * @param {string} licenseRef - Código o ID de la licencia
   * @returns {Promise<Object>} Respuesta con licencias restantes
   */
  async deleteModelLicense(modelId, licenseRef) {
    const response = await api.delete(`/vehicles/models/${modelId}/license-reqs/${licenseRef}`);
    return response.data;
  },

  // ==================== UNITS ====================

  /**
   * Obtener todas las unidades de vehículos
   * @returns {Promise<Array>} Lista de unidades de vehículos
   */
  async getAllUnits() {
    const response = await api.get("/vehicles/units");
    return response.data;
  },

  /**
   * Crear una nueva unidad de vehículo
   * @param {Object} unitData - Datos de la unidad (plate, modelId, tankCapacityL, etc.)
   * @returns {Promise<Object>} Respuesta con vehicleId
   */
  async createUnit(unitData) {
    const response = await api.post("/vehicles/units", unitData);
    return response.data;
  },

  /**
   * Actualizar una unidad de vehículo existente
   * @param {string} vehicleId - ID de la unidad
   * @param {Object} unitData - Datos actualizados
   * @returns {Promise<Object>} Unidad actualizada
   */
  async updateUnit(vehicleId, unitData) {
    const response = await api.patch(`/vehicles/units/${vehicleId}`, unitData);
    return response.data;
  },

  /**
   * Eliminar una unidad de vehículo
   * @param {string} vehicleId - ID de la unidad
   * @returns {Promise<Object>} Respuesta de éxito
   */
  async deleteUnit(vehicleId) {
    const response = await api.delete(`/vehicles/units/${vehicleId}`);
    return response.data;
  },

  /**
   * Obtener una unidad de vehículo por ID
   * @param {string} vehicleId - ID de la unidad
   * @returns {Promise<Object>} Datos completos de la unidad
   */
  async getUnitById(vehicleId) {
    const response = await api.get("/vehicles/units/search", {
      params: { vehicleId },
    });
    return response.data;
  },
};

export default vehiclesService;
