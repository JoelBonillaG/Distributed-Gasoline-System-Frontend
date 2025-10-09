import React from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/shadcn/sheet";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2, Gauge, Fuel, Calendar, Tag, Car } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

const STATUS_MAP = {
  ACTIVE: "Activo",
  MAINTENANCE: "Mantenimiento",
  INACTIVE: "Inactivo",
  RETIRED: "Retirado",
  ON_ROUTE: "En Ruta",
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "ON_ROUTE":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "MAINTENANCE":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    case "INACTIVE":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    case "RETIRED":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

const MACHINE_TYPE_MAP = {
  HEAVY: "Pesada",
  LIGHT: "Liviana",
};

const ENGINE_TYPE_MAP = {
  DIESEL: "Diesel",
  GASOLINE: "Gasolina",
  HYBRID: "Híbrido",
};

export default function ViewUnitDrawer({ open, onOpenChange, vehicleId }) {
  const [unit, setUnit] = React.useState(null);
  const [modelInfo, setModelInfo] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (open && vehicleId) {
      loadUnit();
    }
  }, [open, vehicleId]);

  const loadUnit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehiclesService.getUnitById(vehicleId);
      setUnit(data);

      // Cargar información del modelo
      if (data.modelId) {
        try {
          const model = await vehiclesService.getVehicleById(data.modelId);
          setModelInfo(model);
        } catch (error) {
          console.error("Error al cargar modelo:", error);
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al cargar unidad";
      setError(msg);
    } finally {
      setIsLoading(false);
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
          ) : unit ? (
            <div className="space-y-4">
              {/* Título genérico */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  Detalles de la Unidad
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información completa de la unidad de vehículo
                </p>
              </div>

              {/* Cuadro principal sin tabs */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                {/* SECCIÓN: Información de la Unidad */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Tag className="size-4 text-primary" />
                    Información de la Unidad
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">ID de Unidad</p>
                      <p className="text-sm font-medium">{unit.vehicleId}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Placa del Vehículo</p>
                      <p className="text-base font-bold text-orange-600">{unit.plate}</p>
                    </div>
                    {unit.serialVin && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">VIN/Serial</p>
                        <p className="text-sm font-medium font-mono">{unit.serialVin}</p>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Capacidad del Tanque</p>
                      <p className="text-sm font-medium">{unit.tankCapacityL} L</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gauge className="size-3" />
                        Odómetro Actual
                      </p>
                      <p className="text-sm font-medium">{unit.odometerKm.toLocaleString()} km</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Estado Operacional</p>
                      <Badge className={getStatusBadgeColor(unit.operationalStatus)}>
                        {STATUS_MAP[unit.operationalStatus] || unit.operationalStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: Información del Modelo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    Modelo Asociado
                  </h3>
                  {modelInfo ? (
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm font-medium text-foreground">
                          {modelInfo.brand} {modelInfo.family}
                          {modelInfo.trim && ` ${modelInfo.trim}`}
                        </p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {modelInfo.yearFrom}{modelInfo.yearTo && ` - ${modelInfo.yearTo}`}
                          </span>
                          <span>•</span>
                          <span>{MACHINE_TYPE_MAP[modelInfo.machineType] || modelInfo.machineType}</span>
                          <span>•</span>
                          <span>ID: {modelInfo.modelId}</span>
                        </div>
                      </div>

                      {modelInfo.engine && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Tipo de Motor</p>
                            <p className="text-sm font-medium">
                              {ENGINE_TYPE_MAP[modelInfo.engine.engineType] || modelInfo.engine.engineType}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Cilindrada</p>
                            <p className="text-sm font-medium">{modelInfo.engine.displacementCc} cc</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Potencia</p>
                            <p className="text-sm font-medium">{modelInfo.engine.powerHp} HP</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Consumo Base del Modelo</p>
                            <p className="text-sm font-medium">{modelInfo.engine.baselineLPer100km} L/100km</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Cargando información del modelo...</p>
                  )}
                </div>

                <Separator />

                {/* SECCIÓN: Consumo de Combustible */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Fuel className="size-4 text-primary" />
                    Consumo de Combustible
                  </h3>
                  {unit.consumption ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {unit.consumption.effectiveLPer100km !== undefined && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Consumo Efectivo Actual</p>
                          <p className="text-sm font-medium text-primary">
                            {unit.consumption.effectiveLPer100km.toFixed(2)} L/100km
                          </p>
                        </div>
                      )}

                      {unit.consumption.baselineModelLPer100km && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Consumo Base del Modelo</p>
                          <p className="text-sm font-medium">{unit.consumption.baselineModelLPer100km.toFixed(2)} L/100km</p>
                        </div>
                      )}

                      {unit.consumption.baselineOverrideLPer100km && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Consumo Base Personalizado</p>
                          <p className="text-sm font-medium">{unit.consumption.baselineOverrideLPer100km.toFixed(2)} L/100km</p>
                        </div>
                      )}

                      {unit.consumption.calibrationK !== undefined && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Factor de Calibración (K)</p>
                          <p className="text-sm font-medium">{unit.consumption.calibrationK.toFixed(5)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay información de consumo disponible</p>
                  )}
                </div>

                <Separator />

                {/* SECCIÓN: Metadatos */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">Información del Sistema</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {unit.createdAt && (
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Fecha de Creación</p>
                        <p className="font-medium">
                          {new Date(unit.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {unit.updatedAt && (
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Última Actualización</p>
                        <p className="font-medium">
                          {new Date(unit.updatedAt).toLocaleString()}
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
