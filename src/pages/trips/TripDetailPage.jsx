import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeading } from "@/components/ui/typography/Heading";
import { Button } from "@/components/ui/shadcn/button";
import { Card } from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";
import { 
  Loader2, 
  ArrowLeft, 
  Play, 
  MapPin, 
  CheckCircle, 
  FileCheck,
  Truck,
  User,
  Users,
  Route as RouteIcon,
  Calendar,
  Fuel,
  Gauge,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTrip } from "@/hooks/use-trips";
import { useRoute } from "@/hooks/use-routes";
import { useAuth } from "@/hooks/use-auth";
import StartTripModal from "@/components/trips/modals/StartTripModal";
import UpdateLocationModal from "@/components/trips/modals/UpdateLocationModal";
import FinishTripModal from "@/components/trips/modals/FinishTripModal";
import ReviewTripModal from "@/components/trips/modals/ReviewTripModal";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Mapeo de status a colores y texto
const STATUS_CONFIG = {
  1: { label: "Creado", className: "bg-gray-500 text-white hover:bg-gray-600" }, // CREADO
  2: { label: "En Ruta", className: "bg-blue-500 text-white hover:bg-blue-600" }, // EN_RUTA
  3: { label: "En Revisión", className: "bg-orange-500 text-white hover:bg-orange-600" }, // EN_REVISION
  4: { label: "Terminado", className: "bg-green-500 text-white hover:bg-green-600" }, // TERMINADO
};

// Helper para normalizar status
const normalizeStatus = (status) => {
  if (typeof status === "string") {
    const statusMap = {
      CREADO: 1,
      EN_RUTA: 2,
      EN_REVISION: 3,
      TERMINADO: 4,
    };
    return statusMap[status] || 1;
  }
  return status || 1;
};

// Helper para formatear fecha
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    // Manejar tanto objetos timestamp como strings
    if (typeof timestamp === "object" && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1e6);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// Componente para mostrar la ruta en el mapa
