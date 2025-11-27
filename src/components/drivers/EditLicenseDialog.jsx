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
import { useUpdateLicense } from "@/hooks/use-drivers";
import { licenseTypesService } from "@/services/license-types.service";

/**
 * Dialog para editar una licencia existente de un conductor
 */
const EditLicenseDialog = ({ open, driverId, license, onOpenChange, onSuccess }) => {
  const updateLicenseMutation = useUpdateLicense();
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

  // Cargar tipos de licencia y llenar el formulario cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadLicenseTypes();
      if (license) {
        // Formatear fechas para el input type="date" (YYYY-MM-DD)
        const formatDateForInput = (dateStr) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split("T")[0];
        };

        setForm({
          licenseTypeId: String(license.licenseTypeId || license.license_type_id || ""),
          number: license.number || "",
          issuedAt: formatDateForInput(license.issuedAt || license.issued_at),
          expiresAt: formatDateForInput(license.expiresAt || license.expires_at),
          status: license.status || "VALID",
        });
      }
    }
  }, [open, license]);

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
      }, 200);
    }
    onOpenChange(newOpen);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validar que expiresAt sea mayor que issuedAt si ambas están presentes
    if (form.issuedAt && form.expiresAt) {
      const issued = new Date(form.issuedAt);
      const expires = new Date(form.expiresAt);
      if (expires <= issued) {
        newErrors.expiresAt = "La fecha de vencimiento debe ser posterior a la fecha de emisión";
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

    try {
      const payload = {};
      
      // Solo incluir campos que han cambiado o que están presentes
      if (form.licenseTypeId) {
        payload.licenseTypeId = Number(form.licenseTypeId);
      }
      if (form.number && form.number.trim() !== "") {
        payload.number = form.number.trim();
      }
      if (form.issuedAt) {
        payload.issuedAt = form.issuedAt;
      }
      if (form.expiresAt) {
        payload.expiresAt = form.expiresAt;
      }
      if (form.status) {
        payload.status = form.status;
      }

      await updateLicenseMutation.mutateAsync({
        driverId,
        licenseId: license.driverLicenseId || license.driver_license_id || license.id,
        data: payload,
      });

      toast.success("Licencia actualizada exitosamente");
      handleOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating license:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Error al actualizar la licencia";
      toast.error(errorMessage);

      // Si hay errores de validación específicos
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const isSubmitting = updateLicenseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Licencia</DialogTitle>
          <DialogDescription>
            Modifica los datos de la licencia de conducir
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="edit-license-form">
          <div className="grid gap-4 py-4">
            {/* Tipo de Licencia */}
            <div className="space-y-2">
              <Label htmlFor="licenseTypeId">Tipo de Licencia</Label>
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
              <Label htmlFor="number">Número de Licencia</Label>
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
              <Label htmlFor="issuedAt">Fecha de Emisión</Label>
              <Input
                id="issuedAt"
                type="date"
                value={form.issuedAt}
                onChange={(e) => handleChange("issuedAt", e.target.value)}
              />
              {errors.issuedAt && (
                <p className="text-xs text-destructive">{errors.issuedAt}</p>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Fecha de Vencimiento</Label>
              <Input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) => handleChange("expiresAt", e.target.value)}
              />
              {errors.expiresAt && (
                <p className="text-xs text-destructive">{errors.expiresAt}</p>
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
            form="edit-license-form"
            disabled={isSubmitting || isLoadingTypes}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Licencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLicenseDialog;

