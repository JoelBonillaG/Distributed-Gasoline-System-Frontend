import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { reverseGeocode } from "@/services/geocoding.service";
import { Circle, Trash2 } from "lucide-react";

// Fix para los iconos de Leaflet en producción
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Componente para manejar eventos del mapa
function MapEvents({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

// Componente eliminado - ya no se usa zoom automático

// Componente para manejar el routing de Leaflet
function LeafletRouting({ origin, destination, onRouteUpdate, hideDirectionsPanel = false }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !origin || !destination) return;
    
    // Crear nueva ruta solo si hay 2 puntos
    if (origin && destination) {
      try {
        // Acceder a L.Routing desde el objeto L importado
        if (L.Routing && L.Routing.control) {
          // Limpiar control de ruta anterior si existe
          if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
          }

          routingControlRef.current = L.Routing.control({
            waypoints: [
              L.latLng(origin.lat, origin.lng),
              L.latLng(destination.lat, destination.lng),
            ],
            language: 'es',
            lineOptions: { 
              addWaypoints: false,
              styles: [
                { color: "#3b82f6", weight: 4, opacity: 0.8 },
              ],
            },
            routeWhileDragging: false,
            draggableWaypoints: false,
            createMarker: () => null,
            show: false, // No mostrar panel de direcciones
          }).addTo(map);

          // Ocultar el panel de direcciones con CSS si se requiere
          if (hideDirectionsPanel) {
            const panel = routingControlRef.current.getContainer();
            if (panel) {
              panel.style.display = 'none';
            }
          }

          // Guardar distancia cuando se carga la ruta
          routingControlRef.current.on("routesfound", function (e) {
            if (e.routes && e.routes.length > 0 && e.routes[0].summary) {
              const distance = (e.routes[0].summary.totalDistance / 1000).toFixed(2);
              if (onRouteUpdate) {
                onRouteUpdate({ ...destination, _distance: parseFloat(distance) });
              }
            }
          });
          
          routingControlRef.current.on("routingerror", function (e) {
            console.error("Routing error:", e);
          });
        } else {
          console.error("Leaflet Routing Machine no disponible");
        }
      } catch (error) {
        console.error("Error al crear ruta:", error);
      }
    }

    // Cleanup
    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (error) {
          // Ignorar errores de limpieza
        }
      }
    };
  }, [origin, destination, map]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return null;
}

export default function MapRoutePicker({
  origin = null,
  destination = null,
  onOriginChange,
  onDestinationChange,
  mode = "create", // create, edit o view
  disabled = false,
  hideDirectionsPanel = false, // Ocultar panel de direcciones de Leaflet Routing Machine
}) {
  const mapRef = useRef(null);
  const [currentPoint, setCurrentPoint] = useState(null); // null, 'origin', 'destination'
  
  // Si está deshabilitado o en modo view, no permitir interacción
  const isDisabled = disabled || mode === "view";

  // Iconos personalizados para origen y destino
  const originIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const destinationIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Manejar clic en el mapa
  const handleMapClick = async (e) => {
    if (isDisabled) return; // No permitir clics si está deshabilitado
    
    const { lat, lng } = e.latlng;
    
    // Determinar qué punto actualizar
    let targetPoint = currentPoint;
    
    // Si no hay punto actual seleccionado, alternar entre origen y destino
    if (!targetPoint) {
      targetPoint = !origin ? "origin" : !destination ? "destination" : "origin";
    }
    
    // Geocodificar para obtener el nombre de la dirección
    const address = await reverseGeocode(lat, lng);
    
    const point = { lat, lng, name: address };
    
    // Actualizar el punto correspondiente
    if (targetPoint === "origin" && onOriginChange) {
      onOriginChange(point);
    } else if (targetPoint === "destination" && onDestinationChange) {
      onDestinationChange(point);
    }
    
    // Limpiar selección
    setCurrentPoint(null);
  };

  // Limpiar ambos puntos
  const handleClear = () => {
    if (onOriginChange) onOriginChange(null);
    if (onDestinationChange) onDestinationChange(null);
    setCurrentPoint(null);
  };

  // Ocultar panel de direcciones con CSS si se requiere
  useEffect(() => {
    if (hideDirectionsPanel) {
      const style = document.createElement('style');
      style.textContent = `
        .leaflet-routing-container {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [hideDirectionsPanel]);

  return (
    <div className={`relative w-full h-[500px] rounded-xl border overflow-hidden ${isDisabled ? "bg-muted/40 opacity-75" : "bg-muted/20"}`}>
      {!isDisabled && !currentPoint && origin && destination && (
        <div className="absolute top-2 right-2 z-[1000] bg-blue-500/90 backdrop-blur-sm rounded-lg shadow-lg p-2 text-white text-sm font-medium">
          Haz clic para seleccionar origen o destino
        </div>
      )}

      {!isDisabled && (origin || destination) && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentPoint("origin")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors border-2 flex items-center gap-1.5 ${
              currentPoint === "origin"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Circle className="size-3 fill-green-500 text-green-500" />
            Origen
          </button>
          <button
            type="button"
            onClick={() => setCurrentPoint("destination")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors border-2 flex items-center gap-1.5 ${
              currentPoint === "destination"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Circle className="size-3 fill-orange-500 text-orange-500" />
            Destino
          </button>
          {(origin || destination) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <Trash2 className="size-3" />
              Limpiar
            </button>
          )}
        </div>
      )}

      <MapContainer
        center={[-1.8312, -78.1834]} // Ecuador
        zoom={7}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
        />
        
        <MapEvents onMapClick={handleMapClick} />
        <LeafletRouting 
          origin={origin} 
          destination={destination} 
          onRouteUpdate={onDestinationChange}
          hideDirectionsPanel={hideDirectionsPanel}
        />

        {origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={originIcon}
            eventHandlers={{
              click: () => setCurrentPoint("origin"),
            }}
          >
            {origin.name && (
              <>
                <Tooltip direction="top" className="text-xs">
                  {origin.name}
                </Tooltip>
                <Popup>{origin.name}</Popup>
              </>
            )}
          </Marker>
        )}
        
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
            eventHandlers={{
              click: () => setCurrentPoint("destination"),
            }}
          >
            {destination.name && (
              <>
                <Tooltip direction="top" className="text-xs">
                  {destination.name}
                </Tooltip>
                <Popup>{destination.name}</Popup>
              </>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

