import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/shadcn/card";
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
import { Loader2, X, ArrowLeft, Car } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";

// Licencias por tipo de vehículo
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
    if (!v) return "";
    const n = Number(v);
    if (!Number.isInteger(n)) return "El año debe ser un número entero";
    if (n < 1901) return "El año mínimo es 1901";
    if (n > new Date().getFullYear() + 1) return "El año no puede ser futuro";
    return "";
  },
  yearTo: (v, yearFrom) => {
    if (!v) return "";
    const n = Number(v);
    if (!Number.isInteger(n)) return "El año debe ser un número entero";
    if (yearFrom && n < yearFrom) return "El año final no puede ser menor al inicial";
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
    if (!Number.isFinite(n)) return "La cilindrada debe ser numérica";
    if (n <= 0) return "La cilindrada debe ser mayor a 0";
    return "";
  },
  powerHp: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "La potencia debe ser numérica";
    if (n <= 0) return "La potencia debe ser mayor a 0";
    return "";
  },
  licenses: (licenses) => {
    if (!licenses || licenses.length === 0) {
      return "Debe agregar al menos una licencia";
    }
    return "";
  },
};

export default function EditVehicleModelPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isPending, setIsPending] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [originalMachineType, setOriginalMachineType] = React.useState(null);
  const [originalLicenses, setOriginalLicenses] = React.useState([]);

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
    licenses: false,
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
    licenses: "",
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
    licenses: "",
  });

  const [selectedLicense, setSelectedLicense] = React.useState("");

  // Cargar datos del vehículo
  React.useEffect(() => {
    if (id) {
      loadVehicleData();
    }
  }, [id]);

  const loadVehicleData = async () => {
    setIsLoading(true);
    try {
      const data = await vehiclesService.getVehicleById(id);
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
      navigate("/vehicles/models");
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
      licenses: validators.licenses(formData.defaultLicenses),
    });
  }, [formData]);

  const handleChange = (field, value) => {
    setServerErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "machineType" && value !== formData.machineType) {
      if (value === originalMachineType) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          defaultLicenses: [...originalLicenses],
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value, defaultLicenses: [] }));
      }
      setSelectedLicense("");
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEngineChange = (field, value) => {
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

    const existingCodes = formData.defaultLicenses.map((l) => l.code || l.licenseTypeCode);
    if (existingCodes.includes(selectedLicense)) {
      toast.error("Esta licencia ya está agregada");
      return;
    }

    setServerErrors((prev) => ({ ...prev, licenses: "" }));
    setFormData((prev) => ({
      ...prev,
      defaultLicenses: [...prev.defaultLicenses, { code: selectedLicense }],
    }));
    setSelectedLicense("");
  };

  const removeLicense = (code) => {
    setFormData((prev) => ({
      ...prev,
      defaultLicenses: prev.defaultLicenses.filter((l) => (l.code || l.licenseTypeCode) !== code),
    }));
  };

  const getMachineTypeBadgeColor = (type) => {
    return type === "HEAVY"
      ? "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30"
      : "bg-chart-1/20 text-chart-1 hover:bg-chart-1/30";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    setTouched({
      brand: true,
      family: true,
      trim: true,
      yearFrom: true,
      yearTo: true,
      baselineLPer100km: true,
      displacementCc: true,
      powerHp: true,
      licenses: true,
    });

    const hasClientErrors = Object.values(clientErrors).some((err) => err !== "");
    if (hasClientErrors) {
      toast.error("Por favor corrige los errores antes de continuar");
      return;
    }

    const payload = {
      ...formData,
      trim: formData.trim || undefined,
      yearTo: formData.yearTo || undefined,
      defaultLicenses: formData.defaultLicenses.map((l) => ({
        code: l.code || l.licenseTypeCode,
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
      licenses: "",
    });

    try {
      await vehiclesService.updateVehicle(id, payload);
      toast.success("Modelo de vehículo actualizado exitosamente");

      // Redirigir con el ID del modelo editado para abrir el drawer automáticamente
      navigate("/vehicles/models", {
        state: {
          openDrawer: true,
          modelId: id
        }
      });
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al actualizar vehículo";

      if (e?.response?.data?.errors) {
        const backendErrors = e.response.data.errors;
        const newServerErrors = { ...serverErrors };

        backendErrors.forEach((err) => {
          const field = err.field || err.property;
          if (field && Object.prototype.hasOwnProperty.call(newServerErrors, field)) {
            newServerErrors[field] = err.message;
          }
        });

        setServerErrors(newServerErrors);
      }

      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 p-6 min-h-screen">
      {/* Pastillas decorativas de colores con blur en el fondo de la página - Más visibles y al frente */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-68 h-68 bg-gradient-to-br from-chart-2/45 to-brand-3/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -top-16 right-32 w-76 h-76 bg-gradient-to-bl from-brand-1/45 to-chart-3/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-24 -left-10 w-64 h-64 bg-gradient-to-tr from-chart-1/45 to-brand-2/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4.5s' }} />
        <div className="absolute -bottom-20 right-20 w-72 h-72 bg-gradient-to-tl from-brand-3/40 to-chart-2/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5.5s' }} />
      </div>

      <form onSubmit={handleSubmit} className="h-full relative z-10">
        <Card className="relative h-full bg-card/60 backdrop-blur-2xl border-border">
          <CardContent className="relative space-y-6 pt-6">
            {/* Header con título dentro del Card */}
            <div className="space-y-4 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Botón de volver atrás al lado del título */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/vehicles")}
                    className="rounded-full shadow-lg flex-shrink-0"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-3 via-brand-2 to-brand-1 bg-clip-text text-transparent">
                      Editar Modelo de Vehículo
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Modifica los datos del modelo de vehículo y su motor
                    </p>
                  </div>
                </div>
                {/* Icono decorativo del carro alineado a la derecha */}
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand-2 to-brand-3 shadow-lg flex-shrink-0">
                  <Car className="size-6 text-white" />
                </div>
              </div>
            </div>

            <Tabs defaultValue="vehicle" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vehicle">Vehículo</TabsTrigger>
                <TabsTrigger value="engine">Motor</TabsTrigger>
                <TabsTrigger value="licenses">Licencias</TabsTrigger>
              </TabsList>

              {/* Tab: Vehículo */}
              <TabsContent value="vehicle" className="space-y-4 mt-6">
                <div className="grid gap-6 max-w-3xl">
                  {/* ID (solo lectura) */}
                  <div className="space-y-2">
                    <Label htmlFor="modelId">ID del Modelo</Label>
                    <Input id="modelId" value={id} disabled className="bg-muted" />
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

                  {/* Familia y Trim */}
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
                        onChange={(e) =>
                          handleChange("yearTo", e.target.value ? parseInt(e.target.value) : null)
                        }
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

                  {/* Tipo de Máquina y Estado */}
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
              <TabsContent value="engine" className="space-y-4 mt-6">
                <div className="grid gap-6 max-w-3xl">
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
                      onChange={(e) =>
                        handleEngineChange("baselineLPer100km", parseFloat(e.target.value) || 0)
                      }
                      onBlur={() => handleBlur("baselineLPer100km")}
                      disabled={isPending}
                      required
                      className={getFieldError("baselineLPer100km") ? "border-destructive" : ""}
                    />
                    {getFieldError("baselineLPer100km") && (
                      <p className="text-sm text-destructive">
                        {getFieldError("baselineLPer100km")}
                      </p>
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
                      onChange={(e) =>
                        handleEngineChange("displacementCc", parseFloat(e.target.value) || 0)
                      }
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
              <TabsContent value="licenses" className="space-y-4 mt-6">
                <div className="space-y-6 max-w-3xl">
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
                    <p className="text-sm text-muted-foreground">No hay licencias agregadas</p>
                  )}

                  {/* Error de licencias */}
                  {getFieldError("licenses") && (
                    <p className="text-sm text-destructive">{getFieldError("licenses")}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/vehicles")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
