import React from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/shadcn/sheet";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2, Gauge, Fuel, Calendar, Tag, FileText } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

const MACHINE_TYPE_MAP = {
  HEAVY: "Pesada",
  LIGHT: "Liviana",
};

const STATUS_MAP = {
  ACTIVE: "Activo",
  DEPRECATED: "Deprecado",
};

const ENGINE_TYPE_MAP = {
  DIESEL: "Diesel",
  GASOLINE: "Gasolina",
  HYBRID: "Híbrido",
};

const getMachineTypeBadgeColor = (type) => {
  return type === "HEAVY"
    ? "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30"
    : "bg-chart-1/20 text-chart-1 hover:bg-chart-1/30";
};

export default function ViewVehicleDrawer({ open, onOpenChange, modelId }) {
  const [vehicle, setVehicle] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (open && modelId) {
      loadVehicle();
    }
  }, [open, modelId]);

  const loadVehicle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehiclesService.getVehicleById(modelId);
      setVehicle(data);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al cargar vehículo";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "DEPRECATED":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
            </div>
          ) : vehicle ? (
            <div className="space-y-4">
              {/* Título genérico */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  Detalles del Modelo
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información completa del modelo de vehículo
                </p>
              </div>

              {/* Cuadro principal sin tabs */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                {/* SECCIÓN: Información General */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Tag className="size-4 text-primary" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">ID del Modelo</p>
                      <p className="text-sm font-medium">{vehicle.modelId}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Marca</p>
                      <p className="text-sm font-bold text-orange-600">{vehicle.brand}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Familia</p>
                      <p className="text-sm font-bold text-orange-600">{vehicle.family}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Versión (Trim)</p>
                      <p className="text-sm font-bold text-orange-600">{vehicle.trim || "N/A"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        Año Desde
                      </p>
                      <p className="text-sm font-medium">{vehicle.yearFrom}</p>
                    </div>
                    {vehicle.yearTo && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          Año Hasta
                        </p>
                        <p className="text-sm font-medium">{vehicle.yearTo}</p>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Tipo de Máquina</p>
                      <Badge variant="outline" className={getMachineTypeBadgeColor(vehicle.machineType)}>
                        {MACHINE_TYPE_MAP[vehicle.machineType] || vehicle.machineType}
                      </Badge>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {STATUS_MAP[vehicle.status] || vehicle.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: Motor */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Fuel className="size-4 text-primary" />
                    Especificaciones del Motor
                  </h3>
                  {vehicle.engine ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Tipo de Motor</p>
                        <p className="text-sm font-medium">
                          {ENGINE_TYPE_MAP[vehicle.engine.engineType] || vehicle.engine.engineType}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Consumo Base</p>
                        <p className="text-sm font-medium text-primary">{vehicle.engine.baselineLPer100km} L/100km</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Cilindrada</p>
                        <p className="text-sm font-medium">{vehicle.engine.displacementCc} cc</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Potencia</p>
                        <p className="text-sm font-medium">{vehicle.engine.powerHp} HP</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay información del motor disponible</p>
                  )}
                </div>

                {/* SECCIÓN: Licencias (solo si hay) */}
                {vehicle.defaultLicenses && vehicle.defaultLicenses.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        Licencias Requeridas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.defaultLicenses.map((license) => {
                          const code = license.licenseTypeCode || license.code;
                          return (
                            <Badge key={code} variant="secondary" className="text-sm px-3 py-1">
                              Licencia {code}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* SECCIÓN: Metadatos */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">Información del Sistema</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {vehicle.createdAt && (
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Fecha de Creación</p>
                        <p className="font-medium">
                          {new Date(vehicle.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {vehicle.updatedAt && (
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Última Actualización</p>
                        <p className="font-medium">
                          {new Date(vehicle.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
