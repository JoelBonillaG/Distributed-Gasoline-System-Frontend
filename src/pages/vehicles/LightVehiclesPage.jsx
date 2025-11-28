import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
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
import DataTable from "@/components/ui/table/data-table";
import { PageHeading } from "@/components/ui/typography/Heading";
import { Plus, Pencil, Trash2, Loader2, Car, Eye, FileText, CheckCircle, XCircle, Calendar } from "lucide-react";
import vehiclesService, { getErrorDetail } from "@/services/vehicles.service";
import ViewVehicleDrawer from "@/components/vehicles/ViewVehicleDrawer";
import CreateVehicleDialog from "@/components/vehicles/CreateVehicleDialog";
import EditVehicleDialog from "@/components/vehicles/EditVehicleDialog";

// Mapeo de tipo de máquina para mejor visualización
const MACHINE_TYPE_MAP = {
  HEAVY: "Pesada",
  LIGHT: "Liviana",
};

// Mapeo de estado
const STATUS_MAP = {
  ACTIVE: "Activo",
  DEPRECATED: "Deprecado",
};

// Función para obtener el color del badge según el tipo de máquina
const getMachineTypeBadgeColor = (type) => {
  return type === "HEAVY"
    ? "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30"
    : "bg-chart-1/20 text-chart-1 hover:bg-chart-1/30";
};

// Columnas de la tabla
const baseColumns = (onEdit, onDelete, onView) => [
    {
        accessorKey: "modelId",
        header: "ID",
        size: 72,
        cell: ({ row }) => <span className="tabular-nums">{row.original.modelId}</span>,
    },
    {
        accessorKey: "brand",
        header: "Marca",
        cell: ({ row }) => <div className="font-medium">{row.original.brand}</div>,
    },
    {
        accessorKey: "family",
        header: "Familia",
        cell: ({ row }) => row.original.family || "—",
    },
    {
        accessorKey: "trim",
        header: "Trim",
        cell: ({ row }) => row.original.trim || "—",
    },
    {
        accessorKey: "yearFrom",
        header: "Año",
        size: 96,
        cell: ({ row }) => (
            <span className="tabular-nums">
        {row.original.yearFrom}
                {row.original.yearTo && ` - ${row.original.yearTo}`}
      </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.original.status;
            const colorClass =
                status === "ACTIVE"
                    ? "text-green-600 font-medium"
                    : status === "DEPRECATED"
                        ? "text-orange-600 font-medium"
                        : "text-red-600 font-medium";

            return <span className={colorClass}>{STATUS_MAP[status] || status}</span>;
        },
    },
    {
        id: "actions",
        header: "Acciones",
        size: 120,
        cell: ({ row }) => {
            const vehicle = row.original;
            const isDeprecated = vehicle.status === "DEPRECATED";

            return (
                <div className="flex gap-1">
                    {/* Ver */}
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Ver detalles"
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(vehicle);
                        }}
                    >
                        <Eye className="size-4" />
                    </Button>

                    {/* Editar — deshabilitado si está deprecado */}
                    <Button
                        size="icon"
                        variant="ghost"
                        title={isDeprecated ? "Vehículo deprecado" : "Editar"}
                        onClick={(e) => {
                            e.stopPropagation();
                            !isDeprecated && onEdit(vehicle);
                        }}
                        disabled={isDeprecated}
                    >
                        <Pencil
                            className={`size-4 ${
                                isDeprecated ? "text-muted-foreground" : ""
                            }`}
                        />
                    </Button>

                    {/* Eliminar — permitido incluso si está deprecado */}
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Eliminar"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(vehicle);
                        }}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            );
        },
    },
];

