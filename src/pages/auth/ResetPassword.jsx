import { KeyRound } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import passwordService from "@/services/passwordService";
import AlertMessage from "@/components/ui/alerts/AlertMessage";
import logo from "@/assets/favicon.ico";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setMessageType("error");
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await Promise.all([
        passwordService.reset(token, newPassword),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      const data = response[0];

      // Determinar tipo de respuesta
      if (data.success) {
        setMessageType("info");
        setMessage("Tu contraseña fue actualizada correctamente.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessageType("error");
        setMessage("No se pudo actualizar la contraseña.");
      }
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const errorMsg = err.message || "Error al procesar la solicitud.";

      if (
        errorMsg.includes("Token inválido") ||
        errorMsg.includes("expirado")
      ) {
        setMessageType("error");
        setMessage("El enlace ha expirado o no es válido. Solicita uno nuevo.");
      } else if (errorMsg.includes("antiguas")) {
        setMessageType("warning");
        setMessage("No puedes reutilizar una contraseña anterior.");
      } else {
        setMessageType("error");
        setMessage("No se pudo actualizar la contraseña. Inténtalo otra vez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const AUTH_BG = "/assets/auth-bg.avif";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${AUTH_BG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent dark:from-black/65 dark:via-black/40 dark:to-transparent" />

      {/* Panel lateral */}
      <div className="hidden md:flex absolute inset-0 items-center">
        <div className="pl-6 md:pl-10 max-w-xl">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="mb-5 grid size-12 place-content-center rounded-full bg-brand text-brand-contrast shadow-sm ring-1 ring-black/10 dark:ring-white/10">
                <KeyRound className="size-7" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                Nueva contraseña
              </h2>
              <p className="mt-4 text-base/7 text-white/90">
                Asegúrate de elegir una contraseña segura para proteger tu
                cuenta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel principal */}
      <div className="relative z-10 ml-auto flex h-dvh w-full items-stretch justify-end">
        <div className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card px-5 sm:px-7 md:px-10 py-6 md:py-10 shadow-2xl dark:shadow-black/40 text-foreground">
          {/* Header */}
          <header className="flex flex-col items-center gap-3 mb-4 md:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
              FuelIQ
            </h1>
            <div className="relative overflow-hidden rounded-md size-16 sm:size-20 md:size-24 border bg-[color-mix(in_oklab,var(--brand-veil),transparent_78%)] backdrop-blur-md shadow-sm">
              <img
                src={logo}
                alt="FuelIQ Logo"
                className="w-full h-full object-contain p-1"
                draggable={false}
              />
            </div>
          </header>

          {/* Contenido */}
          <div className="flex-1 flex items-center">
            <Card className="w-full border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                <CardTitle className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">
                  Restablecer contraseña
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ingresa y confirma tu nueva contraseña.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-foreground hover:bg-foreground/10"
                  >
                    {loading ? "Guardando..." : "Actualizar contraseña"}
                  </Button>
                </form>

                {message && (
                  <AlertMessage type={messageType}>{message}</AlertMessage>
                )}

                <div className="mt-4 text-center">
                  <Button asChild variant="link" className="p-0 text-primary">
                    <Link to="/login">Volver al login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} FuelIQ
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
