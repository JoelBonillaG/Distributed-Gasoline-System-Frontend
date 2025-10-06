import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
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
import DataTable from "@/components/ui/table/data-table-pb";
import { PageHeading } from "@/components/ui/typography/Heading";
import { Plus, Pencil, Trash2, Loader2, ClipboardList } from "lucide-react";
import SpecialtyForm from "@/components/specialty/SpecialtyForm";
import specialties from "@/services/specialties.service";

const columns = (onEdit, onDelete) => [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    },
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
            <span className="text-muted-foreground line-clamp-2 max-w-[520px]">
        {row.original.description || "—"}
      </span>
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
        header: "Acciones", // alineado a la izquierda como el resto
        size: 96,
        cell: ({ row }) => {
            const d = row.original;
            const disabled = !!d.deleted;

            return (
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Especialidad inactiva" : "Editar"}
                        onClick={() => !disabled && onEdit(d)}
                        disabled={disabled}
                    >
                        <Pencil className={`size-4 ${disabled ? "text-muted-foreground" : ""}`} />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        title={disabled ? "Especialidad inactiva" : "Eliminar"}
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

export default function SpecialtiesPage() {
    const [includeDeleted, setIncludeDeleted] = React.useState(false);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [pageCount, setPageCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [createForm, setCreateForm] = React.useState({ name: "", description: "" });
    const [createErrors, setCreateErrors] = React.useState({});
    const [canCreate, setCanCreate] = React.useState(false);
    const [createPending, setCreatePending] = React.useState(false);

    const [editOpen, setEditOpen] = React.useState(false);
    const [editId, setEditId] = React.useState(null);
    const [editForm, setEditForm] = React.useState({ name: "", description: "" });
    const [editErrors, setEditErrors] = React.useState({});
    const [canEdit, setCanEdit] = React.useState(false);
    const [editPending, setEditPending] = React.useState(false);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmId, setConfirmId] = React.useState(null);
    const [deletePending, setDeletePending] = React.useState(false);

    const load = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await specialties.listSpecialties({
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

    // Handlers
    const openCreate = () => {
        if (editPending || deletePending) return;
        setCreateForm({ name: "", description: "" });
        setCreateErrors({});
        setCanCreate(false);
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        setCreateErrors({});
        setCreatePending(true);
        try {
            const res = await specialties.createSpecialty(createForm);
            toast.success("Especialidad creada", { description: res?.data?.name });
            setCreateOpen(false);
            setPageIndex(0);
            await load();
        } catch (e) {
            const fieldErrs = specialties.parseFieldErrors?.(e) ?? {};
            if (Object.keys(fieldErrs).length) setCreateErrors(fieldErrs);
            toast.error(e?.message || "Error");
        } finally {
            setCreatePending(false);
        }
    };

    const onEdit = async (item) => {
        if (createPending || deletePending) return;
        setEditErrors({});
        try {
            const { data } = await specialties.getSpecialty(item.id, { includeDeleted });
            setEditId(data.id);
            setEditForm({ name: data.name, description: data.description || "" });
            setCanEdit(true);
            setEditOpen(true);
        } catch (e) {
            toast.error(e?.message || "Error");
        }
    };

    const submitEdit = async () => {
        setEditErrors({});
        setEditPending(true);
        try {
            const res = await specialties.updateSpecialty(editId, editForm);
            toast.success("Especialidad actualizada", { description: res?.data?.name });
            setEditOpen(false);
            await load();
        } catch (e) {
            if (e?.status === 409 || e?.response?.status === 409) {
                toast.error(
                    "Esta especialidad fue modificada por otro usuario. Refresca los datos e inténtalo de nuevo."
                );
            } else {
                const fieldErrs = specialties.parseFieldErrors?.(e) ?? {};
                if (Object.keys(fieldErrs).length) setEditErrors(fieldErrs);
                toast.error(e?.message || "Error");
            }
        } finally {
            setEditPending(false);
        }
    };

    const onDelete = (item) => {
        if (createPending || editPending) return;
        setConfirmId(item.id);
        setConfirmOpen(true);
    };

    const submitDelete = async () => {
        setDeletePending(true);
        try {
            await specialties.deleteSpecialty(confirmId);
            setConfirmOpen(false);
            toast.success("Especialidad eliminada", { description: `ID ${confirmId}` });
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
                title="Especialidades"
                subtitle="Crea, actualiza y administra las especialidades"
                icon={ClipboardList}
                actions={
                    <div className="flex gap-2">
                        <Button
                            onClick={openCreate}
                            disabled={createPending || editPending || deletePending}
                        >
                            <Plus className="mr-2 size-4" />
                            Nueva especialidad
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIncludeDeleted((v) => !v);
                                setPageIndex(0);
                            }}
                            disabled={createPending || editPending || deletePending}
                        >
                            {includeDeleted ? "Ocultar eliminadas" : "Mostrar eliminadas"}
                        </Button>
                    </div>
                }
            />

            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Especialidades</h3>
                        <p className="text-sm text-muted-foreground">Catálogo administrativo de especialidades médicas</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full bg-green-500" />
                        Activa
                      </span>
                                        <span className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full bg-red-500" />
                        Inactiva
                      </span>
                    </div>
                </div>

                <div className="p-6 pt-6 pb-4">
                    <DataTable
                        columns={columns(onEdit, onDelete)}
                        data={rows}
                        manualPagination={true}
                        pageCount={Math.max(pageCount, 1)}
                        totalRows={total}
                        state={{ pagination: { pageIndex, pageSize } }}
                        onPaginationChange={onPaginationChange}
                        emptyMessage={isLoading ? "Cargando..." : error ? error : "Sin datos"}
                        searchable={false}
                    />
                </div>

                <div className="flex items-center justify-between px-4 py-2 text-[0.95rem] text-muted-foreground">
                    <div>
                        Total: {total}
                        <Separator className="mx-3 h-4 inline-block align-middle" orientation="vertical" />
                        Página {pageIndex + 1} de {Math.max(pageCount, 1)}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={load}
                        disabled={isLoading || createPending || editPending || deletePending}
                    >
                        {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Refrescar
                    </Button>
                </div>
            </div>

            {/* Crear */}
            <Dialog open={createOpen} onOpenChange={(o) => !createPending && setCreateOpen(o)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear especialidad</DialogTitle>
                        <DialogDescription>Completa los campos requeridos</DialogDescription>
                    </DialogHeader>
                    <SpecialtyForm
                        value={createForm}
                        onChange={setCreateForm}
                        errors={createErrors}
                        onValidityChange={setCanCreate}
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createPending}>
                            Cancelar
                        </Button>
                        <Button onClick={submitCreate} disabled={!canCreate || createPending}>
                            {createPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Editar */}
            <Dialog open={editOpen} onOpenChange={(o) => !editPending && setEditOpen(o)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar especialidad</DialogTitle>
                        <DialogDescription>Actualiza los campos y guarda</DialogDescription>
                    </DialogHeader>
                    <SpecialtyForm
                        value={editForm}
                        onChange={setEditForm}
                        errors={editErrors}
                        onValidityChange={setCanEdit}
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={editPending}>
                            Cancelar
                        </Button>
                        <Button onClick={submitEdit} disabled={!canEdit || editPending}>
                            {editPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Eliminar */}
            <AlertDialog open={confirmOpen} onOpenChange={(o) => !deletePending && setConfirmOpen(o)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar especialidad?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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
