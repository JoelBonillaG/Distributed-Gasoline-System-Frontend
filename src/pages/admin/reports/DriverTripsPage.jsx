import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Route,
  Loader2,
  MapPin,
  Calendar,
  Truck,
  Fuel,
  Gauge,
} from "lucide-react";
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
import { Sheet, SheetContent } from "@/components/ui/shadcn/sheet";
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

const DriverTripsPage = () => {
  const navigate = useNavigate();
  const { driverId } = useParams();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const fetchDriverTrips = async () => {
      if (!driverId) {
        toast.error("ID de chofer no proporcionado");
        navigate("/dashboard");
        return;
      }

      setLoading(true);
      try {
        const response = await fuelService.getDriverTrips(Number(driverId));
        const tripsData = response.trips || [];
        setTrips(tripsData);
      } catch (error) {
        console.error("Error al obtener viajes del chofer:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al cargar los viajes del chofer";
        toast.error(errorMessage);

        if (error.response?.status === 400 || error.response?.status === 404) {
          setTimeout(() => navigate("/dashboard"), 2000);
        }

        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverTrips();
  }, [driverId, navigate]);

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

  const formatRoute = (trip) => {
    const origin = trip.originName?.trim();
    const destination = trip.destinationName?.trim();

    if (origin && destination) {
      return `${origin} → ${destination}`;
    }

    if (origin || destination) {
      return origin || destination || "N/A";
    }

    // Si no hay nombres, usar coordenadas como fallback
    if (
      trip.originLat !== undefined &&
      trip.originLng !== undefined &&
      trip.destinationLat !== undefined &&
      trip.destinationLng !== undefined
    ) {
      return `(${trip.originLat.toFixed(4)}, ${trip.originLng.toFixed(
        4
      )}) → (${trip.destinationLat.toFixed(4)}, ${trip.destinationLng.toFixed(
        4
      )})`;
    }

    return "N/A";
  };

  const calculateDifference = (estimated, actual) => {
    return actual - estimated;
  };

  const calculateEfficiency = (estimated, actual) => {
    if (estimated === 0) return 0;
    return ((estimated / actual) * 100).toFixed(1);
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString.includes("NaN")) {
      return "N/A";
    }
    return timeString;
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={`Viajes del Chofer #${driverId}`}
        subtitle="Detalle de viajes y consumo de combustible"
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

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Viajes del Chofer #{driverId}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Detalle de viajes con información de consumo estimado y real.
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
              No hay viajes disponibles para este chofer
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID Viaje</TableHead>
                    <TableHead className="font-semibold">Vehículo</TableHead>
                    <TableHead className="font-semibold">Ruta</TableHead>
                    <TableHead className="font-semibold text-center">
                      Estado
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Inicio
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Fin
                    </TableHead>
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
                    const isInRoute =
                      trip.status === "EN_RUTA" || trip.fuelActual === 0;

                    const difference = isInRoute
                      ? null
                      : calculateDifference(
                          trip.fuelEstimated,
                          trip.fuelActual
                        );

                    const efficiency = isInRoute
                      ? null
                      : calculateEfficiency(
                          trip.fuelEstimated,
                          trip.fuelActual
                        );

                    return (
                      <TableRow
                        key={trip.tripId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setIsSheetOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {trip.tripId}
                        </TableCell>
                        <TableCell>{trip.vehicle || "N/A"}</TableCell>
                        <TableCell>{formatRoute(trip)}</TableCell>
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
                          {trip.fuelEstimated.toLocaleString("es-ES", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {isInRoute
                            ? "N/A"
                            : trip.fuelActual.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}
                        </TableCell>
                        <TableCell className="text-center">
                          {isInRoute ? (
                            "N/A"
                          ) : (
                            <span
                              className={`font-medium ${
                                difference >= 0
                                  ? "text-destructive"
                                  : "text-green-600"
                              }`}
                            >
                              {difference >= 0 ? "+" : ""}
                              {difference.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isInRoute ? "N/A" : `${efficiency}%`}
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

      {/* Panel de detalles del viaje */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl flex flex-col overflow-y-auto"
        >
          {selectedTrip ? (
            <div className="space-y-6 px-6 py-6">
              {/* Título */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  Detalles del Viaje
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información completa del viaje #{selectedTrip.tripId}
                </p>
              </div>

              {/* Cuadro principal */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                {/* SECCIÓN: Información General */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Truck className="size-4 text-primary" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        ID del Viaje
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTrip.tripId}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Vehículo</p>
                      <p className="text-sm font-bold text-orange-600">
                        {selectedTrip.vehicle || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Estado</p>
                      {getStatusBadge(selectedTrip.status)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: Tiempos */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    Horario
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Hora de Inicio
                      </p>
                      <p className="text-sm font-medium">
                        {formatTime(selectedTrip.startTime)}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Hora de Fin
                      </p>
                      <p className="text-sm font-medium">
                        {formatTime(selectedTrip.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: Combustible */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Fuel className="size-4 text-primary" />
                    Consumo de Combustible
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Combustible Estimado
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {selectedTrip.fuelEstimated.toLocaleString("es-ES", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        L
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Combustible Real
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTrip.status === "EN_RUTA" ||
                        selectedTrip.fuelActual === 0
                          ? "N/A"
                          : `${selectedTrip.fuelActual.toLocaleString("es-ES", {
                              maximumFractionDigits: 2,
                            })} L`}
                      </p>
                    </div>
                    {selectedTrip.status !== "EN_RUTA" &&
                      selectedTrip.fuelActual > 0 && (
                        <>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Diferencia
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                calculateDifference(
                                  selectedTrip.fuelEstimated,
                                  selectedTrip.fuelActual
                                ) >= 0
                                  ? "text-destructive"
                                  : "text-green-600"
                              }`}
                            >
                              {calculateDifference(
                                selectedTrip.fuelEstimated,
                                selectedTrip.fuelActual
                              ) >= 0
                                ? "+"
                                : ""}
                              {calculateDifference(
                                selectedTrip.fuelEstimated,
                                selectedTrip.fuelActual
                              ).toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              L
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Gauge className="size-3" />
                              Eficiencia
                            </p>
                            <p className="text-sm font-medium">
                              {calculateEfficiency(
                                selectedTrip.fuelEstimated,
                                selectedTrip.fuelActual
                              )}
                              %
                            </p>
                          </div>
                        </>
                      )}
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: Ubicaciones */}
                {(selectedTrip.originName || selectedTrip.destinationName) && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        Ubicaciones
                      </h3>
                      <div className="grid grid-cols-1 gap-y-2.5">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            Origen
                          </p>
                          <p className="text-sm font-medium">
                            {selectedTrip.originName || "N/A"}
                            {selectedTrip.originLat &&
                              selectedTrip.originLng && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({selectedTrip.originLat.toFixed(4)},{" "}
                                  {selectedTrip.originLng.toFixed(4)})
                                </span>
                              )}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            Destino
                          </p>
                          <p className="text-sm font-medium">
                            {selectedTrip.destinationName || "N/A"}
                            {selectedTrip.destinationLat &&
                              selectedTrip.destinationLng && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({selectedTrip.destinationLat.toFixed(4)},{" "}
                                  {selectedTrip.destinationLng.toFixed(4)})
                                </span>
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
              </div>

              {/* Mapa */}
              {selectedTrip.originLat &&
                selectedTrip.originLng &&
                selectedTrip.destinationLat &&
                selectedTrip.destinationLng && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      Mapa de la Ruta
                    </h3>
                    <div
                      className="rounded-md overflow-hidden border"
                      style={{ height: "400px" }}
                    >
                      <MapContainer
                        center={[
                          (selectedTrip.originLat +
                            selectedTrip.destinationLat) /
                            2,
                          (selectedTrip.originLng +
                            selectedTrip.destinationLng) /
                            2,
                        ]}
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="© OpenStreetMap"
                        />
                        <MapBounds trip={selectedTrip} />
                        <Marker
                          position={[
                            selectedTrip.originLat,
                            selectedTrip.originLng,
                          ]}
                          icon={originIcon}
                        >
                          <Popup>
                            Origen:{" "}
                            {selectedTrip.originName || "Punto de origen"}
                          </Popup>
                        </Marker>
                        <Marker
                          position={[
                            selectedTrip.destinationLat,
                            selectedTrip.destinationLng,
                          ]}
                          icon={destinationIcon}
                        >
                          <Popup>
                            Destino:{" "}
                            {selectedTrip.destinationName || "Punto de destino"}
                          </Popup>
                        </Marker>
                        <LeafletRouting trip={selectedTrip} />
                      </MapContainer>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DriverTripsPage;
