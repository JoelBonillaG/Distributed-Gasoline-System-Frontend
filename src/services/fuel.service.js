import api from "./api";
import { generateMockFuelReport } from "@/mocks/fuel.mock";

const fuelService = {
  /**
   * Obtener reporte general de consumo de combustible
   * @param {string} startDate - Fecha de inicio (formato ISO string o YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (formato ISO string o YYYY-MM-DD)
   * @returns {Promise<Object>} Datos del reporte con consumo estimado y real
   * Formato: { LIGHT: { totalTrips, estimated, actual, difference, deviation }, HEAVY: { ... } }
   */
  async getGeneralReport(startDate, endDate) {
    // TODO: Cambiar a false cuando el backend esté listo
    const USE_MOCK_DATA = true;

    if (USE_MOCK_DATA) {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Convertir strings a Date para el mock
      const start = new Date(startDate);
      const end = new Date(endDate);

      return generateMockFuelReport(start, end);
    }

    try {
      const response = await api.get("/fuel/reports/general", {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener reporte de combustible:", error);
      // Fallback a datos mockeados si falla la petición
      const start = new Date(startDate);
      const end = new Date(endDate);
      return generateMockFuelReport(start, end);
    }
  },

  /**
   * Obtener reporte detallado por vehículo
   * @param {string} startDate - Fecha de inicio (formato YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (formato YYYY-MM-DD)
   * @param {string} machineType - Tipo de maquinaria: 'LIGHT', 'HEAVY' o 'ANY'
   * @returns {Promise<Object>} Datos del reporte con vehículos
   * Formato: { vehicles: [{ vehicleId, trips, estimated, actual, difference, efficiency }] }
   */
  async getVehicleDetailReport(startDate, endDate, machineType) {
    const USE_MOCK_DATA = true;

    if (USE_MOCK_DATA) {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Generar datos mockeados
      const mockVehicles = Array.from({ length: 8 }, (_, i) => ({
        vehicleId: 1000 + i,
        trips: Math.floor(Math.random() * 20) + 5,
        estimated: Math.floor(Math.random() * 2000) + 500,
        actual: Math.floor(Math.random() * 2200) + 550,
        difference: 0,
        efficiency: 0,
      })).map((v) => ({
        ...v,
        difference: v.actual - v.estimated,
        efficiency: v.actual > 0 ? (v.estimated / v.actual) * 100 : 0,
      }));

      return { vehicles: mockVehicles };
    }

    try {
      const response = await api.get("/fuel/reports/vehicle-detail", {
        params: {
          startDate,
          endDate,
          machineType,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener reporte detallado de vehículos:", error);
      // Fallback a datos mockeados
      return { vehicles: [] };
    }
  },
};

export default fuelService;
