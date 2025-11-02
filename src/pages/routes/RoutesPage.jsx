import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import DataTable from "@/components/ui/table/data-table";
import { PageHeading } from "@/components/ui/typography/Heading";
import {
    Eye,
    Pencil,
    Plus,
    Trash2,
    MapPin,
} from "lucide-react";
import { useAllRoutes } from "@/hooks/use-routes";

const VEHICLE_TYPE_OPTIONS = [
    { value: "LIVIANO", label: "Liviano" },
    { value: "PESADO", label: "Pesado" },
    { value: "CUALQUIERA", label: "Liviano o Pesado" },
];

export default function RoutesPage() {
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState(null);

    const {
        data: routesData,
        isLoading,
        isError,
        error,
    } = useAllRoutes(vehicleTypeFilter);

    const routes = useMemo(
        () =>
            (routesData ?? []).map((route) => ({
                ...route,
                id: route.id,
            })),
        [routesData]
    );

    const columns = useMemo(() => [
        {
            accessorKey: "id",
            header: "ID",
            size: 80,
        },
        {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "originName",
            header: "Origen",
            cell: ({ row }) => row.original.originName || "—",
        },
        {
            accessorKey: "destinationName",
            header: "Destino",
            cell: ({ row }) => row.original.destinationName || "—",
        },
        {
            accessorKey: "distanceKm",
            header: "Distancia",
            cell: ({ row }) => {
                const distance = row.original.distanceKm;
                return distance ? `${Number(distance).toFixed(2)} km` : "—";
            },
        },
        {
            accessorKey: "vehicleType",
            header: "Tipo Vehículo",
            cell: ({ row }) => {
                const type = row.original.vehicleType;
                if (!type) return "—";
                const option = VEHICLE_TYPE_OPTIONS.find(
                    (opt) => opt.value === type
                );
                return option?.label || type;
            },
        },
    ], []);

    const rowActions = (row) => {
        return (
            <div className="flex gap-1 justify-end">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        // TODO: Implementar ver detalles
                        console.log("Ver ruta:", row.original);
                    }}
                    title="Ver"
                >
                    <Eye className="size-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        // TODO: Implementar editar
                        console.log("Editar ruta:", row.original);
                    }}
                    title="Editar"
                >
                    <Pencil className="size-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        // TODO: Implementar eliminar
                        console.log("Eliminar ruta:", row.original);
                    }}
                    title="Eliminar"
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6">
            <PageHeading
                title="Rutas del sistema"
                subtitle="Administra las rutas de distribución y sus configuraciones."
                icon={MapPin}
                actions={
                    <div className="flex gap-2">
                        {/* Filtro por tipo de vehículo */}
                        <div className="flex gap-2 border rounded-lg p-1 bg-card">
                            <Button
                                variant={vehicleTypeFilter === null ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setVehicleTypeFilter(null)}
                            >
                                Todos
                            </Button>
                            {VEHICLE_TYPE_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    variant={vehicleTypeFilter === option.value ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setVehicleTypeFilter(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                // TODO: Implementar nueva ruta
                            }}
                        >
                            <Plus className="mr-2 size-4" />
                            Nueva ruta
                        </Button>
                    </div>
                }
            />

            <div className="rounded-xl border bg-card">
                <div className="p-4 pt-1">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">
                            Cargando rutas…
                        </div>
                    ) : isError ? (
                        <div className="text-sm text-destructive">
                            {error?.message || "Error al cargar"}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={routes}
                            rowActions={rowActions}
                            emptyMessage="Sin rutas"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

