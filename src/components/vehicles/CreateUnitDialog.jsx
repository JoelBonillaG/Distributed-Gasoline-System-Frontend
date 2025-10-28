import React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { Combobox } from "@/components/ui/inputs/combobox";
import { Loader2 } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

// Validadores
const validators = {
  plate: (v) => {
    const s = (v ?? "").trim();
    if (!s) return "La placa es requerida";
    if (!/^[A-Z0-9-]{3,15}$/i.test(s)) return "Formato de placa inválido (3-15 caracteres alfanuméricos)";
    return "";
  },
  modelId: (v) => {
    if (!v) return "El modelo es requerido";
    return "";
  },
  tankCapacityL: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "La capacidad del tanque debe ser numérica";
    if (n <= 0) return "La capacidad debe ser mayor a 0";
    return "";
  },
  odometerKm: (v) => {
    if (!v && v !== 0) return ""; // Opcional
    const n = Number(v);
    if (!Number.isFinite(n)) return "El odómetro debe ser numérico";
    if (n < 0) return "El odómetro no puede ser negativo";
    return "";
  },
  serialVin: (v) => {
    const s = (v ?? "").trim();
    if (s.length > 50) return "El VIN no puede superar 50 caracteres";
    return "";
  },
  baselineOverrideLPer100km: (v) => {
    if (!v && v !== 0) return ""; // Opcional
    const n = Number(v);
    if (!Number.isFinite(n)) return "El consumo base debe ser numérico";
    if (n <= 0) return "El consumo base debe ser mayor a 0";
    return "";
  },
};