export default function LightVehiclesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewModelId, setViewModelId] = React.useState(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editVehicle, setEditVehicle] = React.useState(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmVehicle, setConfirmVehicle] = React.useState(null);
  const [deletePending, setDeletePending] = React.useState(false);

  // Cargar vehículos livianos
  const loadVehicles = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehiclesService.getAllVehicles("LIGHT");
      setVehicles(data || []);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al cargar vehículos";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Detectar si se debe abrir el drawer automáticamente después de crear/editar
  React.useEffect(() => {
    if (location.state?.openDrawer && location.state?.modelId && !isLoading) {
      // Abrir el drawer con el modelo específico
      setViewModelId(location.state.modelId);
      setViewOpen(true);

      // Limpiar el estado de navegación para evitar que se abra nuevamente
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isLoading, navigate, location.pathname]);

  const openCreate = () => {
    setCreateOpen(true);
  };

  const onView = (vehicle) => {
    setViewModelId(vehicle.modelId);
    setViewOpen(true);
  };

  const onEdit = (vehicle) => {
    setEditVehicle(vehicle);
    setEditOpen(true);
  };

  const onDelete = (vehicle) => {
    setConfirmVehicle(vehicle);
    setConfirmOpen(true);
  };

  // Handler para cuando se crea exitosamente un modelo
  const handleCreateSuccess = async (modelId) => {
    await loadVehicles();
    // Abrir el drawer con el modelo recién creado
    if (modelId) {
      setViewModelId(modelId);
      setViewOpen(true);
    }
  };

  // Handler para cuando se edita exitosamente un modelo
  const handleEditSuccess = async (modelId) => {
    await loadVehicles();
    // Abrir el drawer con el modelo editado
    if (modelId) {
      setViewModelId(modelId);
      setViewOpen(true);
    }
  };

  const submitDelete = async () => {
    if (!confirmVehicle) return;

    setDeletePending(true);
    try {
      await vehiclesService.deleteVehicle(confirmVehicle.modelId);
      setConfirmOpen(false);
      toast.success("Vehículo eliminado", {
        description: `${confirmVehicle.brand} ${confirmVehicle.family} ${confirmVehicle.trim}`,
      });
      await loadVehicles();
    } catch (e) {
      const msg = getErrorDetail(e, "Error al eliminar");
      toast.error(msg);
    } finally {
      setDeletePending(false);
    }
  };

  // Función para manejar el clic en una fila
  const handleRowClick = (row) => {
    onView(row.original);
  };

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === "ACTIVE").length;
    const deprecated = vehicles.filter(v => v.status === "DEPRECATED").length;
    
    // Contar por antigüedad (basado en yearFrom)
    const recientes = vehicles.filter(v => v.yearFrom >= 2020).length;
    const anteriores = vehicles.filter(v => v.yearFrom < 2020).length;

    return {
      total,
      active,
      deprecated,
      recientes,
      anteriores,
    };
  }, [vehicles]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Modelos de Vehículos Livianos"
        subtitle="Administra los modelos de vehículos livianos del sistema"
        icon={Car}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Nuevo modelo
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Modelos</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Activos</p>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Deprecados</p>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.deprecated}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Antigüedad</p>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium">Recientes (2020+):</span>
              <span className="text-sm font-bold text-blue-600">{stats.recientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium">Anteriores (&lt;2020):</span>
              <span className="text-sm font-bold text-amber-600">{stats.anteriores}</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Modelos de Vehículos Livianos</CardTitle>
                <Badge variant="outline" className="bg-chart-1/20 text-chart-1 hover:bg-chart-1/30">
                  Liviana
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Listado de todos los modelos livianos registrados. Haz clic en una fila para ver detalles.
              </p>
            </div>

            {/* Leyenda de estados */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-green-500" />
                {" "}
                Activo
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-orange-500" />
                {" "}
                Deprecado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                {" "}
                Inactivo
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={baseColumns(onEdit, onDelete, onView)}
            data={vehicles}
            initialPageSize={10}
            searchable={true}
            emptyMessage={isLoading ? "Cargando..." : error || "Sin datos"}
            className="[&_th]:py-2 [&_td]:py-2 [&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-muted/50"
            onRowClick={handleRowClick}
          />
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Total: {vehicles.length}
          <Separator className="mx-3 h-4" orientation="vertical" />
          <Button variant="ghost" size="sm" onClick={loadVehicles} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Refrescar
          </Button>
        </CardFooter>
      </Card>

      {/* Modal para crear modelo */}
      <CreateVehicleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        defaultMachineType="LIGHT"
      />

      {/* Modal para editar modelo */}
      <EditVehicleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        vehicle={editVehicle}
        onSuccess={handleEditSuccess}
      />

      {/* Drawer para ver detalles */}
      <ViewVehicleDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        modelId={viewModelId}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El vehículo{" "}
              <strong>
                {confirmVehicle?.brand} {confirmVehicle?.family} {confirmVehicle?.trim}
              </strong>{" "}
              será eliminado permanentemente.
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


