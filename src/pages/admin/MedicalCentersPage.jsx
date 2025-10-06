import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import DataTable from "@/components/ui/table/data-table-pb";
import { PageHeading } from "@/components/ui/typography/Heading";
import PageMeta from "@/inc/seo/PageMeta.jsx";
import medicalCenters from "@/services/medicalCenters.service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/shadcn/dialog";
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

import CenterForm from "@/components/medicalCenter/CenterForm";

const columns = (onEdit, onDelete) => [
    {
        accessorKey: "id",
        header: "ID",
        size: 72,
        cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    },
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
        accessorKey: "city",
        header: "Ciudad",
        cell: ({ row }) => row.original.city || "—",
    },
    {
        accessorKey: "address",
        header: "Dirección",
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.address || "—"}</span>
        ),
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
        header: "Acciones", // alineado a la izquierda
        size: 96,
        cell: ({ row }) => {
            const d = row.original;
            const disabled = !!d.deleted;

            return (
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Centro inactivo" : "Editar"}
                        onClick={() => !disabled && onEdit(d)}
                        disabled={disabled}
                    >
                        <Pencil className={`size-4 ${disabled ? "text-muted-foreground" : ""}`} />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Centro inactivo" : "Eliminar"}
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
    },
];

export default function MedicalCentersPage() {
    // Server pagination
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [includeDeleted, setIncludeDeleted] = React.useState(false);

    // Data state
    const [rows, setRows] = React.useState([]);
    const [totalPages, setTotalPages] = React.useState(0);
    const [totalElements, setTotalElements] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Create dialog
    const [createOpen, setCreateOpen] = React.useState(false);
    const [createForm, setCreateForm] = React.useState({ name: "", city: "", address: "" });
    const [createErrors, setCreateErrors] = React.useState({});
    const [canCreate, setCanCreate] = React.useState(false);

    // Edit dialog
    const [editOpen, setEditOpen] = React.useState(false);
    const [editId, setEditId] = React.useState(null);
    const [editForm, setEditForm] = React.useState({ name: "", city: "", address: "" });
    const [editErrors, setEditErrors] = React.useState({});
    const [canEdit, setCanEdit] = React.useState(false);

    // Delete dialog
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmId, setConfirmId] = React.useState(null);

    const load = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Ajusta el nombre del método si tu servicio usa otro (ej. listCenters / page / findAll)
            const data = await medicalCenters.listCenters({
                page,
                size: pageSize,
                includeDeleted,
            });
            setRows(data?.content ?? []);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || "Error";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, includeDeleted]);

    React.useEffect(() => {
        load();
    }, [load]);

    const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }) => {
        if (pageIndex !== page || newPageSize !== pageSize) {
            setPage(pageIndex);
            setPageSize(newPageSize);
        }
    };

    // Handlers CRUD
    const openCreate = () => {
        setCreateForm({ name: "", city: "", address: "" });
        setCreateErrors({});
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        setCreateErrors({});
        try {
            const { data } = await medicalCenters.createCenter(createForm);
            toast.success("Centro creado", { description: data?.name });
            setCreateOpen(false);
            // ver elemento nuevo en la primera página
            setPage(0);
            await load();
        } catch (e) {
            const fieldErrs = medicalCenters.parseFieldErrors?.(e) ?? {};
            if (Object.keys(fieldErrs).length) setCreateErrors(fieldErrs);
            const msg = e?.response?.data?.detail || e?.message || "Error al crear";
            toast.error(msg);
        }
    };

    const onEdit = async (item) => {
        try {
            const { data } = await medicalCenters.getCenter(item.id, { includeDeleted });
            setEditId(data.id);
            setEditForm({ name: data.name, city: data.city, address: data.address });
            setEditErrors({});
            setEditOpen(true);
        } catch (e) {
            toast.error(e?.message || "No se pudo cargar el centro");
        }
    };

    const submitEdit = async () => {
        setEditErrors({});
        try {
            const { data } = await medicalCenters.updateCenter(editId, editForm);
            toast.success("Centro actualizado", { description: data?.name });
            setEditOpen(false);
            await load();
        } catch (e) {
            if (e?.status === 409 || e?.response?.status === 409) {
                toast.error(
                    "Este centro fue modificado por otro usuario. Actualiza la tabla e inténtalo nuevamente."
                );
                return;
            }
            const fieldErrs = medicalCenters.parseFieldErrors?.(e) ?? {};
            if (Object.keys(fieldErrs).length) setEditErrors(fieldErrs);
            const msg = e?.response?.data?.detail || e?.message || "Error al actualizar";
            toast.error(msg);
        }
    };

    const onDelete = (item) => {
        setConfirmId(item.id);
        setConfirmOpen(true);
    };

    const submitDelete = async () => {
        try {
            await medicalCenters.deleteCenter(confirmId);
            setConfirmOpen(false);
            toast.success("Centro eliminado", { description: `ID ${confirmId}` });
            // si borramos la última fila de la página, retrocedemos una
            if (rows.length === 1 && page > 0) {
                setPage((p) => p - 1);
            } else {
                await load();
            }
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || "Error al eliminar";
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <PageMeta title="Centros Médicos" description="Gestión de centros médicos" />

            <PageHeading
                title="Centros Médicos"
                subtitle="Visualiza, crea, edita o elimina centros."
                icon={Building2}
                actions={
                    <div className="flex gap-2">
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Nuevo centro
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIncludeDeleted((v) => !v);
                                setPage(0);
                            }}
                        >
                            {includeDeleted ? "Ocultar eliminados" : "Mostrar eliminados"}
                        </Button>
                    </div>
                }
            />

            {/* Crear */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear centro</DialogTitle>
                        <DialogDescription>Complete los campos requeridos</DialogDescription>
                    </DialogHeader>
                    <CenterForm
                        value={createForm}
                        onChange={setCreateForm}
                        errors={createErrors}
                        onValidityChange={setCanCreate}
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={submitCreate} disabled={!canCreate}>
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tabla */}
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Centros médicos</h3>
                        <p className="text-sm text-muted-foreground">Directorio administrativo de centros</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
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

                <div className="p-6 pt-6 pb-4">
                    <DataTable
                        columns={columns(onEdit, onDelete)}
                        data={rows}
                        manualPagination={true}
                        pageCount={Math.max(totalPages, 1)}
                        totalRows={totalElements}
                        state={{ pagination: { pageIndex: page, pageSize } }}
                        onPaginationChange={handlePaginationChange}
                        emptyMessage={isLoading ? "Cargando..." : error ? error : "Sin datos"}
                        searchable={false}
                    />
                </div>

                <div className="flex items-center justify-between px-4 py-2 text-[0.95rem] text-muted-foreground">
                    <div>
                        Total: {totalElements}
                        <Separator
                            className="mx-3 h-4 inline-block align-middle"
                            orientation="vertical"
                        />
                        Página {page + 1} de {Math.max(totalPages, 1)}
                    </div>
                    <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Refrescar
                    </Button>
                </div>
            </div>

            {/* Editar */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar centro</DialogTitle>
                        <DialogDescription>Actualice los campos y guarde</DialogDescription>
                    </DialogHeader>
                    <CenterForm
                        value={editForm}
                        onChange={setEditForm}
                        errors={editErrors}
                        onValidityChange={setCanEdit}
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={submitEdit} disabled={!canEdit}>
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Eliminar */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar centro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDelete}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
