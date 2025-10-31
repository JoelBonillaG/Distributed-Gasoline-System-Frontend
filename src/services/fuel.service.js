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
};

export default fuelService;
