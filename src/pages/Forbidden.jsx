import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Home, ArrowLeft, Lock } from "lucide-react";

export default function Forbidden() {
    const navigate = useNavigate();

    return (
        /* Overlay a pantalla completa */
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background">
            {/* Fondo decorativo */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
                <div className="absolute left-1/2 top-[-12%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
                <div className="absolute bottom-[-18%] right-[-10%] h-[22rem] w-[22rem] rounded-full bg-destructive/30 blur-2xl dark:bg-destructive/20" />
            </div>

            {/* Contenido */}
            <section className="w-full max-w-3xl px-6 text-center">
                <div className="mx-auto mb-6 grid size-16 place-content-center rounded-2xl bg-muted">
                    <Lock className="size-8 text-muted-foreground" />
                </div>

                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                    Error 403
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                    Acceso denegado
                </h1>
                <p className="mx-auto mt-3 max-w-[60ch] text-balance text-muted-foreground">
                    No tienes permisos suficientes para ver esta página. Si crees que se
                    trata de un error, contacta al administrador.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
                        <ArrowLeft className="size-4" />
                        <span>Volver</span>
                    </Button>

                    <Button asChild className="gap-2">
                        <Link to="/admin">
                            <Home className="size-4" />
                            <span>Ir al Dashboard</span>
                        </Link>
                    </Button>
                </div>

                <Separator className="mx-auto my-8 w-full" />

                <p className="mt-6 text-xs text-muted-foreground">
                    Código de referencia: <span className="font-mono">403-FB</span>
                </p>
            </section>
        </div>
    );
}
