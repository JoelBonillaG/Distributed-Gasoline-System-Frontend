import React from "react";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/shadcn/alert-dialog";
import DataTable from "@/components/ui/table/data-table-pb";
import { PageHeading } from "@/components/ui/typography/Heading";
import { Plus, Pencil, Trash2, Loader2, Stethoscope } from "lucide-react";
import doctors from "@/services/doctors.service";
import CreateDoctorDialog from "@/components/doctor/CreateDoctorDialog";
import EditDoctorDialog from "@/components/doctor/EditDoctorDialog";

// Columnas con ordenamiento por columna habilitado (no desactivamos sorting)
const baseColumns = (onEdit, onDelete) => [
    {
        accessorKey: "id",
        header: "ID",
        size: 72,
        cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    },
    {
        id: "user",
        header: "Usuario",
        cell: ({ row }) => {
            const d = row.original;
            const title = d.gender === "FEMALE" ? "Dra." : "Dr.";
            const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ") || d.username;
            return (
                <div className="leading-snug">
                    <div className="font-medium">
                        {title} {fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">C.I. {d.username}</div>
                </div>
            );
        },
    },
    {
        accessorKey: "specialtyName",
        header: "Especialidad",
        cell: ({ row }) => row.original.specialtyName || "—",
    },
    {
        accessorKey: "deleted",
        header: "Estado",
        cell: ({ row }) => {
            const isDeleted = !!row.original.deleted;
            return (
                <span className={isDeleted ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                  {isDeleted ? "Inactivo" : "Activo"}
                </span>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: "Actualizado",
        size: 160,
        cell: ({ row }) =>
            row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : "—",
    },
    {
        id: "actions",
        header: "Acciones",
        size: 96,
        cell: ({ row }) => {
            const d = row.original;
            const disabled = !!d.deleted;

            return (
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Doctor inactivo" : "Editar"}
                        onClick={() => !disabled && onEdit(d)}
                        disabled={disabled}
                    >
                        <Pencil className={`size-4 ${disabled ? "text-muted-foreground" : ""}`} />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Doctor inactivo" : "Eliminar"}
                        onClick={() => !disabled && onDelete(d)}
                        disabled={disabled}
                    >
                        <Trash2
                            className={`size-4 ${
                                disabled ? "text-muted-foreground" : "text-destructive"
                            }`}
                        />
                    </Button>
                </div>
            );
        },
    }

];

export default function DoctorsPage() {
    const [includeDeleted, setIncludeDeleted] = React.useState(false);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [pageCount, setPageCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [editId, setEditId] = React.useState(null);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmId, setConfirmId] = React.useState(null);
    const [deletePending, setDeletePending] = React.useState(false);

    const load = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Nota: quitamos "sort" del request; el orden es client-side por columna
            const data = await doctors.listDoctors({
                includeDeleted,
                page: pageIndex,
                size: pageSize,
            });
            setRows(data?.content ?? []);
            setTotal(data?.totalElements ?? 0);
            setPageCount(data?.totalPages ?? 0);
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || "Error";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [includeDeleted, pageIndex, pageSize]);

    React.useEffect(() => {
        load();
    }, [load]);

    const onPaginationChange = ({ pageIndex: pi, pageSize: ps }) => {
        if (pi !== pageIndex || ps !== pageSize) {
            setPageIndex(pi);
            setPageSize(ps);
        }
    };

    const openCreate = () => setCreateOpen(true);

    const onEdit = (item) => {
        setEditId(item.id);
        setEditOpen(true);
    };

    const onDelete = (item) => {
        setConfirmId(item.id);
        setConfirmOpen(true);
    };

    const submitDelete = async () => {
        setDeletePending(true);
        try {
            await doctors.deleteDoctor(confirmId);
            setConfirmOpen(false);
            toast.success("Doctor eliminado", { description: `ID ${confirmId}` });
            // Si se elimina la última fila de la página, retrocede una página
            if (rows.length === 1 && pageIndex > 0) {
                setPageIndex((p) => p - 1);
            } else {
                await load();
            }
        } catch (e) {
            toast.error(e?.message || "Error");
        } finally {
            setDeletePending(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <PageHeading
                title="Doctores"
                subtitle="Crea, asocia, edita y administra doctores"
                icon={Stethoscope}
                actions={
                    <div className="flex gap-2">
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Nuevo doctor
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIncludeDeleted((v) => !v);
                                setPageIndex(0);
                            }}
                        >
                            {includeDeleted ? "Ocultar eliminados" : "Mostrar eliminados"}
                        </Button>
                    </div>
                }
            />

            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Doctores</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Listado administrativo de profesionales
                            </p>
                        </div>

                        {/* Leyenda de estados */}
                        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="size-2 rounded-full bg-green-500" />
                            Activo
                          </span>
                                                <span className="inline-flex items-center gap-1">
                            <span className="size-2 rounded-full bg-red-500" />
                            Inactivo
                          </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <DataTable
                        columns={baseColumns(onEdit, onDelete)}
                        data={rows}
                        manualPagination={true}
                        pageCount={Math.max(pageCount, 1)}
                        totalRows={total}
                        state={{ pagination: { pageIndex, pageSize } }}
                        onPaginationChange={onPaginationChange}
                        emptyMessage={isLoading ? "Cargando..." : error ? error : "Sin datos"}
                        searchable={false} // sin filtros/buscador
                        className="[&_th]:py-2 [&_td]:py-2"
                    />
                </CardContent>

                <CardFooter className="text-sm text-muted-foreground">
                    Total: {total}
                    <Separator className="mx-3 h-4" orientation="vertical" />
                    Página {pageIndex + 1} de {Math.max(pageCount, 1)}
                    <Separator className="mx-3 h-4" orientation="vertical" />
                    <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Refrescar
                    </Button>
                </CardFooter>
            </Card>

            <CreateDoctorDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={load} />

            <EditDoctorDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                doctorId={editId}
                includeDeleted={includeDeleted}
                onSuccess={load}
            />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar doctor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDelete} disabled={deletePending}>
                            {deletePending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
