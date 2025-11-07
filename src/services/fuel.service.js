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

  /**
   * Obtener KPIs del sistema
   * @param {string} statusFilter - Filtro opcional de estado (CREADO, EN_RUTA, EN_REVISION, TERMINADO)
   * @returns {Promise<Object>} Datos de KPIs
   * Formato: { totalTrips: number, averageEfficiency: number }
   */
  async getKPIs(statusFilter) {
    try {
      const params = {};

      // Agregar statusFilter solo si está definido
      if (statusFilter !== undefined && statusFilter !== null) {
        params.statusFilter = statusFilter;
      }

      const response = await api.get("/fuel/kpis", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener KPIs:", error);
      throw error;
    }
  },

  /**
   * Obtener reporte de ranking de choferes
   * @param {string} statusFilter - Filtro opcional de estado (CREADO, EN_RUTA, EN_REVISION, TERMINADO)
   * @returns {Promise<Object>} Datos del reporte de choferes
   * Formato: { drivers: [{ driverId, driverFirstName, driverLastName, totalTrips, tripsCreados, tripsEnRuta, tripsEnRevision, tripsTerminados }] }
   */
  async getDriverRankingReport(statusFilter) {
    try {
      const params = {};

      // Agregar statusFilter solo si está definido
      if (statusFilter !== undefined && statusFilter !== null) {
        params.statusFilter = statusFilter;
      }

      const response = await api.get("/fuel/reports/driver-ranking", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener reporte de ranking de choferes:", error);
      throw error;
    }
  },

  /**
   * Obtener viajes de un chofer específico
   * @param {number} driverId - ID del chofer
   * @returns {Promise<Object>} Datos de los viajes del chofer
   * Formato: { trips: [{ tripId, vehicle, route, status, startTime, endTime, fuelEstimated, fuelActual }] }
   */
  async getDriverTrips(driverId) {
    try {
      const response = await api.get(`/fuel/drivers/${driverId}/trips`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener viajes del chofer:", error);
      throw error;
    }
  },

  /**
   * Obtener resumen general de rutas
   * @returns {Promise<Object>} Datos del resumen de rutas
   * Formato: { routes: [{ routeId, routeName, totalTrips, estimated, actual, difference, efficiency }] }
   */
  async getRoutesSummaryReport() {
    try {
      const response = await api.get("/fuel/reports/routes-summary");
      return response.data;
    } catch (error) {
      console.error("Error al obtener resumen de rutas:", error);
      throw error;
    }
  },

  /**
   * Obtener viajes de una ruta específica
   * @param {number} routeId - ID de la ruta
   * @returns {Promise<Object>} Datos de los viajes de la ruta
   * Formato: { trips: [{ tripId, driverFirstName, driverLastName, vehicle, status, startTime, endTime, estimated, actual, difference, efficiency }] }
   */
  async getRouteTrips(routeId) {
    try {
      const response = await api.get(`/fuel/routes/${routeId}/trips`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener viajes de la ruta:", error);
      throw error;
    }
  },

  /**
   * Obtener reporte de tipos de maquinaria
   * @param {string} startDate - Fecha de inicio (formato YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (formato YYYY-MM-DD)
   * @returns {Promise<Object>} Datos del reporte por tipo de maquinaria
   * Formato: { period, generatedAt, totalTrips, totalEstimated, totalActual, globalEfficiency, machineryTypes: [...] }
   */
  async generateMachineryTypeReport(startDate, endDate) {
    try {
      const response = await api.get("/fuel/reports/machinery-type", {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al generar reporte de tipos de maquinaria:", error);
      throw error;
    }
  },
};

export default fuelService;
