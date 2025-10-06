import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Eye, Loader2, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import DataTable from "@/components/ui/table/data-table-pb";
import { PageHeading } from "@/components/ui/typography/Heading";
import employees from "@/services/employeeService";
import CreateEmployeeDialog from "@/components/employees/CreateEmployeeDialog";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import ViewEmployeeDialog from "@/components/employees/ViewEmployeeDialog";
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

export default function EmployeesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editEmployee, setEditEmployee] = React.useState(null);

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);

  const [rows, setRows] = React.useState([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [deletePending, setDeletePending] = React.useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employees.listEmployees({
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

  // dentro del componente EmployeesPage
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // función para abrir confirmación
  const onDelete = (employee) => {
    setConfirmId(employee.id);
    setConfirmOpen(true);
  };

  // función para eliminar
  const submitDelete = async () => {
    if (!confirmId) return;
    setDeletePending(true);
    try {
      await employees.deleteEmployee(confirmId);
      toast.success("Empleado eliminado", { description: `ID ${confirmId}` });
      setConfirmOpen(false);
      // si era la última fila de la página, retrocedemos una página
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.message || "Error");
    } finally {
      setDeletePending(false);
    }
  };

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.id}</span>
      ),
    },
    {
      id: "user",
      header: "Usuario",
      cell: ({ row }) => {
        const d = row.original;
        const title = d.gender === "FEMALE" ? "Sra." : "Sr.";
        const fullName =
          [d.firstName, d.lastName].filter(Boolean).join(" ") || d.username;
        return (
          <div className="leading-snug">
            <div className="font-medium">
              {title} {fullName}
            </div>
            <div className="text-xs text-muted-foreground">
              C.I. {d.username}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Correo",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "center_name",
      header: "Centro",
      cell: ({ row }) => row.original.center_name || "—",
    },
    {
      accessorKey: "enabled",
      header: "Estado",
      cell: ({ row }) => (
        <span
          className={
            row.original.enabled
              ? "text-green-600 font-medium"
              : "text-red-600 font-medium"
          }
        >
          {row.original.enabled ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const d = row.original;
        const disabled = !d.enabled;

        return (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Editar"
              onClick={() => {
                setEditEmployee(d);
                setEditOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              title={disabled ? "Empleado inactivo" : "Deshabilitar"}
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

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Empleados"
        subtitle="Visualiza empleados, crea, edita o elimina."
        icon={UserCog}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Nuevo empleado
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIncludeDeleted((v) => !v);
                setPage(0);
              }}
            >
              {includeDeleted
                ? "Ocultar deshabilitados"
                : "Mostrar deshabilitados"}
            </Button>
          </div>
        }
      />

      <CreateEmployeeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={load}
      />
      <EditEmployeeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={editEmployee}
        onSuccess={load}
      />
      <ViewEmployeeDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        employee={selectedEmployee}
      />

      {/* Card estandarizada — Empleados */}
      <div className="rounded-xl border bg-card">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Empleados
            </h3>
            <p className="text-sm text-muted-foreground">
              Directorio administrativo del personal
            </p>
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

        {/* Tabla */}
        <div className="p-6 pt-6 pb-4">
          <DataTable
            columns={columns}
            data={rows}
            manualPagination
            pageCount={Math.max(totalPages, 1)}
            totalRows={totalElements}
            state={{ pagination: { pageIndex: page, pageSize } }}
            onPaginationChange={handlePaginationChange}
            emptyMessage={
              isLoading ? "Cargando..." : error ? error : "Sin datos"
            }
            searchable={false}
          />
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between px-6 py-3 text-[0.95rem] text-muted-foreground">
          <div>
            Total: {totalElements}
            <Separator
              className="mx-3 h-4 inline-block align-middle"
              orientation="vertical"
            />
            Página {page + 1} de {Math.max(totalPages, 1)}
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Refrescar
          </Button>
        </div>

        {/* respiración inferior */}
        <div className="pb-2" />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete} disabled={deletePending}>
              {deletePending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
