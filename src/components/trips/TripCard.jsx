import React from "react";
import { Card } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Eye, MapPin, User, Truck, UserCircle } from "lucide-react";

// Mapeo de status a colores y texto
const STATUS_CONFIG = {
  1: { label: "Creado", className: "bg-gray-500 text-white hover:bg-gray-600" }, // CREADO
  2: { label: "En Ruta", className: "bg-blue-500 text-white hover:bg-blue-600" }, // EN_RUTA
  3: { label: "En Revisión", className: "bg-orange-500 text-white hover:bg-orange-600" }, // EN_REVISION
  4: { label: "Terminado", className: "bg-green-500 text-white hover:bg-green-600" }, // TERMINADO
};

// Función para formatear fecha
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanos / 1e6);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "N/A";
  }
};

export default function TripCard({ trip, onView }) {
  // El status puede venir como número (1, 2, 3, 4) o como string desde el backend
  // Normalizar a número
  let statusNumber = trip.status;
  if (typeof statusNumber === 'string') {
    // Si viene como string, convertir a número
    const statusMap = {
      'CREADO': 1,
      'EN_RUTA': 2,
      'EN_REVISION': 3,
      'TERMINADO': 4
    };
    statusNumber = statusMap[statusNumber] || 1;
  } else if (typeof statusNumber === 'number') {
    statusNumber = statusNumber;
  } else {
    statusNumber = 1; // Default a CREADO
  }
  
  const statusConfig = STATUS_CONFIG[statusNumber] || STATUS_CONFIG[1];

  // En estado 2 (EN_RUTA), mostrar distancia actual si está disponible
  const showProgress = statusNumber === 2 && trip.currentDistance !== undefined;
  
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group">
      <div className="p-4 space-y-3">
        {/* Header: ID y Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Viaje #{trip.id}
          </span>
          <Badge variant="default" className={`text-xs ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Ruta */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="font-medium line-clamp-1">
              {trip.routeName || `Ruta ${trip.routeId || "N/A"}`}
            </span>
          </div>
        </div>

        {/* Metadatos: Conductor, Supervisor, Vehículo */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          {/* Conductor */}
          {trip.driverFirstName || trip.driverLastName ? (
            <div className="flex items-center gap-2">
              <UserCircle className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Cond: {trip.driverFirstName} {trip.driverLastName}
              </span>
            </div>
          ) : trip.driverInfo ? (
            <div className="flex items-center gap-2">
              <UserCircle className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Cond: {trip.driverInfo.firstName} {trip.driverInfo.lastName}
              </span>
            </div>
          ) : trip.driverId ? (
            <div className="flex items-center gap-2">
              <UserCircle className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Cond: #{trip.driverId}
              </span>
            </div>
          ) : null}

          {/* Supervisor */}
          {trip.supervisorFirstName || trip.supervisorLastName ? (
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Sup: {trip.supervisorFirstName} {trip.supervisorLastName}
              </span>
            </div>
          ) : trip.supervisorInfo ? (
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Sup: {trip.supervisorInfo.firstName} {trip.supervisorInfo.lastName}
              </span>
            </div>
          ) : trip.supervisorId ? (
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Supervisor #{trip.supervisorId}
              </span>
            </div>
          ) : null}

          {/* Vehículo */}
          {trip.vehiclePlate ? (
            <div className="flex items-center gap-2">
              <Truck className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {trip.vehiclePlate}
              </span>
            </div>
          ) : trip.vehicleInfo ? (
            <div className="flex items-center gap-2">
              <Truck className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {trip.vehicleInfo.plate || "N/A"}
              </span>
            </div>
          ) : trip.vehicleId ? (
            <div className="flex items-center gap-2">
              <Truck className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Vehículo #{trip.vehicleId}
              </span>
            </div>
          ) : null}
        </div>

        {/* Progreso (solo EN_RUTA) */}
        {showProgress && trip.distanceKmPlanned && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">
                {trip.currentDistance?.toFixed(1) || 0} / {trip.distanceKmPlanned?.toFixed(1) || 0} km
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((trip.currentDistance / trip.distanceKmPlanned) * 100 || 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onView && onView(trip)}
          >
            <Eye className="size-3.5 mr-2" />
            Ver detalles
          </Button>
        </div>
      </div>
    </Card>
  );
}

