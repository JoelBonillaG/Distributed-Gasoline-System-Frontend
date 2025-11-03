import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Truck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import fuelService from "@/services/fuel.service";
import { getRoute } from "@/services/routes.service";
import { toast } from "sonner";
import { PageHeading } from "@/components/ui/typography/Heading";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/shadcn/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix para los iconos de Leaflet en producción
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Iconos personalizados
const originIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Colores diferentes para cada ruta
const routeColors = [
  "#3b82f6", // azul
  "#10b981", // verde
  "#f59e0b", // amarillo
  "#ef4444", // rojo
  "#8b5cf6", // púrpura
  "#ec4899", // rosa
  "#06b6d4", // cyan
  "#f97316", // naranja
];

// Helper para formatear fecha/timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    // Manejar tanto objetos timestamp como strings
    if (typeof timestamp === "object" && timestamp.seconds) {
      const date = new Date(
        timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1e6
      );
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

// Componente para manejar el routing de Leaflet
function LeafletRouting({ route, routeIndex }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !route || !route.originLat || !route.destinationLat) return;

    const color = routeColors[routeIndex % routeColors.length];

    try {
      if (L.Routing && L.Routing.control) {
        // Limpiar control anterior si existe
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        }

        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(route.originLat, route.originLng),
            L.latLng(route.destinationLat, route.destinationLng),
          ],
          language: "es",
          lineOptions: {
            addWaypoints: false,
            styles: [{ color, weight: 4, opacity: 0.8 }],
          },
          routeWhileDragging: false,
          draggableWaypoints: false,
          createMarker: () => null,
          show: false, // No mostrar panel de direcciones
        }).addTo(map);
      }
    } catch (error) {
      console.error("Error al crear ruta:", error);
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
  }, [map, route, routeIndex]);

  return null;
}

// Componente para ajustar el zoom del mapa según la ruta seleccionada
function MapBounds({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route || !route.originLat || !route.destinationLat) return;

    const bounds = [
      [route.originLat, route.originLng],
      [route.destinationLat, route.destinationLng],
    ];

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route]);

  return null;
}

