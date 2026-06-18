import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Avatar, AvatarFallback } from "@/components/ui/shadcn/avatar";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2 } from "lucide-react";
import AuthContext from "@/context/AuthContext";
import employees from "@/services/employeeService";

export default function ProfilePage() {
  const { user, updateUser } = React.useContext(AuthContext);

  const [form, setForm] = React.useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Campo obligatorio";
    if (!form.lastName.trim()) e.lastName = "Campo obligatorio";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eValid = validate();
    if (Object.keys(eValid).length) {
      setErrors(eValid);
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setPending(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };

      const res = await employees.updateProfile(user.userId, payload);

      updateUser(res);
      toast.success("Perfil actualizado correctamente!");
    } catch (err) {
      const msg = err?.response?.data?.detail || "No se pudo actualizar.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-10">
      <Card className="w-full max-w-md border border-border shadow-xl bg-card/80 backdrop-blur-md rounded-2xl">
        <CardHeader className="flex flex-col items-center space-y-4">
          {/* Avatar con iniciales */}
          <Avatar className="h-28 w-28 text-3xl font-bold bg-muted text-foreground ring-2 ring-border shadow-md">
            <AvatarFallback>
              {user
                ? `${user?.firstName?.[0]?.toUpperCase() ?? ""}${
                    user?.lastName?.[0]?.toUpperCase() ?? ""
                  }`
                : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Título dinámico */}
          <CardTitle className="text-3xl font-semibold tracking-tight text-center">
            Perfil de {user?.firstName} {user?.lastName}
          </CardTitle>

          <CardDescription className="text-center text-muted-foreground">
            Actualiza tu información personal. El correo y teléfono son de solo
            lectura.
          </CardDescription>
        </CardHeader>

        <Separator className="my-5 opacity-60" />

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                placeholder="Tu nombre"
                className="bg-background border-border focus-visible:ring-[var(--brand-1)]"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>

            {/* Apellido */}
            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                placeholder="Tu apellido"
                className="bg-background border-border focus-visible:ring-[var(--brand-1)]"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>

            {/* Email (solo lectura) */}
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed border-border"
              />
            </div>

            {/* Teléfono (solo lectura) */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={user?.phone || ""}
                disabled
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed border-border"
              />
            </div>
          </CardContent>

          {/* Botón */}
          <CardFooter className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={pending}
              className="
                bg-[#F97316] hover:bg-[#FB923C]
                text-white font-medium rounded-lg
                px-5 py-2 w-full md:w-auto
                transition-all duration-300
                shadow-md hover:shadow-[0_0_10px_rgba(249,115,22,0.6)]
                flex items-center justify-center
              "
            >
              {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
