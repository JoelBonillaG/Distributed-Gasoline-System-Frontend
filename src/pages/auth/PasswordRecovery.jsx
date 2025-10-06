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
import { Link } from "react-router-dom";
import passwordService from "@/services/passwordService";
import AlertMessage from "@/components/ui/alerts/AlertMessage";
import logo from "@/assets/favicon.ico";

function PasswordRecovery() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await passwordService.requestReset(input);
      setMessage(
        "Si la cuenta existe, hemos enviado un correo con instrucciones."
      );
    } catch (err) {
      setMessage("Ocurrió un error al procesar la solicitud.");
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

      {/* Panel lateral (desktop) */}
      <div className="hidden md:flex absolute inset-0 items-center">
        <div className="pl-6 md:pl-10 max-w-xl">
          <Card className="bg-white/10 supports-[backdrop-filter]:bg-white/10 backdrop-blur-md border-white/20 text-white shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="mb-5 grid size-12 place-content-center rounded-full bg-brand text-brand-contrast shadow-sm ring-1 ring-black/10 dark:ring-white/10">
                <KeyRound className="size-7" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                Recupera tu contraseña
              </h2>
              <p className="mt-4 text-base/7 text-white/90">
                Ingresa tu correo electrónico o DNI para recibir un enlace de
                restablecimiento.
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
              H<span className="text-sm relative -top-[1px]">&</span>Q Hospital
            </h1>
            <div className="relative overflow-hidden rounded-full size-16 sm:size-20 md:size-24 border bg-[color-mix(in_oklab,var(--brand-veil),transparent_78%)] backdrop-blur-md shadow-sm">
              <img
                src={logo}
                alt="H&Q"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </header>

          {/* Contenido */}
          <div className="flex-1 flex items-center">
            <Card className="w-full border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                <CardTitle className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">
                  Recuperar contraseña
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ingresa tu correo electrónico o DNI para restablecer tu
                  contraseña.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="input">Email o DNI</Label>
                    <Input
                      id="input"
                      type="text"
                      placeholder="ejemplo@mail.com o 12345678"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-foreground hover:bg-foreground/10"
                  >
                    {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </form>

                {message && (
                  <AlertMessage
                    type={
                      message.includes("enviado") // si contiene "enviado", usamos azul/informativo
                        ? "info"
                        : "error"
                    }
                  >
                    {message}
                  </AlertMessage>
                )}
              </CardContent>

              <CardFooter className="px-0">
                <div className="ml-auto">
                  <Button asChild variant="link" className="p-0 text-primary">
                    <Link to="/login">Volver al login</Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="pt-4 text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} H&Q Hospital
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordRecovery;