export default function CreateUnitDialog({ open, onOpenChange, onSuccess, defaultMachineType = null }) {
  const [isPending, setIsPending] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [models, setModels] = React.useState([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("basic");

  const [formData, setFormData] = React.useState({
    plate: "",
    modelId: "",
    tankCapacityL: 400,
    odometerKm: 0,
    serialVin: "",
    baselineOverrideLPer100km: "",
  });

  const [touched, setTouched] = React.useState({
    plate: false,
    modelId: false,
    tankCapacityL: false,
    odometerKm: false,
    serialVin: false,
    baselineOverrideLPer100km: false,
  });

  const [clientErrors, setClientErrors] = React.useState({
    plate: "",
    modelId: "",
    tankCapacityL: "",
    odometerKm: "",
    serialVin: "",
    baselineOverrideLPer100km: "",
  });

  const [serverErrors, setServerErrors] = React.useState({
    plate: "",
    modelId: "",
    tankCapacityL: "",
    odometerKm: "",
    serialVin: "",
    baselineOverrideLPer100km: "",
  });

  // Cargar modelos disponibles
  React.useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open, defaultMachineType]);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const data = await vehiclesService.getAllVehicles(defaultMachineType);
      // Filtrar solo modelos activos
      const activeModels = (data || []).filter(m => m.status === "ACTIVE");
      setModels(activeModels);
    } catch (e) {
      toast.error("Error al cargar modelos de vehículos");
    } finally {
      setLoadingModels(false);
    }
  };

  // Resetear al abrir
  React.useEffect(() => {
    if (open) {
      setSubmitAttempted(false);
      setFormData({
        plate: "",
        modelId: "",
        tankCapacityL: 400,
        odometerKm: 0,
        serialVin: "",
        baselineOverrideLPer100km: "",
      });
      setTouched({
        plate: false,
        modelId: false,
        tankCapacityL: false,
        odometerKm: false,
        serialVin: false,
        baselineOverrideLPer100km: false,
      });
      setClientErrors({
        plate: "",
        modelId: "",
        tankCapacityL: "",
        odometerKm: "",
        serialVin: "",
        baselineOverrideLPer100km: "",
      });
      setServerErrors({
        plate: "",
        modelId: "",
        tankCapacityL: "",
        odometerKm: "",
        serialVin: "",
        baselineOverrideLPer100km: "",
      });
    }
  }, [open]);

  // Validar en tiempo real
  React.useEffect(() => {
    setClientErrors({
      plate: validators.plate(formData.plate),
      modelId: validators.modelId(formData.modelId),
      tankCapacityL: validators.tankCapacityL(formData.tankCapacityL),
      odometerKm: validators.odometerKm(formData.odometerKm),
      serialVin: validators.serialVin(formData.serialVin),
      baselineOverrideLPer100km: validators.baselineOverrideLPer100km(formData.baselineOverrideLPer100km),
    });
  }, [formData]);

  const handleChange = (field, value) => {
    setServerErrors((prev) => ({ ...prev, [field]: "" }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getError = (field) => {
    const show = touched[field] || submitAttempted;
    return show ? (serverErrors[field] || clientErrors[field]) : "";
  };

  const hasErrors = () => {
    return Object.values(clientErrors).some((err) => err !== "");
  };

  // Función para detectar la primera tab con errores
  const getFirstTabWithError = () => {
    // Errores en tab "basic"
    if (clientErrors.plate || clientErrors.modelId || clientErrors.tankCapacityL ||
        clientErrors.odometerKm || serverErrors.plate || serverErrors.modelId ||
        serverErrors.tankCapacityL || serverErrors.odometerKm) {
      return "basic";
    }

    // Errores en tab "advanced"
    if (clientErrors.serialVin || clientErrors.baselineOverrideLPer100km ||
        serverErrors.serialVin || serverErrors.baselineOverrideLPer100km) {
      return "advanced";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors()) {
      const firstErrorTab = getFirstTabWithError();
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    setIsPending(true);
    setServerErrors({
      plate: "",
      modelId: "",
      tankCapacityL: "",
      odometerKm: "",
      serialVin: "",
      baselineOverrideLPer100km: "",
    });

    try {
      const payload = {
        plate: formData.plate.trim().toUpperCase(),
        modelId: String(formData.modelId),
        tankCapacityL: Number(formData.tankCapacityL),
      };

      // Campos opcionales
      if (formData.odometerKm) {
        payload.odometerKm = Number(formData.odometerKm);
      }

      if (formData.serialVin && formData.serialVin.trim()) {
        payload.serialVin = formData.serialVin.trim();
      }

      // Objeto consumption si se provee baseline override
      if (formData.baselineOverrideLPer100km) {
        payload.consumption = {
          baseline_override_l_per_100km: Number(formData.baselineOverrideLPer100km),
        };
      }

      const result = await vehiclesService.createUnit(payload);
      toast.success("Unidad creada exitosamente");
      onOpenChange(false);
      // Pasar el vehicleId creado al callback
      onSuccess?.(result?.vehicleId || result?.id);
    } catch (error) {
      console.error("Error al crear unidad:", error);

      // Manejar errores del servidor
      if (error?.response?.data?.errors) {
        const newServerErrors = { ...serverErrors };
        error.response.data.errors.forEach((err) => {
          const field = err.field || err.path?.[0];
          if (field && Object.prototype.hasOwnProperty.call(newServerErrors, field)) {
            newServerErrors[field] = err.message;
          }
        });
        setServerErrors(newServerErrors);

        // Cambiar a la primera tab con error
        const firstErrorTab = getFirstTabWithError();
        if (firstErrorTab) {
          setActiveTab(firstErrorTab);
        }

        toast.error("Errores de validación en el formulario");
      } else {
        const msg = error?.response?.data?.detail || error?.message || "Error al crear unidad";
        toast.error(msg);
      }
    } finally {
      setIsPending(false);
    }
  };

  // Preparar opciones para el Combobox
  const modelOptions = models.map((model) => ({
    value: String(model.modelId),
    label: `${model.brand} ${model.family} ${model.trim ? `(${model.trim})` : ""} - ${model.yearFrom}${model.yearTo ? ` a ${model.yearTo}` : ""}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Unidad</DialogTitle>
          <DialogDescription>
            Registra una nueva unidad de vehículo en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
            </TabsList>

            {/* TAB: Información Básica */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Placa */}
              <div className="space-y-2">
                <Label htmlFor="plate">
                  Placa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => handleChange("plate", e.target.value)}
                  onBlur={() => handleBlur("plate")}
                  placeholder="Ej: PAA-0001"
                  className={getError("plate") ? "border-destructive" : ""}
                />
                {getError("plate") && (
                  <p className="text-sm text-destructive">{getError("plate")}</p>
                )}
              </div>

              {/* Modelo - Combobox */}
              <div className="space-y-2">
                <Label htmlFor="modelId">
                  Modelo de Vehículo <span className="text-destructive">*</span>
                </Label>
                {loadingModels ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="ml-2 text-sm">Cargando modelos...</span>
                  </div>
                ) : (
                  <Combobox
                    options={modelOptions}
                    value={formData.modelId}
                    onValueChange={(value) => {
                      handleChange("modelId", value);
                      handleBlur("modelId");
                    }}
                    placeholder="Selecciona un modelo de vehículo..."
                    emptyText="No se encontraron modelos activos"
                    searchPlaceholder="Buscar por marca, familia o año..."
                    maxVisibleOptions={6}
                  />
                )}
                {getError("modelId") && (
                  <p className="text-sm text-destructive">{getError("modelId")}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Solo se muestran modelos activos. Usa las flechas ↑↓ o escribe para buscar.
                </p>
              </div>

              {/* Capacidad del tanque */}
              <div className="space-y-2">
                <Label htmlFor="tankCapacityL">
                  Capacidad del Tanque (L) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tankCapacityL"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tankCapacityL}
                  onChange={(e) => handleChange("tankCapacityL", e.target.value)}
                  onBlur={() => handleBlur("tankCapacityL")}
                  className={getError("tankCapacityL") ? "border-destructive" : ""}
                />
                {getError("tankCapacityL") && (
                  <p className="text-sm text-destructive">{getError("tankCapacityL")}</p>
                )}
              </div>

              {/* Odómetro */}
              <div className="space-y-2">
                <Label htmlFor="odometerKm">Odómetro Inicial (Km)</Label>
                <Input
                  id="odometerKm"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.odometerKm}
                  onChange={(e) => handleChange("odometerKm", e.target.value)}
                  onBlur={() => handleBlur("odometerKm")}
                  className={getError("odometerKm") ? "border-destructive" : ""}
                />
                {getError("odometerKm") && (
                  <p className="text-sm text-destructive">{getError("odometerKm")}</p>
                )}
              </div>
            </TabsContent>

            {/* TAB: Configuración Avanzada */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              {/* VIN/Serial */}
              <div className="space-y-2">
                <Label htmlFor="serialVin">Número de Serie (VIN)</Label>
                <Input
                  id="serialVin"
                  value={formData.serialVin}
                  onChange={(e) => handleChange("serialVin", e.target.value)}
                  onBlur={() => handleBlur("serialVin")}
                  placeholder="Opcional"
                  className={getError("serialVin") ? "border-destructive" : ""}
                />
                {getError("serialVin") && (
                  <p className="text-sm text-destructive">{getError("serialVin")}</p>
                )}
              </div>

              {/* Consumo Base Override */}
              <div className="space-y-2">
                <Label htmlFor="baselineOverrideLPer100km">
                  Consumo Base Personalizado (L/100km)
                </Label>
                <Input
                  id="baselineOverrideLPer100km"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baselineOverrideLPer100km}
                  onChange={(e) => handleChange("baselineOverrideLPer100km", e.target.value)}
                  onBlur={() => handleBlur("baselineOverrideLPer100km")}
                  placeholder="Opcional - Deja vacío para usar el del modelo"
                  className={getError("baselineOverrideLPer100km") ? "border-destructive" : ""}
                />
                {getError("baselineOverrideLPer100km") && (
                  <p className="text-sm text-destructive">{getError("baselineOverrideLPer100km")}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Si se especifica, sobreescribe el consumo base del modelo para esta unidad.
                  El factor de calibración (K) se calcula automáticamente basándose en el año del modelo y el kilometraje.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear Unidad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
