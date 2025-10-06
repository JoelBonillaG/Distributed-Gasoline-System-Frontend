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

const genders = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
];

export default function EditEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  employee,
}) {
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    gender: "",
  });

  const [clientErrs, setClientErrs] = React.useState({});
  const [serverErrs, setServerErrs] = React.useState({});
  const [pending, setPending] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (open && employee) {
      console.log("Employee", employee);
      setForm({
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        gender: employee.gender || "",
      });
      setClientErrs({});
      setServerErrs({});
      setSubmitAttempted(false);
    }
  }, [open, employee]);

  // Validación simple
  const validateField = (field, value) => {
    const s = (value ?? "").trim();
    switch (field) {
      case "firstName":
        return s ? "" : "Ingresa los nombres.";
      case "lastName":
        return s ? "" : "Ingresa los apellidos.";
      case "gender":
        return s ? "" : "Selecciona el género.";
      default:
        return "";
    }
  };

  const msg = (f) =>
    serverErrs[f] || ((submitAttempted || form[f]) && clientErrs[f]) || "";

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const clientMsg = validateField(field, value);
    setClientErrs((prev) => ({ ...prev, [field]: clientMsg }));
    if (serverErrs[field]) setServerErrs((prev) => ({ ...prev, [field]: "" }));
  };

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.gender &&
    Object.values(clientErrs).every((m) => !m) &&
    Object.values(serverErrs).every((m) => !m);

  const submit = async () => {
    setSubmitAttempted(true);
    const errs = Object.keys(form).reduce((acc, f) => {
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
      await employees.updateEmployee(employee.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
      });
      toast.success("Empleado actualizado correctamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const errorData = e?.data;
      if (errorData?.errors) {
        Object.entries(errorData.errors).forEach(([field, message]) => {
          setServerErrs((prev) => ({ ...prev, [field]: message }));
        });
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error("Error al actualizar empleado");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar empleado</DialogTitle>
          <DialogDescription>
            Actualiza la información del empleado seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
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
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
