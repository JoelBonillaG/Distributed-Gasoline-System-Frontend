import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import passwordService from "@/services/passwordService";
import AlertMessage from "@/components/ui/alerts/AlertMessage";
import logo from "@/assets/favicon.ico";

// ✅ Solo las reglas básicas
const passwordRules = [
  { label: "Debe tener al menos 8 caracteres", test: (p) => p.length >= 8 },
  {
    label: "Debe contener al menos una letra mayúscula",
    test: (p) => /[A-Z]/.test(p),
  },
];

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setShowRules(!!newPassword);
  }, [newPassword]);

  // 🔹 Mantienes tu handler original
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
      const [data] = await Promise.all([
        passwordService.reset(token, newPassword),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);

      if (data.success) {
        setMessageType("info");
        setMessage(
          data.message || "Tu contraseña fue actualizada correctamente."
        );
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // Si el backend respondió sin success:true
        setMessageType("error");
        setMessage(data.message || "No se pudo actualizar la contraseña.");
      }
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const errorMsg = err.message || "Error al procesar la solicitud.";
      setMessageType("error");
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const AUTH_BG = "/assets/background.webp";

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
                  {/* Input nueva contraseña */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Input confirmar contraseña */}
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

                  {/* Validación visual con transición suave */}
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      showRules
                        ? "max-h-32 opacity-100 mt-2"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="text-sm mt-1 space-y-1">
                      {passwordRules.map((rule, i) => {
                        const passed = rule.test(newPassword || "");
                        return (
                          <li
                            key={i}
                            className={`flex items-center gap-2 transition-colors duration-300 ${
                              passed ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {passed ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <XCircle className="size-4" />
                            )}
                            <span>{rule.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FB923C]"
                  >
                    {loading ? "Guardando..." : "Actualizar contraseña"}
                  </Button>
                </form>

                {message && (
                  <AlertMessage type={messageType}>{message}</AlertMessage>
                )}

                <div className="mt-4 text-right">
                  <Button
                    asChild
                    variant="link"
                    className="
                  p-0
                  text-[#F97316]
                  font-medium
                  transition-all
                  duration-700
                  ease-out
                  drop-shadow-[0_0_4px_rgba(249,115,22,0.35)]
                  hover:text-[#FB923C]
                  hover:drop-shadow-[0_0_10px_rgba(249,115,22,0.7)]
                "
                  >
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
