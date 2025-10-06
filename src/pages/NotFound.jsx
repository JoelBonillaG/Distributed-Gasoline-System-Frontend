import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Home, ArrowLeft, BookText, Ghost } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        /* Overlay a pantalla completa, independiente del layout que haya debajo */
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background">
            {/* Fondo sutil */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
                <div className="absolute left-1/2 top-[-12%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
                <div className="absolute bottom-[-18%] right-[-10%] h-[22rem] w-[22rem] rounded-full bg-accent/30 blur-2xl dark:bg-accent/20" />
            </div>

            {/* Contenido centrado */}
            <section className="w-full max-w-3xl px-6 text-center">
                <div className="mx-auto mb-6 grid size-16 place-content-center rounded-2xl bg-muted">
                    <Ghost className="size-8 text-muted-foreground" />
                </div>

                <p className="text-sm uppercase tracking-widest text-muted-foreground">Error 404</p>
                <h1 className="mt-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                    Página no encontrada
                </h1>
                <p className="mx-auto mt-3 max-w-[60ch] text-balance text-muted-foreground">
                    La ruta <span className="font-mono text-foreground/80">{pathname}</span> no existe o fue movida.
                    Comprueba la URL o utiliza uno de estos accesos directos.
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

                    <Button asChild variant="ghost" className="gap-2">
                        <Link to="/admin/docs">
                            <BookText className="size-4" />
                            <span>Guías & Manuales</span>
                        </Link>
                    </Button>
                </div>

                <Separator className="mx-auto my-8 w-full" />

                <div className="flex flex-wrap justify-center gap-2 text-sm">
                    {[
                        { to: "/admin/employees", label: "Empleados" },
                        { to: "/admin/doctors", label: "Doctores" },
                        { to: "/admin/patients", label: "Pacientes" },
                        { to: "/admin/specialties", label: "Especialidades" },
                        { to: "/admin/centers", label: "Centros médicos" },
                        { to: "/admin/consultations", label: "Consultas médicas" },
                        { to: "/admin/playground", label: "Playground" },
                    ].map((i) => (
                        <Link
                            key={i.to}
                            to={i.to}
                            className="rounded-full border px-3 py-1.5 text-foreground/80 transition hover:bg-accent hover:text-accent-foreground"
                        >
                            {i.label}
                        </Link>
                    ))}
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                    Código de referencia: <span className="font-mono">404-NF</span>
                </p>
            </section>
        </div>
    );
}
