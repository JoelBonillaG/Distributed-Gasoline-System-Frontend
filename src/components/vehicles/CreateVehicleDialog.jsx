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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { Combobox } from "@/components/ui/inputs/combobox";
import { Badge } from "@/components/ui/shadcn/badge";
import { Loader2, X } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

// Licencias por tipo de vehículo según el esquema
const LICENSE_OPTIONS = {
  LIGHT: [
    { value: "A", label: "Licencia A" },
    { value: "B", label: "Licencia B" },
    { value: "C", label: "Licencia C" },
    { value: "F", label: "Licencia F" },
  ],
  HEAVY: [
    { value: "D", label: "Licencia D" },
    { value: "E", label: "Licencia E" },
    { value: "G", label: "Licencia G" },
  ],
};

// Validadores
const validators = {
  brand: (v) => {
    const s = (v ?? "").trim();
    if (!s) return "La marca es requerida";
    if (s.length > 60) return "La marca no puede superar 60 caracteres";
    return "";
  },
  family: (v) => {
    const s = (v ?? "").trim();
    if (!s) return "La familia es requerida";
    if (s.length > 60) return "La familia no puede superar 60 caracteres";
    return "";
  },
  trim: (v) => {
    const s = (v ?? "").trim();
    if (s.length > 60) return "El trim no puede superar 60 caracteres";
    return "";
  },
  yearFrom: (v) => {
    const n = Number(v);
    if (!Number.isInteger(n)) return "El año debe ser un número entero";
    if (n < 1901) return "El año mínimo es 1901";
    if (n > new Date().getFullYear() + 1) return "El año no puede ser futuro";
    return "";
  },
  yearTo: (v, yearFrom) => {
    if (!v) return ""; // Opcional
    const n = Number(v);
    if (!Number.isInteger(n)) return "El año debe ser un número entero";
    if (n < yearFrom) return "El año final no puede ser menor al inicial";
    if (n > new Date().getFullYear() + 1) return "El año no puede ser futuro";
    return "";
  },
  baselineLPer100km: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "El consumo base debe ser numérico";
    if (n <= 0) return "El consumo base debe ser mayor a 0";
    return "";
  },
  displacementCc: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return "La cilindrada es requerida";
    if (n <= 0) return "La cilindrada debe ser mayor a 0";
    return "";
  },
  powerHp: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return "La potencia es requerida";
    if (n <= 0) return "La potencia debe ser mayor a 0";
    return "";
  },
  defaultLicenses: (licenses) => {
    if (!licenses || licenses.length === 0) {
      return "Debes agregar al menos una licencia requerida";
    }
    return "";
  },
};