function TripRouteMap({ routeData, currentLocation, statusNumber, trip, isDriver, showDirections }) {
  const map = useMap();
  const routingControlsRef = React.useRef([]);

  React.useEffect(() => {
    if (!routeData?.originLat || !routeData?.destinationLat) return;

    // Limpiar controles anteriores de manera segura
    routingControlsRef.current.forEach(control => {
      try {
        if (control && control.getContainer) {
          const container = control.getContainer();
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }
        if (control && map.hasControl && map.hasControl(control)) {
          map.removeControl(control);
        } else if (control && map) {
          try {
            map.removeControl(control);
          } catch (e) {
            // Ignorar errores de control ya removido
          }
        }
      } catch (e) {
        // Ignorar errores al limpiar controles
      }
    });
    routingControlsRef.current = [];

    // Obtener coordenadas de la ruta (preferir las de trip, luego routeData)
    const originLat = trip?.originLat ?? routeData.originLat;
    const originLng = trip?.originLng ?? routeData.originLng;
    const destLat = trip?.destinationLat ?? routeData.destinationLat;
    const destLng = trip?.destinationLng ?? routeData.destinationLng;

    if (!window.L || !window.L.Routing || !window.L.Routing.control) return;

    // Determinar si mostrar el panel de direcciones (solo para conductores en ruta)
    const shouldShowDirections = showDirections === true;

    // SIEMPRE crear la ruta planificada en el mapa (para todos los usuarios)
    const plannedRouteControl = window.L.Routing.control({
      waypoints: [
        window.L.latLng(originLat, originLng),
        window.L.latLng(destLat, destLng),
      ],
      language: 'es',
      lineOptions: {
        addWaypoints: false,
        styles: [
          { color: "#3b82f6", weight: 4, opacity: 0.6, dashArray: "10, 5" }, // Azul punteado para ruta planificada
        ],
      },
      routeWhileDragging: false,
      draggableWaypoints: false,
      createMarker: () => null,
      show: shouldShowDirections, // Mostrar panel solo para conductores en ruta (usando el panel por defecto de Leaflet)
    }).addTo(map);

    // Ocultar el panel si no se debe mostrar (para otros usuarios)
    if (!shouldShowDirections) {
      const plannedPanel = plannedRouteControl.getContainer();
      if (plannedPanel) {
        plannedPanel.style.display = 'none';
      }
    }

    routingControlsRef.current.push(plannedRouteControl);

    // Si está en ruta y hay ubicación actual, también mostrar la ruta recorrida (origen → ubicación actual) en verde
    if (statusNumber === 2 && currentLocation) {
      const traveledRouteControl = window.L.Routing.control({
        waypoints: [
          window.L.latLng(originLat, originLng),
          window.L.latLng(currentLocation.lat, currentLocation.lng),
        ],
        language: 'es',
        lineOptions: {
          addWaypoints: false,
          styles: [
            { color: "#22c55e", weight: 5, opacity: 0.9 }, // Verde sólido para ruta recorrida
          ],
        },
        routeWhileDragging: false,
        draggableWaypoints: false,
        createMarker: () => null,
        show: false, // La ruta recorrida no muestra panel
      }).addTo(map);

      const traveledPanel = traveledRouteControl.getContainer();
      if (traveledPanel) traveledPanel.style.display = 'none';
      routingControlsRef.current.push(traveledRouteControl);
    }

    // Ajustar zoom solo la primera vez, no cuando cambia la visibilidad del panel
    const bounds = window.L.latLngBounds([
      [originLat, originLng],
      [destLat, destLng],
    ]);

    // Si hay ubicación actual, incluirla en los bounds
    if (statusNumber === 2 && currentLocation) {
      bounds.extend([currentLocation.lat, currentLocation.lng]);
    }

    // Ajustar el mapa para mostrar todos los puntos con un padding
    setTimeout(() => {
      map.fitBounds(bounds, {
        padding: [50, 50], // Padding en píxeles
        maxZoom: 15, // Zoom máximo permitido
      });
    }, 500); // Pequeño delay para asegurar que las rutas se rendericen

    return () => {
      routingControlsRef.current.forEach(control => {
        try {
          if (control && map && map.hasControl && map.hasControl(control)) {
            map.removeControl(control);
          } else if (control && map) {
            try {
              map.removeControl(control);
            } catch (e) {
              // Ignorar errores de control ya removido
            }
          }
        } catch (e) {
          // Ignorar errores en cleanup
        }
      });
      routingControlsRef.current = [];
    };
    // Solo ejecutar cuando cambian estos valores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeData?.originLat, routeData?.destinationLat, currentLocation?.lat, currentLocation?.lng, statusNumber, trip?.originLat, trip?.destinationLat, isDriver, showDirections]);

  return null;
}

// Fix para iconos de Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: trip, isLoading, error, refetch } = useTrip(id);
  const { data: routeData } = useRoute(trip?.routeId?.toString());
  
  const [startTripOpen, setStartTripOpen] = useState(false);
  const [updateLocationOpen, setUpdateLocationOpen] = useState(false);
  const [finishTripOpen, setFinishTripOpen] = useState(false);
  const [reviewTripOpen, setReviewTripOpen] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Obtener roles del usuario
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r || "").trim().toUpperCase())
    : [];

  const isAdmin = userRoles.includes("ADMIN");
  const isDriver = userRoles.includes("DRIVER");
  const isSupervisor = userRoles.includes("SUPERVISOR");

  // Normalizar status - asegurarse de que funcione con string o número
  const tripStatusRaw = trip?.status;
  const statusNumber = trip ? normalizeStatus(tripStatusRaw) : 1;
  const statusConfig = STATUS_CONFIG[statusNumber] || STATUS_CONFIG[1];
  
  // Debug extensivo
  console.log("=== TRIP DETAIL DEBUG ===");
  console.log("Trip status raw:", tripStatusRaw);
  console.log("Status normalized:", statusNumber);
  console.log("User roles:", userRoles);
  console.log("isDriver:", isDriver);
  console.log("isSupervisor:", isSupervisor);
  console.log("isAdmin:", isAdmin);

  // Determinar qué acciones están disponibles
  const canStartTrip = isDriver && statusNumber === 1; // CREADO
  const canUpdateLocation = isDriver && statusNumber === 2; // EN_RUTA
  const canFinishTrip = isDriver && statusNumber === 2; // EN_RUTA
  const canReviewTrip = isSupervisor && statusNumber === 3; // EN_REVISION

  // Handler para refrescar después de acciones
  const handleActionSuccess = () => {
    refetch();
  };

  // Mostrar loading overlay con delay mínimo de 3 segundos (igual que FormRoutePage)
  useEffect(() => {
    if (id) {
      // Mostrar overlay cuando empieza a cargar
      setShowLoadingOverlay(true);
      
      // Ocultar después de 3 segundos (igual que FormRoutePage)
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowLoadingOverlay(false);
    }
  }, [id]);

  if (isLoading) {
    // Mantener el overlay visible mientras carga, no retornar early
    return null;
  }

  if (error || !trip) {
    return (
      <div className="space-y-6 p-6">
        <PageHeading
          title="Viaje no encontrado"
          subtitle="El viaje solicitado no existe o no tienes permisos para verlo."
          icon={AlertCircle}
        />
        <Button variant="outline" onClick={() => navigate("/trips")}>
          <ArrowLeft className="mr-2 size-4" />
          Volver a viajes
        </Button>
      </div>
    );
  }

  // Obtener información enriquecida con fallbacks
  const routeName = trip.routeName || trip.routeInfo?.name || `Ruta #${trip.routeId}`;
  const originName = trip.originName || routeData?.originName || "Origen no disponible";
  const destinationName = trip.destinationName || routeData?.destinationName || "Destino no disponible";
  const driverName = trip.driverFirstName && trip.driverLastName
    ? `${trip.driverFirstName} ${trip.driverLastName}`
    : trip.driverInfo
    ? `${trip.driverInfo.firstName} ${trip.driverInfo.lastName}`
    : `Conductor #${trip.driverId}`;
  const supervisorName = trip.supervisorFirstName && trip.supervisorLastName
    ? `${trip.supervisorFirstName} ${trip.supervisorLastName}`
    : trip.supervisorInfo
    ? `${trip.supervisorInfo.firstName} ${trip.supervisorInfo.lastName}`
    : `Supervisor #${trip.supervisorId}`;
  const vehiclePlate = trip.vehiclePlate || trip.vehicleInfo?.plate || `Vehículo #${trip.vehicleId}`;

  // Determinar si mostrar direcciones (solo para conductores en ruta)
  // Validar tanto el statusNumber normalizado como el string directo por si acaso
  const tripStatus = trip?.status;
  const isInRoute = statusNumber === 2 || tripStatus === "EN_RUTA" || tripStatus === 2;
  const shouldShowDirections = isDriver && isInRoute;
  
  console.log("isInRoute:", isInRoute);
  console.log("shouldShowDirections:", shouldShowDirections);
  console.log("routeData:", routeData);
  console.log("trip:", trip);
  console.log("=========================");

  return (
    <div className="space-y-6 p-6 relative">
      {/* Modal de carga - mismo estilo que FormRoutePage */}
      {showLoadingOverlay && id && createPortal(
        <div className="fixed inset-0 z-[99999] bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Cargando viaje...</p>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeading
          title={`Viaje #${trip.id}`}
          subtitle={routeName}
          icon={Truck}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/trips")}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
        </div>
      </div>

      {/* Estado y acciones */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge variant="default" className={`text-sm ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>
          
          {/* Botones de acción según estado y rol */}
          <div className="flex gap-2">
            {canStartTrip && (
              <Button onClick={() => setStartTripOpen(true)}>
                <Play className="mr-2 size-4" />
                Iniciar viaje
              </Button>
            )}
            {canUpdateLocation && (
              <Button variant="outline" onClick={() => setUpdateLocationOpen(true)}>
                <MapPin className="mr-2 size-4" />
                Actualizar ubicación
              </Button>
            )}
            {canFinishTrip && (
              <Button variant="outline" onClick={() => setFinishTripOpen(true)}>
                <CheckCircle className="mr-2 size-4" />
                Finalizar viaje
              </Button>
            )}
            {canReviewTrip && (
              <Button onClick={() => setReviewTripOpen(true)}>
                <FileCheck className="mr-2 size-4" />
                Revisar viaje
              </Button>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ruta */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RouteIcon className="size-4" />
              <span>Ruta</span>
            </div>
            <p className="font-medium">{routeName}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {originName} → {destinationName}
            </div>
          </div>

          {/* Conductor */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>Conductor</span>
            </div>
            <p className="font-medium">{driverName}</p>
          </div>

          {/* Supervisor */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>Supervisor</span>
            </div>
            <p className="font-medium">{supervisorName}</p>
          </div>

          {/* Vehículo */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="size-4" />
              <span>Vehículo</span>
            </div>
            <p className="font-medium">{vehiclePlate}</p>
          </div>
        </div>
      </Card>

      {/* Detalles del viaje */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fechas y tiempos */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="size-5" />
            Fechas y tiempos
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fecha de inicio:</span>
              <span className="text-sm font-medium">
                {trip.startTime ? formatDate(trip.startTime) : "No iniciado"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fecha de fin:</span>
              <span className="text-sm font-medium">
                {trip.endTime ? formatDate(trip.endTime) : "No finalizado"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Creado:</span>
              <span className="text-sm font-medium">
                {trip.createdAt ? formatDate(trip.createdAt) : "N/A"}
              </span>
            </div>
          </div>
        </Card>

        {/* Métricas de combustible */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Fuel className="size-5" />
            Combustible
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estimado:</span>
              <span className="text-sm font-medium">
                {trip.fuelEstimated?.toFixed(2) || 0} L
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Real:</span>
              <span className="text-sm font-medium">
                {trip.fuelActual ? `${trip.fuelActual.toFixed(2)} L` : "N/A"}
              </span>
            </div>
            {trip.fuelEstimated && trip.fuelActual && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Desviación:</span>
                <span
                  className={`text-sm font-semibold ${
                    ((trip.fuelActual - trip.fuelEstimated) / trip.fuelEstimated * 100) > 3
                      ? "text-destructive"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {((trip.fuelActual - trip.fuelEstimated) / trip.fuelEstimated * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Odómetro y distancia */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gauge className="size-5" />
            Odómetro y distancia
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Odómetro inicial:</span>
              <span className="text-sm font-medium">
                {trip.odometerStart?.toFixed(1) || 0} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Odómetro final:</span>
              <span className="text-sm font-medium">
                {trip.odometerEnd ? `${trip.odometerEnd.toFixed(1)} km` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Distancia planificada:</span>
              <span className="text-sm font-medium">
                {trip.distanceKmPlanned?.toFixed(2) || 0} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Distancia real:</span>
              <span className="text-sm font-medium">
                {trip.distanceKmReal ? `${trip.distanceKmReal.toFixed(2)} km` : "N/A"}
              </span>
            </div>
            {statusNumber === 2 && trip.currentDistance !== undefined && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Distancia actual:</span>
                <span className="text-sm font-medium text-primary">
                  {trip.currentDistance?.toFixed(2) || 0} km
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Ubicación actual (solo si está en ruta) */}
        {statusNumber === 2 && (trip.currentLat || trip.currentLng) && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="size-5" />
              Ubicación actual
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Latitud:</span>
                <span className="text-sm font-medium font-mono">
                  {trip.currentLat?.toFixed(6) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Longitud:</span>
                <span className="text-sm font-medium font-mono">
                  {trip.currentLng?.toFixed(6) || "N/A"}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Comentario de revisión (solo si está revisado o en revisión) */}
        {(statusNumber === 3 || statusNumber === 4) && trip.reviewComment && (
          <Card className="p-6 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileCheck className="size-5" />
              Comentario de revisión
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {trip.reviewComment}
            </p>
          </Card>
        )}
      </div>

      {/* Mapa de la ruta (solo si tenemos datos de la ruta) */}
      {routeData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <RouteIcon className="size-5" />
              Mapa de la ruta
            </h3>
          </div>
          <div className={`rounded-xl border overflow-hidden ${shouldShowDirections ? 'h-[600px]' : 'h-[500px]'} bg-muted/20 relative`}>
            {/* Contenedor del mapa - siempre ocupa todo el espacio */}
            <div className="absolute inset-0 w-full h-full">
              <MapContainer
                center={
                  (() => {
                    const originLat = trip?.originLat ?? routeData?.originLat;
                    const originLng = trip?.originLng ?? routeData?.originLng;
                    const destLat = trip?.destinationLat ?? routeData?.destinationLat;
                    const destLng = trip?.destinationLng ?? routeData?.destinationLng;
                    
                    if (originLat && destLat) {
                      return [(originLat + destLat) / 2, (originLng + destLng) / 2];
                    } else if (originLat) {
                      return [originLat, originLng];
                    }
                    return [-1.8312, -78.1834];
                  })()
                }
                zoom={8}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© OpenStreetMap'
                />
                
                <TripRouteMap
                  routeData={routeData}
                  currentLocation={
                    statusNumber === 2 && trip.currentLat && trip.currentLng
                      ? { lat: trip.currentLat, lng: trip.currentLng }
                      : null
                  }
                  statusNumber={statusNumber}
                  trip={trip}
                  isDriver={isDriver}
                  showDirections={shouldShowDirections}
                />

              {/* Marcador de origen */}
              {(trip?.originLat ?? routeData?.originLat) && (trip?.originLng ?? routeData?.originLng) && (
                <Marker
                  position={[trip?.originLat ?? routeData.originLat, trip?.originLng ?? routeData.originLng]}
                  icon={L.icon({
                    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>Origen: {originName}</Popup>
                </Marker>
              )}

              {/* Marcador de ubicación actual (si está en ruta) */}
              {statusNumber === 2 && trip.currentLat && trip.currentLng && (
                <Marker
                  position={[trip.currentLat, trip.currentLng]}
                  icon={L.icon({
                    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>
                    Ubicación actual del conductor
                    {trip.currentDistance !== undefined && (
                      <><br />Distancia recorrida: {trip.currentDistance.toFixed(2)} km</>
                    )}
                  </Popup>
                </Marker>
              )}

              {/* Marcador de destino */}
              {(trip?.destinationLat ?? routeData?.destinationLat) && (trip?.destinationLng ?? routeData?.destinationLng) && (
                <Marker
                  position={[trip?.destinationLat ?? routeData.destinationLat, trip?.destinationLng ?? routeData.destinationLng]}
                  icon={L.icon({
                    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>Destino: {destinationName}</Popup>
                </Marker>
              )}
              </MapContainer>
            </div>

          </div>
          <div className="w-full px-4 pt-4">
            {statusNumber === 2 && trip.currentLat && trip.currentLng && (
              <p className="text-xs text-muted-foreground">
                🟢 Verde: Origen | 🔵 Azul: Ubicación actual | 🟠 Naranja: Destino
                <br />
                La línea <span className="font-medium text-green-600">verde sólida</span> muestra la ruta recorrida desde el origen hasta tu ubicación actual.
                <br />
                La línea <span className="font-medium text-blue-600">azul punteada</span> muestra la ruta planificada completa (origen → destino).
              </p>
            )}
            {statusNumber !== 2 && (
              <p className="text-xs text-muted-foreground">
                🟢 Verde: Origen | 🟠 Naranja: Destino
                <br />
                La línea <span className="font-medium text-blue-600">azul punteada</span> muestra la ruta completa planificada.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Modales */}
      {trip && (
        <>
          <StartTripModal
            trip={trip}
            open={startTripOpen}
            onOpenChange={setStartTripOpen}
            onSuccess={handleActionSuccess}
          />
          <UpdateLocationModal
            trip={trip}
            open={updateLocationOpen}
            onOpenChange={setUpdateLocationOpen}
            onSuccess={handleActionSuccess}
          />
          <FinishTripModal
            trip={trip}
            open={finishTripOpen}
            onOpenChange={setFinishTripOpen}
            onSuccess={handleActionSuccess}
          />
          <ReviewTripModal
            trip={trip}
            open={reviewTripOpen}
            onOpenChange={setReviewTripOpen}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </div>
  );
}

