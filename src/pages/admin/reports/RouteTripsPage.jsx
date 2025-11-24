import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Route, Loader2, Users, Calendar, Truck, Fuel, Gauge, TrendingUp, BarChart3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import fuelService from "@/services/fuel.service";
import { toast } from "sonner";
import { PageHeading } from "@/components/ui/typography/Heading";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";
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

// Componente para manejar el routing de Leaflet
function LeafletRouting({ trip }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !trip || !trip.originLat || !trip.destinationLat) return;

    try {
      if (L.Routing && L.Routing.control) {
        // Limpiar control anterior si existe
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        }

        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(trip.originLat, trip.originLng),
            L.latLng(trip.destinationLat, trip.destinationLng),
          ],
          language: "es",
          lineOptions: {
            addWaypoints: false,
            styles: [{ color: "#3b82f6", weight: 4, opacity: 0.8 }],
          },
          routeWhileDragging: false,
          draggableWaypoints: false,
          createMarker: () => null,
          show: false,
        }).addTo(map);
      }
    } catch (error) {
      console.error("Error al crear ruta:", error);
    }

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
  }, [map, trip]);

  return null;
}

// Componente para ajustar el zoom del mapa según la ruta
function MapBounds({ trip }) {
  const map = useMap();

  useEffect(() => {
    if (!trip || !trip.originLat || !trip.destinationLat) return;

    const bounds = [
      [trip.originLat, trip.originLng],
      [trip.destinationLat, trip.destinationLng],
    ];

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, trip]);

  return null;
}

