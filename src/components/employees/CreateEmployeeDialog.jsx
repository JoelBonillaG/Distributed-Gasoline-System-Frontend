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
import { Combobox } from "@/components/ui/inputs/combobox";
import employees from "@/services/employeeService";
import medicalCenters from "@/services/medicalCenters.service";

const genders = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
];

// --- Validador de cédula (igual que el doctor)
const cedulaErr = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "Ingresa una cédula ecuatoriana.";
  if (!/^\d{10}$/.test(s)) return "La cédula debe tener 10 dígitos.";
  const prov = Number(s.slice(0, 2));
  if (prov < 1 || prov > 24) return "Código de provincia inválido.";
  const tercer = Number(s[2]);
  if (tercer >= 6) return "No corresponde a persona natural.";
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let prod = Number(s[i]) * coef[i];
    if (prod >= 10) prod -= 9;
    suma += prod;
  }
  const verif = (10 - (suma % 10)) % 10;
  if (verif !== Number(s[9])) return "Cédula inválida.";
  return "";
};

export default function CreateEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
}) {
  const [form, setForm] = React.useState({
    username: "",
    email: "",
    password: "",
    gender: "",
    firstName: "",
    lastName: "",
    centerId: "",
  });

  const [clientErrs, setClientErrs] = React.useState({});
  const [serverErrs, setServerErrs] = React.useState({});
  const [centerOptions, setCenterOptions] = React.useState([]);
  const [pending, setPending] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  // Load centros
  const loadCenters = React.useCallback(async () => {
    try {
      const centers = await medicalCenters.listAllCenters({
        includeDeleted: false,
      });
      console.log("Centers", centers);
      setCenterOptions(
        centers.map((c) => ({
          value: String(c.id),
          label: `${c.name} · ${c.city}`,
        }))
      );
    } catch {
      toast.error("No se pudieron cargar los centros médicos.");
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setForm({
        username: "",
        email: "",
        password: "",
        gender: "",
        firstName: "",
        lastName: "",
        centerId: "",
      });
      setClientErrs({});
      setServerErrs({});
      setSubmitAttempted(false);
      loadCenters();
    }
  }, [open, loadCenters]);

  // Validación cliente
  const validateField = (field, value) => {
    const s = (value ?? "").trim();
    switch (field) {
      case "username":
        return cedulaErr(s);
      case "email":
        if (!s) return "Ingresa el correo electrónico.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Correo inválido.";
        return "";
      case "password":
        if (!s) return "La contraseña es obligatoria.";
        if (s.length < 8) return "Mínimo 8 caracteres.";
        return "";
      case "gender":
        if (!s) return "Selecciona el género.";
        return "";
      case "firstName":
        if (!s) return "Ingresa los nombres.";
        return "";
      case "lastName":
        if (!s) return "Ingresa los apellidos.";
        return "";
      case "centerId":
        if (!s) return "Selecciona un centro médico.";
        return "";
      default:
        return "";
    }
  };

  const msg = (f) =>
    serverErrs[f] || ((submitAttempted || form[f]) && clientErrs[f]) || "";

  const onChange = (field, value) => {
    const val =
      field === "username" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [field]: val }));
    const clientMsg = validateField(field, val);
    setClientErrs((prev) => ({ ...prev, [field]: clientMsg }));
    if (serverErrs[field]) setServerErrs((prev) => ({ ...prev, [field]: "" }));
  };

  const canSubmit =
    form.username &&
    form.email &&
    form.password &&
    form.gender &&
    form.firstName &&
    form.lastName &&
    form.centerId &&
    Object.values(clientErrs).every((m) => !m) &&
    Object.values(serverErrs).every((m) => !m);

  const submit = async () => {
    setSubmitAttempted(true);
    const fields = Object.keys(form);
    const errs = fields.reduce((acc, f) => {
      acc[f] = validateField(f, form[f]);
      return acc;
    }, {});
    setClientErrs(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.error("Revisa los campos resaltados.");
      return;
    }

    setPending(true);
    try {
      await employees.createEmployee({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        centerId: Number(form.centerId),
        roles: [{ name: "ADMIN" }], // siempre ADMIN
      });
      toast.success("Empleado creado con rol ADMIN");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const errorData = e?.data;

      if (errorData?.errors) {
        let hasFieldError = false;

        Object.entries(errorData.errors).forEach(([field, message]) => {
          if (field === "global") {
            // error general → toast
            toast.error(message);
          } else {
            // error ligado a un campo → mostrar debajo del input
            hasFieldError = true;
            setServerErrs((prev) => ({ ...prev, [field]: message }));
          }
        });

        // si no hubo error de campo, al menos mostramos el detail
        if (!hasFieldError && errorData?.detail) {
          toast.error(errorData.detail);
        }
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error("Error al crear empleado");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!pending) onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo empleado administrador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Cédula</Label>
            <Input
              value={form.username}
              onChange={(e) => onChange("username", e.target.value)}
              placeholder="Ej. 1718137159"
            />
            {msg("username") && (
              <p className="text-xs text-destructive">{msg("username")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            {msg("email") && (
              <p className="text-xs text-destructive">{msg("email")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            {msg("password") && (
              <p className="text-xs text-destructive">{msg("password")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Género</Label>
            <Combobox
              options={genders}
              value={form.gender}
              onChange={(v) => onChange("gender", v)}
            />
            {msg("gender") && (
              <p className="text-xs text-destructive">{msg("gender")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Nombres</Label>
            <Input
              value={form.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder="Ej. Ana María"
            />
            {msg("firstName") && (
              <p className="text-xs text-destructive">{msg("firstName")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Apellidos</Label>
            <Input
              value={form.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              placeholder="Ej. Pérez Gómez"
            />
            {msg("lastName") && (
              <p className="text-xs text-destructive">{msg("lastName")}</p>
            )}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label>Centro médico</Label>
            <Combobox
              options={centerOptions}
              value={form.centerId}
              onChange={(v) => {
                onChange("centerId", v);
              }}
            />
            {msg("centerId") && (
              <p className="text-xs text-destructive">{msg("centerId")}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending || !canSubmit}>
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
