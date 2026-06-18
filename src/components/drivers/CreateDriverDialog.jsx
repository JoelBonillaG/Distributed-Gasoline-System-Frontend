import { useState } from "react";
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
import { useAllDrivers } from "@/hooks/use-drivers";
import { useAllUsers, useAddUser } from "@/hooks/use-users";
import driversService from "@/services/drivers.service";
import { AVAILABILITY, AVAILABILITY_MAP } from "@/types/driver-types";

// Validador de cédula ecuatoriana
const cedulaErr = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "Ingresa una cédula ecuatoriana.";
  if (!/^\d{10}$/.test(s)) return "La cédula debe tener exactamente 10 dígitos numéricos.";
  
  // Algoritmo de validación de cédula ecuatoriana
  const digits = s.split("").map(Number);
  const provinceCode = parseInt(s.substring(0, 2));
  if (provinceCode < 1 || provinceCode > 24) return "Código de provincia inválido (primeros 2 dígitos).";
  
  const thirdDigit = digits[2];
  if (thirdDigit > 6) return "Tercer dígito inválido (debe ser 0-6).";
  
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = digits[i] * coefficients[i];
    if (product >= 10) product -= 9;
    sum += product;
  }
  
  const verifier = (10 - (sum % 10)) % 10;
  if (verifier !== digits[9]) return "Cédula inválida (dígito verificador incorrecto).";
  
  return "";
};

/**
 * Dialog para crear un nuevo conductor
 * - Crea primero un usuario con rol DRIVER
 * - Luego crea el conductor con el userId retornado
 */
const CreateDriverDialog = ({ open, onOpenChange, onSuccess }) => {
  // Hooks
  const { data: drivers = [] } = useAllDrivers();
  const { data: users = [] } = useAllUsers();
  const createUserMutation = useAddUser();

  // Form state
  const [form, setForm] = useState({
    username: "", // cédula
    email: "",
    password: "",
    phone: "",
    firstName: "",
    lastName: "",
    availability: AVAILABILITY.AVAILABLE,
  });

  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form cuando se cierra
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setTimeout(() => {
        setForm({
          username: "",
          email: "",
          password: "",
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
        return cedulaErr(s);
      case "email":
        if (!s) return "Ingresa el correo electrónico.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Correo inválido.";
        if (String(s).length > 255) return "Máximo 255 caracteres.";
        return "";
      case "password":
        if (!s) return "La contraseña es obligatoria.";
        if (String(s).length < 8) return "Mínimo 8 caracteres.";
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

  // Validación de duplicados (cédula y email)
  const validateDuplicates = (username, email) => {
    const errors = {};
    
    // Buscar si ya existe la cédula en usuarios
    const existingUserByCedula = users.find(u => u.username === username);
    if (existingUserByCedula) {
      errors.username = "Esta cédula ya está registrada.";
    }
    
    // Buscar si ya existe el email en usuarios
    const existingUserByEmail = users.find(u => u.email === email);
    if (existingUserByEmail) {
      errors.email = "Este email ya está registrado.";
    }
    
    return errors;
  };

  // Handle cambio en form
  const handleChange = (field, value) => {
    const val = field === "username" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm(prev => ({ ...prev, [field]: val }));
    
    const error = validateField(field, val);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitAttempted(true);

    // Validar todos los campos
    const fields = Object.keys(form);
    const validationErrors = fields.reduce((acc, field) => {
      acc[field] = validateField(field, form[field]);
      return acc;
    }, {});

    // Validar duplicados
    const duplicateErrors = validateDuplicates(form.username, form.email);
    const allErrors = { ...validationErrors, ...duplicateErrors };

    setErrors(allErrors);

    if (Object.values(allErrors).some(Boolean)) {
      toast.error("Revisa los campos resaltados.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Crear usuario con rol DRIVER
      const userData = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        roleIds: [3], // DRIVER role ID
      };

      const newUser = await createUserMutation.mutateAsync(userData);
      const userId = newUser.user_id || newUser.userId || newUser.id;

      if (!userId) {
        throw new Error("No se recibió el ID del usuario creado");
      }

      // 2. Crear conductor con el userId retornado
      const driverPayload = {
        userId: userId,
        availability: form.availability,
      };

      const newDriver = await driversService.createDriver(driverPayload);

      toast.success(`Conductor #${newDriver.driverId} creado exitosamente`);
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating driver:", error);
      
      const errorData = error?.response?.data || error?.data;
      
      // Mapear errores del servidor a campos del formulario
      if (errorData?.errors) {
        const serverErrors = {};
        Object.keys(errorData.errors).forEach(key => {
          // El servidor devuelve en camelCase, el form usa camelCase
          serverErrors[key] = Array.isArray(errorData.errors[key]) 
            ? errorData.errors[key][0] 
            : errorData.errors[key];
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
      
      const errorMessage = errorData?.message || error.message || "Error al crear conductor";
      toast.error(errorMessage);
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
    form.password &&
    form.phone &&
    form.firstName &&
    form.lastName &&
    form.availability &&
    Object.values(errors).every(err => !err);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Conductor</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo usuario y asignarlo como conductor
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Cédula */}
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

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              {getErrorMessage("password") && (
                <p className="text-xs text-destructive">{getErrorMessage("password")}</p>
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

            {/* Disponibilidad */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="availability">Disponibilidad Inicial *</Label>
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
                Creando...
              </>
            ) : (
              "Crear Conductor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDriverDialog;
