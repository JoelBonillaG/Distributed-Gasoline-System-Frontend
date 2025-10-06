import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import LoginFormComponent from "@/pages/auth/LoginFormComponente";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/favicon.ico";
import { Plus } from "lucide-react";

function Login() {
    const AUTH_BG = "/assets/background.webp";
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate("/", { replace: true });
    }, [isAuthenticated, navigate]);

    return (
        <div className="relative min-h-dvh overflow-hidden">
            {/* Fondo */}
            <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: `url(${AUTH_BG})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent dark:from-black/65 dark:via-black/40 dark:to-transparent" />

            {/* Mensaje lateral (solo desktop) */}
            <div className="hidden md:flex absolute inset-0 items-center">
                <div className="pl-6 md:pl-10 max-w-xl">
                    <Card className="bg-white/10 supports-[backdrop-filter]:bg-white/10 backdrop-blur-md border-white/20 text-white shadow-xl">
                        <CardContent className="p-6 md:p-7">
                            <div className="mb-5 grid size-12 place-content-center rounded-full bg-brand text-brand-contrast shadow-sm ring-1 ring-black/10 dark:ring-white/10">
                                <Plus className="size-7" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                                Gestión de Combustible Inteligente
                            </h2>
                            <p className="mt-4 text-base/7 text-white/90">
                                En <span className="font-semibold">FuelIQ</span> optimizamos el abastecimiento, rastreamos consumo y reducimos pérdidas con datos en tiempo real y reportes accionables.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Panel derecho / principal */}
            <div className="relative z-10 ml-auto flex h-dvh w-full items-stretch justify-end">
                <div className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card px-5 sm:px-7 md:px-10 py-6 md:py-10 shadow-2xl dark:shadow-black/40 text-foreground">
                    {/* HEADER SUPERIOR: título + logo (responsive) */}
                    <header className="flex flex-col items-center gap-3 mb-4 md:mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
                            FuelIQ
                        </h1>

                        {/* Contenedor circular: el logo cubre completamente */}
                        <div
                            className="
                relative overflow-hidden rounded-md
                size-16 sm:size-20 md:size-24
                border border-border
                bg-[color-mix(in_oklab,var(--brand-veil),transparent_78%)]
                backdrop-blur-md shadow-sm
              "
                            aria-hidden
                        >
                            <img
                                src={logo}
                                alt="FuelIQ Logo"
                                draggable={false}
                                className="w-full h-full object-contain p-1"
                            />

                        </div>
                    </header>

                    {/* Contenido */}
                    <div className="flex-1 flex items-center">
                        <Card className="w-full border-0 shadow-none bg-transparent">
                            <CardHeader className="px-0 pb-4">
                                {/* (opcional) Subtítulo de la página */}
                                <CardTitle className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">
                                        Iniciar sesión
                                    </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Ingresa tus credenciales para acceder al sistema.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-0">
                                <LoginFormComponent />
                            </CardContent>

                            <CardFooter className="px-0">
                                <div className="ml-auto">
                                    <Button asChild variant="link" className="p-0 text-primary">
                                        <Link to="/password-recovery">¿Olvidaste tu contraseña?</Link>
                                    </Button>
                                </div>
                            </CardFooter>
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

export default Login;
