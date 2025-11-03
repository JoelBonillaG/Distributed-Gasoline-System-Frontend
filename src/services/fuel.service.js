import api from "./api";

const fuelService = {
  /**
   * Obtener reporte general de consumo de combustible
   * @param {string} startDate - Fecha de inicio (formato YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (formato YYYY-MM-DD)
   * @returns {Promise<Object>} Datos del reporte con consumo estimado y real
   * Formato: { LIGHT: { estimated, actual }, HEAVY: { estimated, actual }, ANY: { estimated, actual } }
   */
  async getGeneralReport(startDate, endDate) {
    try {
      const response = await api.get("/fuel/reports/general", {
        params: {
          startDate,
          endDate,
        },
      });

      console.log("Respuesta del reporte de combustible:", response);
      return response.data;
    } catch (error) {
      console.error("Error al obtener reporte de combustible:", error);
      throw error;
    }
  },

  /**
   * Obtener reporte detallado por vehículo
   * @param {number} vehicleType - Tipo de vehículo: 1 (LIVIANO), 2 (PESADO), 3 (CUALQUIERA)
   * @returns {Promise<Object>} Datos del reporte con vehículos
   * Formato: { vehicles: [{ vehicleId, trips, estimated, actual, difference, efficiency }] }
   */
  async getVehicleDetailReport(vehicleType) {
    try {
      const response = await api.get("/fuel/reports/vehicle-detail", {
        params: {
          vehicleType, // El backend espera un número: 1, 2, o 3
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener reporte detallado de vehículos:", error);
      throw error;
    }
  },

  /**
   * Obtener reporte de rutas por vehículo
   * @param {number} vehicleId - ID del vehículo
   * @param {string} status - Estado de las rutas (por defecto: 'TERMINADO')
   * @param {number} vehicleType - Tipo de vehículo opcional: 0 (UNSPECIFIED), 1 (LIVIANO), 2 (PESADO), 3 (CUALQUIERA)
   * @returns {Promise<Object>} Datos del reporte con rutas
   * Formato: { routes: [{ routeId, routeName, originName, destinationName, estimated, actual, difference, deviation }] }
   */
  async getVehicleRoutesReport(vehicleId, status = "TERMINADO", vehicleType) {
    try {
      const params = {
        vehicleId,
        status,
      };

      // Agregar vehicleType solo si está definido
      if (vehicleType !== undefined && vehicleType !== null) {
        params.vehicleType = vehicleType;
      }

      const response = await api.get("/fuel/reports/vehicle-routes", {
        params,
      });
      console.log("response", response);
      return response.data;
    } catch (error) {
      console.error("Error al obtener rutas del vehículo:", error);
      throw error;
    }
  },
};

export default fuelService;
