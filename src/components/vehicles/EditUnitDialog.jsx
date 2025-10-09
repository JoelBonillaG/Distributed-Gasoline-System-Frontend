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
import { Loader2 } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

// Validadores
const validators = {
  plate: (v) => {
    if (!v) return ""; // Al editar puede no cambiar
    const s = (v ?? "").trim();
    if (!/^[A-Z0-9-]{3,15}$/i.test(s)) return "Formato de placa inválido (3-15 caracteres alfanuméricos)";
    return "";
  },
  tankCapacityL: (v) => {
    if (!v && v !== 0) return ""; // Al editar puede no cambiar
    const n = Number(v);
    if (!Number.isFinite(n)) return "La capacidad del tanque debe ser numérica";
    if (n <= 0) return "La capacidad debe ser mayor a 0";
    return "";
  },
  odometerKm: (v, currentOdometer) => {
    if (!v && v !== 0) return ""; // Opcional
    const n = Number(v);
    if (!Number.isFinite(n)) return "El odómetro debe ser numérico";
    if (n < 0) return "El odómetro no puede ser negativo";
    if (currentOdometer && n < currentOdometer) return `El odómetro no puede ser menor al actual (${currentOdometer} km)`;
    return "";
  },
};

export default function EditUnitDialog({ open, onOpenChange, unit, onSuccess }) {
  const [isPending, setIsPending] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [fullUnitData, setFullUnitData] = React.useState(null);

  const [formData, setFormData] = React.useState({
    plate: "",
    tankCapacityL: "",
    odometerKm: "",
  });

  const [touched, setTouched] = React.useState({
    plate: false,
    tankCapacityL: false,
    odometerKm: false,
  });

  const [clientErrors, setClientErrors] = React.useState({
    plate: "",
    tankCapacityL: "",
    odometerKm: "",
  });

  const [serverErrors, setServerErrors] = React.useState({
    plate: "",
    tankCapacityL: "",
    odometerKm: "",
  });

  // Cargar datos completos de la unidad al abrir
  React.useEffect(() => {
    if (open && unit?.vehicleId) {
      loadFullUnitData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unit?.vehicleId]);

  const loadFullUnitData = async () => {
    setIsLoading(true);
    try {
      const data = await vehiclesService.getUnitById(unit.vehicleId);
      setFullUnitData(data);

      // Inicializar formulario con datos vacíos (solo se envían cambios)
      setFormData({
        plate: "",
        tankCapacityL: "",
        odometerKm: "",
      });

      setTouched({
        plate: false,
        tankCapacityL: false,
        odometerKm: false,
      });

      setClientErrors({
        plate: "",
        tankCapacityL: "",
        odometerKm: "",
      });

      setServerErrors({
        plate: "",
        tankCapacityL: "",
        odometerKm: "",
      });

      setSubmitAttempted(false);
    } catch (error) {
      console.error("Error al cargar unidad:", error);
      toast.error("Error al cargar los datos de la unidad");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Validar en tiempo real
  React.useEffect(() => {
    setClientErrors({
      plate: validators.plate(formData.plate),
      tankCapacityL: validators.tankCapacityL(formData.tankCapacityL),
      odometerKm: validators.odometerKm(formData.odometerKm, fullUnitData?.odometerKm),
    });
  }, [formData, fullUnitData?.odometerKm]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors()) {
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    // Construir payload solo con campos modificados
    const payload = {
      vehicleId: String(unit.vehicleId),
    };

    let hasChanges = false;

    if (formData.plate?.trim()) {
      payload.plate = formData.plate.trim().toUpperCase();
      hasChanges = true;
    }

    if (formData.tankCapacityL) {
      payload.tankCapacityL = Number(formData.tankCapacityL);
      hasChanges = true;
    }

    if (formData.odometerKm) {
      payload.odometerKm = Number(formData.odometerKm);
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("No se realizaron cambios");
      onOpenChange(false);
      return;
    }

    setIsPending(true);
    setServerErrors({
      plate: "",
      tankCapacityL: "",
      odometerKm: "",
    });

    try {
      await vehiclesService.updateUnit(unit.vehicleId, payload);
      toast.success("Unidad actualizada exitosamente");
      onOpenChange(false);
      // Pasar el vehicleId editado al callback
      onSuccess?.(unit.vehicleId);
    } catch (error) {
      console.error("Error al actualizar unidad:", error);

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
        toast.error("Errores de validación en el formulario");
      } else {
        const msg = error?.response?.data?.detail || error?.message || "Error al actualizar unidad";
        toast.error(msg);
      }
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="ml-3">Cargando datos de la unidad...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!fullUnitData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Unidad</DialogTitle>
          <DialogDescription>
            Modifica los datos de la unidad {fullUnitData.plate}. Solo se actualizarán los campos que completes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Placa */}
          <div className="space-y-2">
            <Label htmlFor="plate">Nueva Placa</Label>
            <Input
              id="plate"
              value={formData.plate}
              onChange={(e) => handleChange("plate", e.target.value)}
              onBlur={() => handleBlur("plate")}
              placeholder={`Actual: ${fullUnitData.plate}`}
              className={getError("plate") ? "border-destructive" : ""}
            />
            {getError("plate") && (
              <p className="text-sm text-destructive">{getError("plate")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Deja vacío para mantener la placa actual
            </p>
          </div>

          {/* Capacidad del tanque */}
          <div className="space-y-2">
            <Label htmlFor="tankCapacityL">Nueva Capacidad del Tanque (L)</Label>
            <Input
              id="tankCapacityL"
              type="number"
              step="0.01"
              min="0"
              value={formData.tankCapacityL}
              onChange={(e) => handleChange("tankCapacityL", e.target.value)}
              onBlur={() => handleBlur("tankCapacityL")}
              placeholder={`Actual: ${fullUnitData.tankCapacityL} L`}
              className={getError("tankCapacityL") ? "border-destructive" : ""}
            />
            {getError("tankCapacityL") && (
              <p className="text-sm text-destructive">{getError("tankCapacityL")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Deja vacío para mantener la capacidad actual
            </p>
          </div>

          {/* Odómetro */}
          <div className="space-y-2">
            <Label htmlFor="odometerKm">Nuevo Odómetro (Km)</Label>
            <Input
              id="odometerKm"
              type="number"
              step="0.01"
              min={fullUnitData.odometerKm}
              value={formData.odometerKm}
              onChange={(e) => handleChange("odometerKm", e.target.value)}
              onBlur={() => handleBlur("odometerKm")}
              placeholder={`Actual: ${fullUnitData.odometerKm} km`}
              className={getError("odometerKm") ? "border-destructive" : ""}
            />
            {getError("odometerKm") && (
              <p className="text-sm text-destructive">{getError("odometerKm")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Deja vacío para mantener el odómetro actual. No puede ser menor a {fullUnitData.odometerKm} km.
            </p>
          </div>

          {/* Estado Operacional */}
          <div className="space-y-2">
            <Label>Estado Operacional Actual</Label>
            <div className="text-sm font-medium text-muted-foreground">
              {fullUnitData.operationalStatus === "ACTIVE" && "Activo"}
              {fullUnitData.operationalStatus === "MAINTENANCE" && "Mantenimiento"}
              {fullUnitData.operationalStatus === "INACTIVE" && "Inactivo"}
              {fullUnitData.operationalStatus === "RETIRED" && "Retirado"}
              {fullUnitData.operationalStatus === "ON_ROUTE" && "En Ruta"}
            </div>
            <p className="text-xs text-muted-foreground">
              El estado operacional se gestiona mediante acciones específicas del sistema
            </p>
          </div>

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
              Actualizar Unidad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
