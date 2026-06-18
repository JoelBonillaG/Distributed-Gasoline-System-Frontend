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
import { licenseTypesService } from "@/services/license-types.service";

// Validadores (mismos que en CreateVehicleDialog)
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
    if (!v) return ""; // Al editar puede no cambiar
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
    if (yearFrom && n < yearFrom) return "El año final no puede ser menor al inicial";
    if (n > new Date().getFullYear() + 1) return "El año no puede ser futuro";
    return "";
  },
  baselineLPer100km: (v) => {
    if (!v && v !== 0) return ""; // Al editar puede no cambiar
    const n = Number(v);
    if (!Number.isFinite(n)) return "El consumo base debe ser numérico";
    if (n <= 0) return "El consumo base debe ser mayor a 0";
    return "";
  },
  displacementCc: (v) => {
    if (!v && v !== 0) return ""; // Al editar puede no cambiar
    const n = Number(v);
    if (!Number.isFinite(n)) return "La cilindrada debe ser numérica";
    if (n < 0) return "La cilindrada debe ser mayor o igual a 0";
    return "";
  },
  powerHp: (v) => {
    if (!v && v !== 0) return ""; // Al editar puede no cambiar
    const n = Number(v);
    if (!Number.isFinite(n)) return "La potencia debe ser numérica";
    if (n < 0) return "La potencia debe ser mayor o igual a 0";
    return "";
  },
  defaultLicenses: (licenses) => {
    if (!licenses || licenses.length === 0) {
      return "Debes agregar al menos una licencia requerida";
    }
    return "";
  },
};

export default function EditVehicleDialog({ open, onOpenChange, vehicle, onSuccess }) {
  const [isPending, setIsPending] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [fullVehicleData, setFullVehicleData] = React.useState(null);
  const [originalMachineType, setOriginalMachineType] = React.useState(null);
  const [originalLicenses, setOriginalLicenses] = React.useState([]);
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
      baselineLPer100km: 0,
      displacementCc: 0,
      powerHp: 0,
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
  const [licenseTypes, setLicenseTypes] = React.useState([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = React.useState(true);

  // Cargar tipos de licencia desde el endpoint
  React.useEffect(() => {
    const loadLicenseTypes = async () => {
      setIsLoadingLicenses(true);
      try {
        const data = await licenseTypesService.findAll();
        const types = Array.isArray(data) ? data : (data.items || []);
        // Ordenar alfabéticamente por código
        const sorted = types.sort((a, b) => {
          const codeA = (a.code || '').toUpperCase();
          const codeB = (b.code || '').toUpperCase();
          return codeA.localeCompare(codeB);
        });
        setLicenseTypes(sorted);
      } catch (error) {
        console.error("Error loading license types:", error);
        toast.error("Error al cargar tipos de licencia");
      } finally {
        setIsLoadingLicenses(false);
      }
    };
    loadLicenseTypes();
  }, []);

  // Obtener opciones de licencias según el tipo de vehículo
  const getLicenseOptions = React.useMemo(() => {
    if (isLoadingLicenses || !licenseTypes.length) return [];
    
    // LIGHT vehicles: licencias ordinarias (isProfessional = false)
    // HEAVY vehicles: licencias profesionales (isProfessional = true)
    const filtered = licenseTypes.filter(lt => {
      if (formData.machineType === "LIGHT") {
        return !lt.isProfessional; // Ordinarias para vehículos livianos
      } else {
        return lt.isProfessional; // Profesionales para vehículos pesados
      }
    });

    return filtered.map(lt => ({
      value: lt.code,
      label: `Licencia ${lt.code}${lt.description ? ` - ${lt.description}` : ''}`,
    }));
  }, [licenseTypes, formData.machineType, isLoadingLicenses]);

  // Cargar datos completos del vehículo cuando se abre el diálogo
  React.useEffect(() => {
    if (open && vehicle?.modelId) {
      loadFullVehicleData();
    }
  }, [open, vehicle?.modelId]);

  const loadFullVehicleData = async () => {
    if (!vehicle?.modelId) return;

    setIsLoading(true);
    setSubmitAttempted(false);
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

    try {
      const data = await vehiclesService.getVehicleById(vehicle.modelId);
      setFullVehicleData(data);
      setOriginalMachineType(data.machineType);
      setOriginalLicenses(data.defaultLicenses || []);

      setFormData({
        brand: data.brand || "",
        family: data.family || "",
        trim: data.trim || "",
        yearFrom: data.yearFrom || new Date().getFullYear(),
        yearTo: data.yearTo || null,
        machineType: data.machineType || "LIGHT",
        status: data.status || "ACTIVE",
        engine: data.engine || {
          engineType: "DIESEL",
          baselineLPer100km: 0,
          displacementCc: 0,
          powerHp: 0,
        },
        defaultLicenses: data.defaultLicenses || [],
      });
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al cargar vehículo";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Si cambia el tipo de máquina
    if (field === "machineType" && value !== formData.machineType) {
      // Si vuelve al tipo original, restaurar licencias originales
      if (value === originalMachineType) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          defaultLicenses: [...originalLicenses]
        }));
      } else {
        // Si cambia a un tipo diferente, limpiar licencias
        setFormData((prev) => ({ ...prev, [field]: value, defaultLicenses: [] }));
      }
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
    const existingCodes = formData.defaultLicenses.map(l => l.code || l.licenseTypeCode);
    if (existingCodes.includes(selectedLicense)) {
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
      defaultLicenses: prev.defaultLicenses.filter(
        (l) => (l.code || l.licenseTypeCode) !== code
      ),
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

    if (!vehicle?.modelId) {
      toast.error("No se pudo identificar el vehículo");
      return;
    }

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

    // Preparar datos para enviar
    const payload = {
      ...formData,
      trim: formData.trim || undefined,
      yearTo: formData.yearTo || undefined,
      defaultLicenses: formData.defaultLicenses.map(l => ({
        code: l.code || l.licenseTypeCode
      })),
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
      await vehiclesService.updateVehicle(vehicle.modelId, payload);
      toast.success("Modelo de vehículo actualizado exitosamente");
      onOpenChange(false);
      // Pasar el modelId editado al callback
      if (onSuccess) onSuccess(vehicle.modelId);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al actualizar vehículo";

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

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Modelo</DialogTitle>
          <DialogDescription>
            Modifica los datos del modelo de vehículo y su motor
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                  {/* ID (solo lectura) */}
                  <div className="space-y-2">
                    <Label htmlFor="modelId">ID del Modelo</Label>
                    <Input
                      id="modelId"
                      value={vehicle.modelId}
                      disabled
                      className="bg-muted"
                    />
                  </div>

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
                        options={getLicenseOptions}
                        disabled={isPending || isLoadingLicenses}
                        value={selectedLicense}
                        onChange={setSelectedLicense}
                        placeholder="Selecciona una licencia..."
                        emptyText="No hay licencias disponibles"
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
                      {formData.defaultLicenses.map((license) => {
                        const code = license.code || license.licenseTypeCode;
                        return (
                          <div
                            key={code}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                          >
                            <span className="font-medium">{code}</span>
                            <button
                              type="button"
                              onClick={() => removeLicense(code)}
                              className="ml-1 hover:text-destructive"
                              disabled={isPending}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        );
                      })}
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
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
