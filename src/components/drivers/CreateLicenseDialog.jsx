import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Input } from "@/components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import driversService from "@/services/drivers.service";
import { licenseTypesService } from "@/services/license-types.service";

/**
 * Dialog para crear una nueva licencia para un conductor
 */
const CreateLicenseDialog = ({ open, driverId, onOpenChange, onSuccess }) => {
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [form, setForm] = useState({
    licenseTypeId: "",
    number: "",
    issuedAt: "",
    expiresAt: "",
    status: "VALID",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar tipos de licencia cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadLicenseTypes();
    }
  }, [open]);

  const loadLicenseTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const types = await licenseTypesService.findAll();
      setLicenseTypes(Array.isArray(types) ? types : types.items || []);
    } catch (error) {
      console.error("Error loading license types:", error);
      toast.error("Error al cargar tipos de licencia");
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setTimeout(() => {
        setForm({
          licenseTypeId: "",
          number: "",
          issuedAt: "",
          expiresAt: "",
          status: "VALID",
        });
        setErrors({});
        setIsSubmitting(false);
      }, 200);
    }
    onOpenChange(newOpen);
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      
      // Validar fechas en tiempo real
      if (field === "issuedAt" || field === "expiresAt") {
        // Si ambas fechas están presentes, validar
        if (newForm.issuedAt && newForm.expiresAt) {
          const issued = new Date(newForm.issuedAt);
          const expires = new Date(newForm.expiresAt);
          
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (expires <= issued) {
              newErrors.expiresAt = "La fecha de vencimiento debe ser posterior a la fecha de emisión";
            } else {
              delete newErrors.expiresAt;
            }
            return newErrors;
          });
        } else {
          // Si falta una fecha, limpiar el error
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.expiresAt;
            return newErrors;
          });
        }
      } else {
        // Para otros campos, limpiar error cuando se modifica
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      
      return newForm;
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.licenseTypeId) {
      newErrors.licenseTypeId = "El tipo de licencia es requerido";
    }
    if (!form.number || form.number.trim() === "") {
      newErrors.number = "El número de licencia es requerido";
    } else if (form.number.trim().length > 40) {
      newErrors.number = "El número de licencia no puede superar 40 caracteres";
    }
    if (!form.issuedAt) {
      newErrors.issuedAt = "La fecha de emisión es requerida";
    }
    if (!form.expiresAt) {
      newErrors.expiresAt = "La fecha de vencimiento es requerida";
    }

    // Validar que expiresAt sea mayor que issuedAt
    if (form.issuedAt && form.expiresAt) {
      const issued = new Date(form.issuedAt);
      const expires = new Date(form.expiresAt);
      
      // Validar que las fechas sean válidas
      if (isNaN(issued.getTime())) {
        newErrors.issuedAt = "La fecha de emisión no es válida";
      }
      if (isNaN(expires.getTime())) {
        newErrors.expiresAt = "La fecha de vencimiento no es válida";
      }
      
      // Validar que la fecha de vencimiento sea posterior a la de emisión
      if (!isNaN(issued.getTime()) && !isNaN(expires.getTime())) {
        if (expires <= issued) {
          newErrors.expiresAt = "La fecha de vencimiento debe ser posterior a la fecha de emisión";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        licenseTypeId: Number(form.licenseTypeId),
        number: form.number.trim(),
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt,
        status: form.status,
      };

      await driversService.createLicense(driverId, payload);
      toast.success("Licencia creada exitosamente");
      handleOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating license:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Error al crear la licencia";
      toast.error(errorMessage);

      // Si hay errores de validación específicos
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Licencia</DialogTitle>
          <DialogDescription>
            Registra una nueva licencia de conducir para este conductor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="create-license-form">
          <div className="grid gap-4 py-4">
            {/* Tipo de Licencia */}
            <div className="space-y-2">
              <Label htmlFor="licenseTypeId">
                Tipo de Licencia <span className="text-destructive">*</span>
              </Label>
              {isLoadingTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando tipos...
                </div>
              ) : (
                <Select
                  value={form.licenseTypeId}
                  onValueChange={(value) => handleChange("licenseTypeId", value)}
                >
                  <SelectTrigger id="licenseTypeId">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {licenseTypes.map((type) => (
                      <SelectItem
                        key={type.licenseTypeId || type.id}
                        value={String(type.licenseTypeId || type.id)}
                      >
                        {type.code} - {type.description || type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.licenseTypeId && (
                <p className="text-xs text-destructive">{errors.licenseTypeId}</p>
              )}
            </div>

            {/* Número de Licencia */}
            <div className="space-y-2">
              <Label htmlFor="number">
                Número de Licencia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                value={form.number}
                onChange={(e) => handleChange("number", e.target.value)}
                placeholder="Ej. ABC123456"
                maxLength={40}
              />
              {errors.number && (
                <p className="text-xs text-destructive">{errors.number}</p>
              )}
            </div>

            {/* Fecha de Emisión */}
            <div className="space-y-2">
              <Label htmlFor="issuedAt">
                Fecha de Emisión <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issuedAt"
                type="date"
                value={form.issuedAt}
                onChange={(e) => handleChange("issuedAt", e.target.value)}
                max={form.expiresAt || undefined}
                className={errors.issuedAt ? "border-destructive" : ""}
              />
              {errors.issuedAt && (
                <p className="text-xs text-destructive">{errors.issuedAt}</p>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">
                Fecha de Vencimiento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) => handleChange("expiresAt", e.target.value)}
                min={form.issuedAt || undefined}
                className={errors.expiresAt ? "border-destructive" : ""}
              />
              {errors.expiresAt && (
                <p className="text-xs text-destructive">{errors.expiresAt}</p>
              )}
              {form.issuedAt && !errors.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Debe ser posterior a {new Date(form.issuedAt).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={form.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VALID">Vigente</SelectItem>
                  <SelectItem value="EXPIRED">Vencida</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-license-form"
            disabled={isSubmitting || isLoadingTypes}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Licencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLicenseDialog;

