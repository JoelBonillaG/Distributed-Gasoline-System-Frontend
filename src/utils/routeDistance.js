/**
 * Calcula la distancia entre dos puntos usando Leaflet Routing Machine
 * @param {number} originLat - Latitud del origen
 * @param {number} originLng - Longitud del origen
 * @param {number} destLat - Latitud del destino
 * @param {number} destLng - Longitud del destino
 * @returns {Promise<number>} Distancia en kilómetros
 */
export const calculateRouteDistance = async (originLat, originLng, destLat, destLng) => {
  return new Promise((resolve, reject) => {
    // Verificar que Leaflet Routing Machine esté disponible
    if (typeof window === 'undefined' || !window.L || !window.L.Routing) {
      // Fallback: calcular distancia en línea recta (Haversine) si Leaflet no está disponible
      const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
      resolve(distance);
      return;
    }

    try {
      // Crear un contenedor oculto para el mapa (Leaflet Routing Machine necesita un mapa)
      const mapContainer = document.createElement('div');
      mapContainer.style.width = '1px';
      mapContainer.style.height = '1px';
      mapContainer.style.position = 'absolute';
      mapContainer.style.top = '-9999px';
      mapContainer.style.left = '-9999px';
      document.body.appendChild(mapContainer);

      // Crear un mapa temporal oculto
      const map = window.L.map(mapContainer, {
        center: [originLat, originLng],
        zoom: 13,
      });

      // Crear el control de routing sin mostrarlo
      const routingControl = window.L.Routing.control({
        waypoints: [
          window.L.latLng(originLat, originLng),
          window.L.latLng(destLat, destLng),
        ],
        language: 'es',
        routeWhileDragging: false,
        createMarker: () => null, // No crear marcadores
        show: false, // No mostrar panel de direcciones
      }).addTo(map);

      // Escuchar cuando se encuentra la ruta
      routingControl.on('routesfound', function (e) {
        if (e.routes && e.routes.length > 0 && e.routes[0].summary) {
          const distance = e.routes[0].summary.totalDistance / 1000; // Convertir a km
          
          // Limpiar
          map.remove();
          document.body.removeChild(mapContainer);
          
          resolve(distance);
        } else {
          // Si no hay ruta, usar Haversine como fallback
          map.remove();
          document.body.removeChild(mapContainer);
          const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
          resolve(distance);
        }
      });

      // Manejar errores
      routingControl.on('routingerror', function (e) {
        console.warn('Error al calcular ruta, usando distancia en línea recta:', e);
        map.remove();
        document.body.removeChild(mapContainer);
        
        // Fallback a Haversine
        const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
        resolve(distance);
      });

      // Timeout de seguridad (10 segundos)
      setTimeout(() => {
        if (mapContainer.parentNode) {
          map.remove();
          document.body.removeChild(mapContainer);
          const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
          resolve(distance);
        }
      }, 10000);
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      // Fallback a Haversine
      const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
      resolve(distance);
    }
  });
};

/**
 * Calcula la distancia en línea recta entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en kilómetros
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

