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
import { useAllUsers, useUpdateUser } from "@/hooks/use-users";
import driversService from "@/services/drivers.service";
import { 
  AVAILABILITY, 
  AVAILABILITY_MAP,
} from "@/types/driver-types";

/**
 * Dialog para editar un conductor y sus datos de usuario
 */
const EditDriverDialog = ({ open, driver, onOpenChange, onSuccess }) => {
  const { data: users = [] } = useAllUsers();
  const updateUserMutation = useUpdateUser(driver?.userId);
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    availability: AVAILABILITY.AVAILABLE,
  });

  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos cuando se abre el dialog
  useEffect(() => {
    console.log("EditDriverDialog - useEffect triggered", { 
      driver, 
      usersLength: users.length,
      driverUserId: driver?.userId,
      allUserIds: users.map(u => ({ id: u.userId || u.id, username: u.username }))
    });
    
    if (driver && users.length > 0) {
      const user = users.find(u => (u.userId || u.id) === driver.userId);
      
      console.log("EditDriverDialog - Found user:", user);
      console.log("EditDriverDialog - Driver data:", driver);
      
      if (user) {
        const newForm = {
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          firstName: user.firstName || user.first_name || "",
          lastName: user.lastName || user.last_name || "",
          availability: driver.availability || AVAILABILITY.AVAILABLE,
        };
        
        console.log("EditDriverDialog - Setting form data:", newForm);
        setForm(newForm);
      } else {
        console.warn("EditDriverDialog - User not found for driver.userId:", driver.userId);
        console.warn("EditDriverDialog - Available users:", users);
        
        // Si el driver ya tiene los datos del usuario (enrichedDrivers), usarlos directamente
        if (driver.firstName && driver.firstName !== "—") {
          const newForm = {
            username: driver.username || "",
            email: driver.email || "",
            phone: driver.phone || "",
            firstName: driver.firstName || "",
            lastName: driver.lastName || "",
            availability: driver.availability || AVAILABILITY.AVAILABLE,
          };
          
          console.log("EditDriverDialog - Using enriched driver data:", newForm);
          setForm(newForm);
        }
      }
    }
  }, [driver, users]);

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setTimeout(() => {
        setForm({
          username: "",
          email: "",
          phone: "",
          firstName: "",
          lastName: "",
          availability: AVAILABILITY.AVAILABLE,
        });
        setErrors({});
        setSubmitAttempted(false);
        setIsSubmitting(false);
      }, 200);
    }
    onOpenChange(newOpen);
  };

  // Validación de campos
  const validateField = (field, value) => {
    const s = typeof value === "string" ? value.trim() : value;
    
    switch (field) {
      case "username":
        if (!s) return "El nombre de usuario es requerido.";
        return "";
      case "email":
        if (!s) return "Ingresa el correo electrónico.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Correo inválido.";
        if (String(s).length > 255) return "Máximo 255 caracteres.";
        return "";
      case "phone":
        if (!s) return "Ingresa el teléfono.";
        if (String(s).length < 6) return "Mínimo 6 caracteres.";
        if (String(s).length > 20) return "Máximo 20 caracteres.";
        return "";
      case "firstName":
        if (!s) return "Ingresa los nombres.";
        if (String(s).length > 60) return "Máximo 60 caracteres.";
        return "";
      case "lastName":
        if (!s) return "Ingresa los apellidos.";
        if (String(s).length > 60) return "Máximo 60 caracteres.";
        return "";
      case "availability":
        if (!s) return "Selecciona la disponibilidad.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async () => {
    if (!driver) return;
    
    setSubmitAttempted(true);

    // Validar todos los campos
    const fields = Object.keys(form);
    const validationErrors = fields.reduce((acc, field) => {
      acc[field] = validateField(field, form[field]);
      return acc;
    }, {});

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      toast.error("Revisa los campos resaltados.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Actualizar usuario
      const userPayload = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };

      await updateUserMutation.mutateAsync(userPayload);

      // 2. Actualizar conductor con availability y version
      const driverPayload = {
        availability: form.availability,
        version: driver.version,
      };

      console.log("EditDriverDialog - Updating driver with payload:", driverPayload);
      await driversService.updateDriver(driver.driverId, driverPayload);

      toast.success(`Conductor #${driver.driverId} actualizado exitosamente`);
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating driver:", error);
      
      const errorData = error?.response?.data || error?.data;
      
      // Mapear errores del servidor a campos del formulario
      if (errorData?.errors) {
        const serverErrors = {};
        Object.keys(errorData.errors).forEach(key => {
          serverErrors[key] = Array.isArray(errorData.errors[key]) 
            ? errorData.errors[key][0] 
            : errorData.errors[key];
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
      
      const errorMessage = errorData?.message || error.message || "Error al actualizar conductor";
      toast.error(errorMessage);

      // Error de optimistic locking
      if (error.response?.status === 409) {
        toast.error("El conductor fue modificado por otro usuario. Recarga la página.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (field) => {
    return errors[field] && (submitAttempted || form[field]) 
      ? errors[field] 
      : "";
  };

  const canSubmit = 
    form.username &&
    form.email &&
    form.phone &&
    form.firstName &&
    form.lastName &&
    form.availability &&
    Object.values(errors).every(err => !err);

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Conductor #{driver.driverId}</DialogTitle>
          <DialogDescription>
            Modifica los datos personales y estado del conductor
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Cédula (solo lectura) */}
            <div className="space-y-2">
              <Label htmlFor="username">Cédula *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Ej. 1718137159"
                maxLength={10}
                inputMode="numeric"
              />
              {getErrorMessage("username") && (
                <p className="text-xs text-destructive">{getErrorMessage("username")}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
                maxLength={255}
              />
              {getErrorMessage("email") && (
                <p className="text-xs text-destructive">{getErrorMessage("email")}</p>
              )}
            </div>

            {/* Nombres */}
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombres *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Ej. Juan Carlos"
                maxLength={60}
              />
              {getErrorMessage("firstName") && (
                <p className="text-xs text-destructive">{getErrorMessage("firstName")}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Ej. Pérez García"
                maxLength={60}
              />
              {getErrorMessage("lastName") && (
                <p className="text-xs text-destructive">{getErrorMessage("lastName")}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Ej. +593 99 123 4567"
                maxLength={20}
              />
              {getErrorMessage("phone") && (
                <p className="text-xs text-destructive">{getErrorMessage("phone")}</p>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="availability">Disponibilidad *</Label>
              <Select
                value={form.availability}
                onValueChange={(value) => handleChange("availability", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AVAILABILITY.AVAILABLE}>
                    {AVAILABILITY_MAP[AVAILABILITY.AVAILABLE]}
                  </SelectItem>
                  <SelectItem value={AVAILABILITY.ON_ROUTE}>
                    {AVAILABILITY_MAP[AVAILABILITY.ON_ROUTE]}
                  </SelectItem>
                  <SelectItem value={AVAILABILITY.LICENSE_EXPIRED}>
                    {AVAILABILITY_MAP[AVAILABILITY.LICENSE_EXPIRED]}
                  </SelectItem>
                  <SelectItem value={AVAILABILITY.INACTIVE}>
                    {AVAILABILITY_MAP[AVAILABILITY.INACTIVE]}
                  </SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("availability") && (
                <p className="text-xs text-destructive">{getErrorMessage("availability")}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverDialog;