const RouteTripsPage = () => {
  const navigate = useNavigate();
  const { routeId } = useParams();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    const fetchRouteTrips = async () => {
      if (!routeId) {
        toast.error("ID de ruta no proporcionado");
        navigate("/dashboard");
        return;
      }

      setLoading(true);
      try {
        // Obtener el nombre de la ruta desde el resumen primero
        try {
          const summaryResponse = await fuelService.getRoutesSummaryReport();
          const routeFromSummary = summaryResponse.routes?.find(
            (r) => r.routeId === Number(routeId)
          );
          if (routeFromSummary?.routeName) {
            setRouteName(routeFromSummary.routeName);
          } else {
            setRouteName(`Ruta #${routeId}`);
          }
        } catch (summaryError) {
          console.warn("No se pudo obtener el nombre de la ruta:", summaryError);
          setRouteName(`Ruta #${routeId}`);
        }

        // Obtener los viajes de la ruta
        const response = await fuelService.getRouteTrips(Number(routeId));
        const tripsData = response.trips || [];
        setTrips(tripsData);
      } catch (error) {
        console.error("Error al obtener viajes de la ruta:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al cargar los viajes de la ruta";
        toast.error(errorMessage);

        if (error.response?.status === 400 || error.response?.status === 404) {
          setTimeout(() => navigate("/dashboard"), 2000);
        }

        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteTrips();
  }, [routeId, navigate]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      EN_RUTA: {
        label: "En Ruta",
        variant: "default",
        className: "bg-blue-500 hover:bg-blue-600",
      },
      TERMINADO: {
        label: "Terminado",
        variant: "default",
        className: "bg-green-500 hover:bg-green-600",
      },
      CREADO: {
        label: "Creado",
        variant: "default",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      EN_REVISION: {
        label: "En Revisión",
        variant: "default",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "secondary",
      className: "",
    };

    return (
      <Badge className={config.className || ""} variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString.includes("NaN")) {
      return "N/A";
    }
    return timeString;
  };

  // Calcular estadísticas generales
  const totalTrips = trips.length;
  const totalEstimated = trips.reduce((sum, trip) => sum + (trip.estimated || 0), 0);
  const totalActual = trips
    .filter((trip) => trip.actual > 0)
    .reduce((sum, trip) => sum + (trip.actual || 0), 0);
  const averageEfficiency =
    trips.filter((trip) => trip.efficiency && trip.efficiency > 0).length > 0
      ? trips
          .filter((trip) => trip.efficiency && trip.efficiency > 0)
          .reduce((sum, trip) => sum + (trip.efficiency || 0), 0) /
        trips.filter((trip) => trip.efficiency && trip.efficiency > 0).length
      : 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={routeName || `Viajes de la Ruta #${routeId}`}
        subtitle="Detalle de viajes realizados en esta ruta"
        icon={Route}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Viajes
                </p>
                <p className="text-2xl font-bold">{totalTrips}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950">
                <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Combustible Estimado
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalEstimated.toLocaleString("es-ES", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  L
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950">
                <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Combustible Real
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalActual > 0
                    ? `${totalActual.toLocaleString("es-ES", {
                        maximumFractionDigits: 2,
                      })} L`
                    : "N/A"}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-50 dark:bg-green-950">
                <Fuel className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Eficiencia Promedio
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {averageEfficiency > 0
                    ? `${averageEfficiency.toLocaleString("es-ES", {
                        maximumFractionDigits: 2,
                      })}%`
                    : "N/A"}
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950">
                <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa de la ruta */}
      {trips.length > 0 &&
        trips[0]?.originLat &&
        trips[0]?.originLng &&
        trips[0]?.destinationLat &&
        trips[0]?.destinationLng && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de la Ruta
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualización de la ruta: {trips[0].originName || "Origen"} →{" "}
                {trips[0].destinationName || "Destino"}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-md overflow-hidden border"
                style={{ height: "400px" }}
              >
                <MapContainer
                  center={[
                    (trips[0].originLat + trips[0].destinationLat) / 2,
                    (trips[0].originLng + trips[0].destinationLng) / 2,
                  ]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                  />
                  <MapBounds trip={trips[0]} />
                  <Marker
                    position={[trips[0].originLat, trips[0].originLng]}
                    icon={originIcon}
                  >
                    <Popup>
                      Origen: {trips[0].originName || "Punto de origen"}
                    </Popup>
                  </Marker>
                  <Marker
                    position={[
                      trips[0].destinationLat,
                      trips[0].destinationLng,
                    ]}
                    icon={destinationIcon}
                  >
                    <Popup>
                      Destino: {trips[0].destinationName || "Punto de destino"}
                    </Popup>
                  </Marker>
                  <LeafletRouting trip={trips[0]} />
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Tabla de viajes */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Viajes de la Ruta #{routeId}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Detalle de todos los viajes realizados en esta ruta.
          </p>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Cargando viajes...
              </span>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay viajes disponibles para esta ruta
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID Viaje</TableHead>
                    <TableHead className="font-semibold">Chofer</TableHead>
                    <TableHead className="font-semibold">Vehículo</TableHead>
                    <TableHead className="font-semibold text-center">
                      Estado
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Inicio
                    </TableHead>
                    <TableHead className="font-semibold text-center">Fin</TableHead>
                    <TableHead className="font-semibold text-center">
                      Estimado (L)
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Real (L)
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Diferencia (L)
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Eficiencia (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => {
                    const hasActualFuel = trip.actual > 0;
                    const isInRoute = trip.status === "EN_RUTA" || !hasActualFuel;

                    return (
                      <TableRow key={trip.tripId}>
                        <TableCell className="font-medium">
                          {trip.tripId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {trip.driverFirstName} {trip.driverLastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span>{trip.vehicle || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(trip.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatTime(trip.startTime)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatTime(trip.endTime)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-blue-700">
                            {trip.estimated.toLocaleString("es-ES", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasActualFuel ? (
                            <span className="text-sm font-medium text-green-700">
                              {trip.actual.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasActualFuel ? (
                            <span
                              className={`text-sm font-medium ${
                                trip.difference >= 0
                                  ? "text-destructive"
                                  : "text-green-600"
                              }`}
                            >
                              {trip.difference >= 0 ? "+" : ""}
                              {trip.difference.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasActualFuel && trip.efficiency ? (
                            <Badge
                              variant="outline"
                              className={`font-medium ${
                                trip.efficiency >= 95
                                  ? "bg-green-50 text-green-700 border-green-300"
                                  : trip.efficiency >= 85
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                  : "bg-red-50 text-red-700 border-red-300"
                              }`}
                            >
                              {trip.efficiency.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteTripsPage;

