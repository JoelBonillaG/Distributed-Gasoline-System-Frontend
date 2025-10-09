import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb";

const TITLE_MAP = {
    "admin": "Dashboard",
    "patients": "Pacientes",
    "doctors": "Doctores",
    "labs": "Laboratorio",
    "centers": "Centros médicos",
    "history": "Historial",
    "specialties": "Especialidades",
    "employees": "Empleados",
    "starred": "Favoritos",
    "settings": "Ajustes",
    "playground": "Playground",
    "docs": "Guías & Manuales",
    "vehicles": "Vehículos",
    "models": "Modelos",
    "units": "Unidades",
    "create": "Crear",
    "edit": "Editar",
    "new": "Nuevo",
};

function pretty(seg) {
    return TITLE_MAP[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1));
}

export default function AdminBreadcrumbs() {
    const { pathname } = useLocation();
    const parts = pathname.split("/").filter(Boolean);

    // Si no hay nada más que /admin, muestra solo "Dashboard"
    if (parts.length === 1 && parts[0] === "admin") {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link to="/admin">{pretty("admin")}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    const items = [];
    let acc = "";

    parts.forEach((seg, idx) => {
        acc += `/${seg}`;
        const isLast = idx === parts.length - 1;
        items.push(
            <BreadcrumbItem key={acc}>
                {isLast ? (
                    <span className="text-foreground/80">{pretty(seg)}</span>
                ) : (
                    <BreadcrumbLink asChild>
                        <Link to={acc}>{pretty(seg)}</Link>
                    </BreadcrumbLink>
                )}
            </BreadcrumbItem>
        );
        if (!isLast) items.push(<BreadcrumbSeparator key={`${acc}-sep`} />);
    });

    return (
        <Breadcrumb>
            <BreadcrumbList>{items}</BreadcrumbList>
        </Breadcrumb>
    );
}