const VehicleRoutesPage = () => {
  const navigate = useNavigate();
  const { vehicleId: vehicleIdParam } = useParams();
  const [searchParams] = useSearchParams();

  const vehicleTypeParam = searchParams.get("type");

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  useEffect(() => {
    const fetchVehicleRoutes = async () => {
      if (!vehicleIdParam) {
        toast.error("Falta el parámetro vehicleId");
        navigate("/dashboard");
        return;
      }

      const vehicleId = Number.parseInt(vehicleIdParam, 10);
      if (Number.isNaN(vehicleId)) {
        toast.error("vehicleId debe ser un número válido");
        navigate("/dashboard");
        return;
      }

      // Validar vehicleType si está presente (debe ser 1, 2 o 3)
      let vehicleType = undefined;
      if (vehicleTypeParam) {
        const parsedType = Number.parseInt(vehicleTypeParam, 10);
        if (![1, 2, 3].includes(parsedType)) {
          toast.error(
            "Tipo de vehículo inválido. Debe ser 1 (Liviano), 2 (Pesado) o 3 (Cualquiera)"
          );
          navigate("/dashboard");
          return;
        }
        vehicleType = parsedType;
      }

      setLoading(true);
      try {
        // Obtener las rutas del vehículo
        const response = await fuelService.getVehicleRoutesReport(
          vehicleId,
          "TERMINADO",
          vehicleType
        );
        const routeSummaries = response.routes || [];

        if (routeSummaries.length === 0) {
          toast.info("Este vehículo no tiene rutas registradas");
          setRoutes([]);
          return;
        }

        // Para cada ruta, obtener las coordenadas completas
        const routesWithCoords = await Promise.all(
          routeSummaries.map(async (routeSummary) => {
            try {
              const fullRoute = await getRoute(routeSummary.routeId);
              return {
                ...routeSummary,
                originLat: fullRoute.originLat,
                originLng: fullRoute.originLng,
                destinationLat: fullRoute.destinationLat,
                destinationLng: fullRoute.destinationLng,
                trips: routeSummary.trips || [], // Incluir trips si vienen en la respuesta
              };
            } catch (error) {
              console.error(
                `Error al obtener coordenadas de ruta ${routeSummary.routeId}:`,
                error
              );
              return {
                ...routeSummary,
                trips: routeSummary.trips || [], // Incluir trips incluso si falla obtener coordenadas
              };
            }
          })
        );

        // Filtrar rutas que tienen coordenadas válidas
        const validRoutes = routesWithCoords.filter(
          (r) =>
            r.originLat && r.originLng && r.destinationLat && r.destinationLng
        );

        setRoutes(validRoutes);
        // Seleccionar la primera ruta por defecto
        if (validRoutes.length > 0) {
          setSelectedRoute(validRoutes[0]);
        }
      } catch (error) {
        console.error("Error al obtener rutas del vehículo:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al cargar las rutas del vehículo";
        toast.error(errorMessage);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleRoutes();
  }, [vehicleIdParam, vehicleTypeParam, navigate]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={`Rutas del Vehículo #${vehicleIdParam || ""}`}
        subtitle="Visualización de todas las rutas realizadas por este vehículo"
        icon={Truck}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            No hay rutas disponibles para este vehículo
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Lista de rutas con estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Rutas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {routes.length}{" "}
                {routes.length === 1 ? "ruta encontrada" : "rutas encontradas"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routes.map((route, index) => {
                  const color = routeColors[index % routeColors.length];
                  const isSelected = selectedRoute?.routeId === route.routeId;
                  const isExpanded = expandedRouteId === route.routeId;
                  const hasTrips = route.trips && route.trips.length > 0;
                  console.log("hasTrips", route);

                  return (
                    <div
                      key={route.routeId}
                      className={`border rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div
                        onClick={() => setSelectedRoute(route)}
                        className="flex items-center gap-4 p-4 cursor-pointer"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{route.routeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {route.originName} → {route.destinationName}
                          </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Estimado
                            </div>
                            <div className="font-medium">
                              {(route.estimated ?? 0).toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              L
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Real</div>
                            <div className="font-medium">
                              {(route.actual ?? 0).toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              L
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Diferencia
                            </div>
                            <div
                              className={`font-medium ${
                                (route.difference ?? 0) >= 0
                                  ? "text-destructive"
                                  : "text-green-600"
                              }`}
                            >
                              {(route.difference ?? 0) >= 0 ? "+" : ""}
                              {(route.difference ?? 0).toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              L
                            </div>
                          </div>
                        </div>
                        {hasTrips && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRouteId(
                                isExpanded ? null : route.routeId
                              );
                            }}
                            className="ml-2 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Ocultar viajes
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Extender viajes
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Sección de viajes expandible */}
                      {isExpanded && hasTrips && (
                        <div className="border-t bg-muted/30 p-4">
                          <div className="text-sm font-medium mb-3">
                            Viajes ({route.trips.length})
                          </div>
                          <div className="space-y-2">
                            {route.trips.map((trip, tripIndex) => (
                              <div
                                key={trip.id || tripIndex}
                                className="p-3 bg-background rounded-lg border space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      Viaje #{trip.id || tripIndex + 1}
                                    </div>
                                    {(trip.driverFirstName ||
                                      trip.driverLastName) && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Conductor: {trip.driverFirstName || ""}{" "}
                                        {trip.driverLastName || ""}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-6 text-sm">
                                    <div>
                                      <div className="text-muted-foreground text-xs">
                                        Estimado
                                      </div>
                                      <div className="font-medium">
                                        {trip.fuelEstimated?.toLocaleString(
                                          "es-ES",
                                          {
                                            maximumFractionDigits: 2,
                                          }
                                        ) || "0.00"}{" "}
                                        L
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs">
                                        Real
                                      </div>
                                      <div className="font-medium">
                                        {trip.fuelActual?.toLocaleString(
                                          "es-ES",
                                          {
                                            maximumFractionDigits: 2,
                                          }
                                        ) || "—"}
                                        {trip.fuelActual !== undefined &&
                                          trip.fuelActual !== null &&
                                          " L"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs">
                                        Diferencia
                                      </div>
                                      <div
                                        className={`font-medium ${
                                          (trip.difference ?? 0) >= 0
                                            ? "text-destructive"
                                            : "text-green-600"
                                        }`}
                                      >
                                        {(trip.difference ?? 0) >= 0 ? "+" : ""}
                                        {(trip.difference ?? 0).toLocaleString(
                                          "es-ES",
                                          {
                                            maximumFractionDigits: 2,
                                          }
                                        )}{" "}
                                        L
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Información adicional del viaje */}
                                {(trip.startTime || trip.endTime) && (
                                  <div className="flex gap-6 text-xs border-t pt-2">
                                    {trip.startTime && (
                                      <div>
                                        <div className="text-muted-foreground">
                                          Inicio
                                        </div>
                                        <div className="font-medium">
                                          {formatTimestamp(trip.startTime)}
                                        </div>
                                      </div>
                                    )}
                                    {trip.endTime && (
                                      <div>
                                        <div className="text-muted-foreground">
                                          Fin
                                        </div>
                                        <div className="font-medium">
                                          {formatTimestamp(trip.endTime)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Mapa de Rutas
                {selectedRoute && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    - {selectedRoute.routeName}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Haz clic en una ruta del resumen para visualizarla en el mapa
              </p>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative w-full h-[600px] rounded-xl border overflow-hidden bg-muted/20">
                <MapContainer
                  center={[-1.8312, -78.1834]} // Ecuador por defecto
                  zoom={7}
                  style={{ height: "100%", width: "100%", zIndex: 1 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                  />

                  {selectedRoute && (
                    <>
                      <MapBounds route={selectedRoute} />
                      <LeafletRouting
                        route={selectedRoute}
                        routeIndex={routes.findIndex(
                          (r) => r.routeId === selectedRoute.routeId
                        )}
                      />

                      {selectedRoute.originLat && selectedRoute.originLng && (
                        <Marker
                          position={[
                            selectedRoute.originLat,
                            selectedRoute.originLng,
                          ]}
                          icon={originIcon}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong>Origen:</strong>{" "}
                              {selectedRoute.originName || "Sin nombre"}
                              <br />
                              <strong>Ruta:</strong> {selectedRoute.routeName}
                            </div>
                          </Popup>
                        </Marker>
                      )}

                      {selectedRoute.destinationLat &&
                        selectedRoute.destinationLng && (
                          <Marker
                            position={[
                              selectedRoute.destinationLat,
                              selectedRoute.destinationLng,
                            ]}
                            icon={destinationIcon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <strong>Destino:</strong>{" "}
                                {selectedRoute.destinationName || "Sin nombre"}
                                <br />
                                <strong>Ruta:</strong> {selectedRoute.routeName}
                              </div>
                            </Popup>
                          </Marker>
                        )}
                    </>
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VehicleRoutesPage;
