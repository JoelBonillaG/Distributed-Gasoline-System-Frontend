/**
 * Datos mockeados para el servicio de combustible
 * Este archivo contiene datos de prueba mientras el backend está en desarrollo
 * 
 * Formato del backend:
 * {
 *   LIGHT: {
 *     totalTrips: number,
 *     estimated: number,
 *     actual: number,
 *     difference: number,
 *     deviation: number
 *   },
 *   HEAVY: {
 *     totalTrips: number,
 *     estimated: number,
 *     actual: number,
 *     difference: number,
 *     deviation: number
 *   }
 * }
 */

export const mockFuelReportData = {
  LIGHT: {
    totalTrips: 45,
    estimated: 1500,
    actual: 1575,
    difference: 75,
    deviation: 5.0,
  },
  HEAVY: {
    totalTrips: 28,
    estimated: 3200,
    actual: 3488,
    difference: 288,
    deviation: 9.0,
  },
};

/**
 * Genera datos mockeados con valores aleatorios dentro de un rango razonable
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {Object} Datos mockeados del reporte
 */
export const generateMockFuelReport = (startDate, endDate) => {
  // Simular variación basada en el rango de fechas
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const multiplier = Math.max(1, daysDiff / 30); // Factor basado en días (normalizado a 30 días)

  // Generar valores base que varíen según el período
  const baseLightEstimated = 1500 * multiplier;
  const baseHeavyEstimated = 3200 * multiplier;

  // Añadir variación aleatoria pequeña (±5%)
  const lightVariation = 1 + (Math.random() * 0.1 - 0.05);
  const heavyVariation = 1 + (Math.random() * 0.1 - 0.05);

  const lightEstimated = Math.round(baseLightEstimated * lightVariation);
  const lightActual = Math.round(lightEstimated * (1 + 0.03 + Math.random() * 0.04)); // +3% a +7%
  
  const heavyEstimated = Math.round(baseHeavyEstimated * heavyVariation);
  const heavyActual = Math.round(heavyEstimated * (1 + 0.06 + Math.random() * 0.06)); // +6% a +12%

  const lightDifference = lightActual - lightEstimated;
  const lightDeviation = lightEstimated > 0 
    ? ((lightDifference / lightEstimated) * 100) 
    : 0;

  const heavyDifference = heavyActual - heavyEstimated;
  const heavyDeviation = heavyEstimated > 0 
    ? ((heavyDifference / heavyEstimated) * 100) 
    : 0;

  return {
    LIGHT: {
      totalTrips: Math.round(45 * multiplier),
      estimated: lightEstimated,
      actual: lightActual,
      difference: lightDifference,
      deviation: Math.round(lightDeviation * 10) / 10, // Redondear a 1 decimal
    },
    HEAVY: {
      totalTrips: Math.round(28 * multiplier),
      estimated: heavyEstimated,
      actual: heavyActual,
      difference: heavyDifference,
      deviation: Math.round(heavyDeviation * 10) / 10, // Redondear a 1 decimal
    },
  };
};