export default function CreateVehicleDialog({ open, onOpenChange, onSuccess }) {
  const [isPending, setIsPending] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("vehicle");

  const [formData, setFormData] = React.useState({
    brand: "",
    family: "",
    trim: "",
    yearFrom: new Date().getFullYear(),
    yearTo: null,
    machineType: "LIGHT",
    status: "ACTIVE",
    engine: {
      engineType: "DIESEL",
      baselineLPer100km: "",
      displacementCc: "",
      powerHp: "",
    },
    defaultLicenses: [],
  });

  const [touched, setTouched] = React.useState({
    brand: false,
    family: false,
    trim: false,
    yearFrom: false,
    yearTo: false,
    baselineLPer100km: false,
    displacementCc: false,
    powerHp: false,
    defaultLicenses: false,
  });

  const [clientErrors, setClientErrors] = React.useState({
    brand: "",
    family: "",
    trim: "",
    yearFrom: "",
    yearTo: "",
    baselineLPer100km: "",
    displacementCc: "",
    powerHp: "",
    defaultLicenses: "",
  });

  const [serverErrors, setServerErrors] = React.useState({
    brand: "",
    family: "",
    trim: "",
    yearFrom: "",
    yearTo: "",
    baselineLPer100km: "",
    displacementCc: "",
    powerHp: "",
    defaultLicenses: "",
  });

  const [selectedLicense, setSelectedLicense] = React.useState("");

  // Resetear al abrir
  React.useEffect(() => {
    if (open) {
      setSubmitAttempted(false);
      setFormData({
        brand: "",
        family: "",
        trim: "",
        yearFrom: new Date().getFullYear(),
        yearTo: null,
        machineType: "LIGHT",
        status: "ACTIVE",
        engine: {
          engineType: "DIESEL",
          baselineLPer100km: "",
          displacementCc: "",
          powerHp: "",
        },
        defaultLicenses: [],
      });
      setTouched({
        brand: false,
        family: false,
        trim: false,
        yearFrom: false,
        yearTo: false,
        baselineLPer100km: false,
        displacementCc: false,
        powerHp: false,
        defaultLicenses: false,
      });
      setClientErrors({
        brand: "",
        family: "",
        trim: "",
        yearFrom: "",
        yearTo: "",
        baselineLPer100km: "",
        displacementCc: "",
        powerHp: "",
        defaultLicenses: "",
      });
      setServerErrors({
        brand: "",
        family: "",
        trim: "",
        yearFrom: "",
        yearTo: "",
        baselineLPer100km: "",
        displacementCc: "",
        powerHp: "",
        defaultLicenses: "",
      });
      setSelectedLicense("");
    }
  }, [open]);

  // Validar en tiempo real
  React.useEffect(() => {
    setClientErrors({
      brand: validators.brand(formData.brand),
      family: validators.family(formData.family),
      trim: validators.trim(formData.trim),
      yearFrom: validators.yearFrom(formData.yearFrom),
      yearTo: validators.yearTo(formData.yearTo, formData.yearFrom),
      baselineLPer100km: validators.baselineLPer100km(formData.engine.baselineLPer100km),
      displacementCc: validators.displacementCc(formData.engine.displacementCc),
      powerHp: validators.powerHp(formData.engine.powerHp),
      defaultLicenses: validators.defaultLicenses(formData.defaultLicenses),
    });
  }, [formData]);

  const handleChange = (field, value) => {
    // Limpiar errores del servidor al editar
    setServerErrors((prev) => ({ ...prev, [field]: "" }));

    // Si cambia el tipo de máquina, limpiar licencias
    if (field === "machineType" && value !== formData.machineType) {
      setFormData((prev) => ({ ...prev, [field]: value, defaultLicenses: [] }));
      setSelectedLicense("");
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEngineChange = (field, value) => {
    // Limpiar errores del servidor al editar
    setServerErrors((prev) => ({ ...prev, [field]: "" }));

    setFormData((prev) => ({
      ...prev,
      engine: { ...prev.engine, [field]: value },
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field) => {
    if (!touched[field] && !submitAttempted) return "";
    return serverErrors[field] || clientErrors[field];
  };

  const addLicense = () => {
    if (!selectedLicense) return;

    // Verificar si ya existe
    if (formData.defaultLicenses.some(l => l.code === selectedLicense)) {
      toast.error("Esta licencia ya está agregada");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      defaultLicenses: [...prev.defaultLicenses, { code: selectedLicense }],
    }));
    setSelectedLicense("");
  };

  const removeLicense = (code) => {
    setFormData((prev) => ({
      ...prev,
      defaultLicenses: prev.defaultLicenses.filter((l) => l.code !== code),
    }));
  };

  const getMachineTypeBadgeColor = (type) => {
    return type === "HEAVY"
      ? "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30"
      : "bg-chart-1/20 text-chart-1 hover:bg-chart-1/30";
  };

  // Función para detectar la primera tab con errores
  const getFirstTabWithError = () => {
    // Errores en tab "vehicle"
    if (clientErrors.brand || clientErrors.family || clientErrors.trim ||
        clientErrors.yearFrom || clientErrors.yearTo ||
        serverErrors.brand || serverErrors.family || serverErrors.trim ||
        serverErrors.yearFrom || serverErrors.yearTo) {
      return "vehicle";
    }

    // Errores en tab "engine"
    if (clientErrors.baselineLPer100km || clientErrors.displacementCc || clientErrors.powerHp ||
        serverErrors.baselineLPer100km || serverErrors.displacementCc || serverErrors.powerHp) {
      return "engine";
    }

    // Errores en tab "licenses"
    if (clientErrors.defaultLicenses || serverErrors.defaultLicenses) {
      return "licenses";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Marcar todos como tocados
    setTouched({
      brand: true,
      family: true,
      trim: true,
      yearFrom: true,
      yearTo: true,
      baselineLPer100km: true,
      displacementCc: true,
      powerHp: true,
      defaultLicenses: true,
    });

    // Validar errores de cliente
    const hasClientErrors = Object.values(clientErrors).some((err) => err !== "");
    if (hasClientErrors) {
      const firstErrorTab = getFirstTabWithError();
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }
      toast.error("Por favor corrige los errores antes de continuar");
      return;
    }

    // Preparar datos para enviar - convertir valores del motor a números
    const payload = {
      ...formData,
      trim: formData.trim || undefined,
      yearTo: formData.yearTo || undefined,
      engine: {
        engineType: formData.engine.engineType,
        baselineLPer100km: Number(formData.engine.baselineLPer100km),
        displacementCc: Number(formData.engine.displacementCc),
        powerHp: Number(formData.engine.powerHp),
      },
    };

    setIsPending(true);
    setServerErrors({
      brand: "",
      family: "",
      trim: "",
      yearFrom: "",
      yearTo: "",
      baselineLPer100km: "",
      displacementCc: "",
      powerHp: "",
    });

    try {
      const result = await vehiclesService.createVehicle(payload);
      toast.success("Modelo de vehículo creado exitosamente");
      onOpenChange(false);
      // Pasar el modelId creado al callback
      if (onSuccess) onSuccess(result?.modelId);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al crear vehículo";

      // Intentar mapear errores del servidor a campos específicos
      if (e?.response?.data?.errors) {
        const backendErrors = e.response.data.errors;
        const newServerErrors = { ...serverErrors };

        backendErrors.forEach((err) => {
          const field = err.field || err.property;
          if (field && newServerErrors.hasOwnProperty(field)) {
            newServerErrors[field] = err.message;
          }
        });

        setServerErrors(newServerErrors);

        // Cambiar a la primera tab con error
        const firstErrorTab = getFirstTabWithError();
        if (firstErrorTab) {
          setActiveTab(firstErrorTab);
        }
      }

      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Modelo</DialogTitle>
          <DialogDescription>
            Ingresa los datos del modelo de vehículo y su motor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vehicle">Vehículo</TabsTrigger>
              <TabsTrigger value="engine">Motor</TabsTrigger>
              <TabsTrigger value="licenses">Licencias</TabsTrigger>
            </TabsList>

            {/* Tab: Vehículo */}
            <TabsContent value="vehicle" className="space-y-4 mt-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                {/* Marca */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Marca <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    onBlur={() => handleBlur("brand")}
                    placeholder="Ej: Volvo, Mercedes-Benz"
                    disabled={isPending}
                    required
                    className={getFieldError("brand") ? "border-destructive" : ""}
                  />
                  {getFieldError("brand") && (
                    <p className="text-sm text-destructive">{getFieldError("brand")}</p>
                  )}
                </div>

                {/* Familia y Trim en la misma fila */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="family">
                      Familia <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="family"
                      value={formData.family}
                      onChange={(e) => handleChange("family", e.target.value)}
                      onBlur={() => handleBlur("family")}
                      placeholder="Ej: FH, Actros"
                      disabled={isPending}
                      required
                      className={getFieldError("family") ? "border-destructive" : ""}
                    />
                    {getFieldError("family") && (
                      <p className="text-sm text-destructive">{getFieldError("family")}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trim">Trim</Label>
                    <Input
                      id="trim"
                      value={formData.trim}
                      onChange={(e) => handleChange("trim", e.target.value)}
                      onBlur={() => handleBlur("trim")}
                      placeholder="Ej: 460, 500"
                      disabled={isPending}
                      className={getFieldError("trim") ? "border-destructive" : ""}
                    />
                    {getFieldError("trim") && (
                      <p className="text-sm text-destructive">{getFieldError("trim")}</p>
                    )}
                  </div>
                </div>

                {/* Años */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearFrom">
                      Año Desde <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="yearFrom"
                      type="number"
                      value={formData.yearFrom}
                      onChange={(e) => handleChange("yearFrom", parseInt(e.target.value) || 0)}
                      onBlur={() => handleBlur("yearFrom")}
                      min="1901"
                      max={new Date().getFullYear() + 1}
                      disabled={isPending}
                      required
                      className={getFieldError("yearFrom") ? "border-destructive" : ""}
                    />
                    {getFieldError("yearFrom") && (
                      <p className="text-sm text-destructive">{getFieldError("yearFrom")}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearTo">Año Hasta</Label>
                    <Input
                      id="yearTo"
                      type="number"
                      value={formData.yearTo || ""}
                      onChange={(e) => handleChange("yearTo", e.target.value ? parseInt(e.target.value) : null)}
                      onBlur={() => handleBlur("yearTo")}
                      min={formData.yearFrom}
                      max={new Date().getFullYear() + 1}
                      disabled={isPending}
                      placeholder="Opcional"
                      className={getFieldError("yearTo") ? "border-destructive" : ""}
                    />
                    {getFieldError("yearTo") && (
                      <p className="text-sm text-destructive">{getFieldError("yearTo")}</p>
                    )}
                  </div>
                </div>

                {/* Tipo de Máquina y Estado en la misma fila */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="machineType">
                      Tipo de Máquina <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.machineType}
                      onValueChange={(value) => handleChange("machineType", value)}
                      disabled={isPending}
                    >
                      <SelectTrigger id="machineType">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIGHT">Liviana</SelectItem>
                        <SelectItem value="HEAVY">Pesada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Estado <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange("status", value)}
                      disabled={isPending}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="DEPRECATED">Deprecado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Motor */}
            <TabsContent value="engine" className="space-y-4 mt-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                {/* Tipo de Motor */}
                <div className="space-y-2">
                  <Label htmlFor="engineType">
                    Tipo de Motor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.engine.engineType}
                    onValueChange={(value) => handleEngineChange("engineType", value)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="engineType">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="GASOLINE">Gasolina</SelectItem>
                      <SelectItem value="HYBRID">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Consumo Base */}
                <div className="space-y-2">
                  <Label htmlFor="baselineLPer100km">
                    Consumo Base (L/100km) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="baselineLPer100km"
                    type="number"
                    step="0.001"
                    value={formData.engine.baselineLPer100km}
                    onChange={(e) => handleEngineChange("baselineLPer100km", parseFloat(e.target.value) || 0)}
                    onBlur={() => handleBlur("baselineLPer100km")}
                    disabled={isPending}
                    required
                    className={getFieldError("baselineLPer100km") ? "border-destructive" : ""}
                  />
                  {getFieldError("baselineLPer100km") && (
                    <p className="text-sm text-destructive">{getFieldError("baselineLPer100km")}</p>
                  )}
                </div>

                {/* Cilindrada */}
                <div className="space-y-2">
                  <Label htmlFor="displacementCc">
                    Cilindrada (cc) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="displacementCc"
                    type="number"
                    step="0.01"
                    value={formData.engine.displacementCc}
                    onChange={(e) => handleEngineChange("displacementCc", parseFloat(e.target.value) || 0)}
                    onBlur={() => handleBlur("displacementCc")}
                    disabled={isPending}
                    required
                    className={getFieldError("displacementCc") ? "border-destructive" : ""}
                  />
                  {getFieldError("displacementCc") && (
                    <p className="text-sm text-destructive">{getFieldError("displacementCc")}</p>
                  )}
                </div>

                {/* Potencia */}
                <div className="space-y-2">
                  <Label htmlFor="powerHp">
                    Potencia (HP) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="powerHp"
                    type="number"
                    step="0.01"
                    value={formData.engine.powerHp}
                    onChange={(e) => handleEngineChange("powerHp", parseFloat(e.target.value) || 0)}
                    onBlur={() => handleBlur("powerHp")}
                    disabled={isPending}
                    required
                    className={getFieldError("powerHp") ? "border-destructive" : ""}
                  />
                  {getFieldError("powerHp") && (
                    <p className="text-sm text-destructive">{getFieldError("powerHp")}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Licencias */}
            <TabsContent value="licenses" className="space-y-4 mt-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Licencias Requeridas <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Selecciona las licencias según el tipo de vehículo:{" "}
                    <Badge variant="outline" className={getMachineTypeBadgeColor(formData.machineType)}>
                      {formData.machineType === "HEAVY" ? "Pesada" : "Liviana"}
                    </Badge>
                  </p>
                </div>

                {/* Combobox para agregar licencia */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Combobox
                      options={LICENSE_OPTIONS[formData.machineType] || []}
                      value={selectedLicense}
                      onChange={setSelectedLicense}
                      placeholder="Selecciona una licencia..."
                      emptyText="No hay licencias disponibles"
                      disabled={isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addLicense}
                    disabled={isPending || !selectedLicense}
                  >
                    Agregar
                  </Button>
                </div>

                {/* Lista de licencias */}
                {formData.defaultLicenses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.defaultLicenses.map((license) => (
                      <div
                        key={license.code}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        <span className="font-medium">{license.code}</span>
                        <button
                          type="button"
                          onClick={() => removeLicense(license.code)}
                          className="ml-1 hover:text-destructive"
                          disabled={isPending}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No hay licencias agregadas
                    </p>
                    {getFieldError("defaultLicenses") && (
                      <p className="text-sm text-destructive font-medium">
                        {getFieldError("defaultLicenses")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Modelo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
