/**
 * Servicio de geocoding usando OpenCage API
 */

const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
const OPENCAGE_BASE_URL = "https://api.opencagedata.com/geocode/v1/json";

/**
 * Geocode inverso: convertir coordenadas a dirección
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<string>} Dirección formateada
 */
export const reverseGeocode = async (lat, lng) => {
  if (!OPENCAGE_API_KEY) {
    console.error("VITE_OPENCAGE_API_KEY no está configurada");
    return "Ubicación desconocida";
  }

  try {
    const url = `${OPENCAGE_BASE_URL}?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}&language=es`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      let address = data.results[0].formatted;

      // Limpiar "Unnamed road" si aparece
      if (address.toLowerCase().includes("unnamed road")) {
        const comp = data.results[0].components;
        address = [
          comp.village || comp.town || comp.city,
          comp.state,
          comp.country,
        ]
          .filter(Boolean)
          .join(", ");
      }

      return address || "Ubicación desconocida";
    } else {
      return "Ubicación desconocida";
    }
  } catch (error) {
    console.error("Error al obtener dirección:", error);
    return "Error al obtener dirección";
  }
};

/**
 * Geocode directo: convertir dirección a coordenadas
 * @param {string} query - Dirección a buscar
 * @returns {Promise<Object|null>} Coordenadas { lat, lng, formatted } o null
 */
export const forwardGeocode = async (query) => {
  if (!OPENCAGE_API_KEY) {
    console.error("VITE_OPENCAGE_API_KEY no está configurada");
    return null;
  }

  if (!query || query.trim().length === 0) {
    return null;
  }

  try {
    const url = `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=es&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted,
        name: result.formatted,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error al buscar dirección:", error);
    return null;
  }
};

/**
 * Autocompletar direcciones (búsqueda múltiple)
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Lista de sugerencias { lat, lng, formatted }
 */
export const autocompleteGeocode = async (query) => {
  if (!OPENCAGE_API_KEY) {
    console.error("VITE_OPENCAGE_API_KEY no está configurada");
    return [];
  }

  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const url = `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=es&limit=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((result) => ({
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted,
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error en autocompletar:", error);
    return [];
  }
};

