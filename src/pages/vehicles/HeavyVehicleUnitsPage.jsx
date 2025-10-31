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
import { Plus, Pencil, Trash2, Loader2, Gauge, Eye, FileText, CheckCircle, Navigation, Activity } from "lucide-react";
import vehiclesService from "@/services/vehicles.service";
import CreateUnitDialog from "@/components/vehicles/CreateUnitDialog";
import EditUnitDialog from "@/components/vehicles/EditUnitDialog";
import ViewUnitDrawer from "@/components/vehicles/ViewUnitDrawer";

// Mapeo de estado operacional
const STATUS_MAP = {
  ACTIVE: "Activo",
  MAINTENANCE: "Mantenimiento",
  INACTIVE: "Inactivo",
  RETIRED: "Retirado",
  ON_ROUTE: "En Ruta",
};

// Función para obtener el color del texto según el estado
const getStatusColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 font-medium";
    case "ON_ROUTE":
      return "text-blue-600 font-medium";
    case "MAINTENANCE":
      return "text-yellow-600 font-medium";
    case "INACTIVE":
      return "text-gray-600 font-medium";
    case "RETIRED":
      return "text-red-600 font-medium";
    default:
      return "text-gray-600 font-medium";
  }
};

// Columnas de la tabla
const baseColumns = (onEdit, onDelete, onView, models) => [
  {
    accessorKey: "vehicleId",
    header: "ID",
    size: 72,
    cell: ({ row }) => <span className="tabular-nums">{row.original.vehicleId}</span>,
  },
  {
    accessorKey: "plate",
    header: "Placa",
    cell: ({ row }) => (
      <div className="font-semibold text-primary">{row.original.plate}</div>
    ),
  },
  {
    accessorKey: "modelId",
    header: "Modelo",
    cell: ({ row }) => {
      const model = models.find(m => m.modelId === row.original.modelId);
      if (model) {
        return (
          <div className="text-sm">
            <div className="font-medium">{model.brand} {model.family}</div>
            {model.trim && <div className="text-muted-foreground text-xs">{model.trim}</div>}
          </div>
        );
      }
      return <span className="text-muted-foreground">Modelo #{row.original.modelId}</span>;
    },
  },
  {
    accessorKey: "odometerKm",
    header: "Odómetro",
    size: 120,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.odometerKm.toLocaleString()} km</span>
    ),
  },
  {
    accessorKey: "consumption",
    header: "Consumo",
    size: 120,
    cell: ({ row }) => {
      const consumption = row.original.consumption;
      if (!consumption) return <span className="text-muted-foreground">—</span>;

      const effective = consumption.effectiveLPer100km;
      const baseline = consumption.baselineOverrideLPer100km || consumption.baselineModelLPer100km;

      return (
        <div className="text-sm">
          <div className="tabular-nums font-medium">
            {effective?.toFixed(2)} L/100km
          </div>
          {baseline && (
            <div className="text-xs text-muted-foreground">
              Base: {baseline.toFixed(2)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "operationalStatus",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.operationalStatus;
      return (
        <span className={getStatusColor(status)}>
          {STATUS_MAP[status] || status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    size: 120,
    cell: ({ row }) => {
      const unit = row.original;
      const disabled = unit.operationalStatus === "RETIRED";

      return (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Ver detalles"
            onClick={(e) => {
              e.stopPropagation();
              onView(unit);
            }}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={disabled ? "Unidad retirada" : "Editar"}
            onClick={(e) => {
              e.stopPropagation();
              !disabled && onEdit(unit);
            }}
            disabled={disabled}
          >
            <Pencil className={`size-4 ${disabled ? "text-muted-foreground" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={disabled ? "Unidad retirada" : "Eliminar"}
            onClick={(e) => {
              e.stopPropagation();
              !disabled && onDelete(unit);
            }}
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

export default function HeavyVehicleUnitsPage() {
  const [units, setUnits] = React.useState([]);
  const [models, setModels] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editUnit, setEditUnit] = React.useState(null);

  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewUnitId, setViewUnitId] = React.useState(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmUnit, setConfirmUnit] = React.useState(null);
  const [deletePending, setDeletePending] = React.useState(false);

  // Cargar unidades y modelos pesados
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [unitsData, modelsData] = await Promise.all([
        vehiclesService.getAllUnits("HEAVY"),
        vehiclesService.getAllVehicles("HEAVY"),
      ]);
      setUnits(unitsData || []);
      setModels(modelsData || []);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al cargar datos";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleView = (unit) => {
    setViewUnitId(unit.vehicleId);
    setViewOpen(true);
  };

  const handleEdit = (unit) => {
    setEditUnit(unit);
    setEditOpen(true);
  };

  const handleDelete = (unit) => {
    setConfirmUnit(unit);
    setConfirmOpen(true);
  };

  // Handler para cuando se crea exitosamente una unidad
  const handleCreateSuccess = async (vehicleId) => {
    await loadData();
    // Abrir el drawer con la unidad recién creada
    if (vehicleId) {
      setViewUnitId(vehicleId);
      setViewOpen(true);
    }
  };

  // Handler para cuando se edita exitosamente una unidad
  const handleEditSuccess = async (vehicleId) => {
    await loadData();
    // Abrir el drawer con la unidad editada
    if (vehicleId) {
      setViewUnitId(vehicleId);
      setViewOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!confirmUnit) return;

    setDeletePending(true);
    try {
      await vehiclesService.deleteUnit(confirmUnit.vehicleId);
      toast.success("Unidad eliminada exitosamente");
      setConfirmOpen(false);
      loadData();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Error al eliminar unidad";
      toast.error(msg);
    } finally {
      setDeletePending(false);
    }
  };

  const columns = React.useMemo(
    () => baseColumns(handleEdit, handleDelete, handleView, models),
    [models]
  );

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const total = units.length;
    const active = units.filter(u => u.operationalStatus === "ACTIVE").length;
    const onRoute = units.filter(u => u.operationalStatus === "ON_ROUTE").length;
    const maintenance = units.filter(u => u.operationalStatus === "MAINTENANCE").length;
    
    // Calcular consumo promedio
    const unitsWithConsumption = units.filter(u => u.consumption?.effectiveLPer100km);
    const avgConsumption = unitsWithConsumption.length > 0
      ? unitsWithConsumption.reduce((sum, u) => sum + u.consumption.effectiveLPer100km, 0) / unitsWithConsumption.length
      : 0;

    return {
      total,
      active,
      maintenance,
      onRoute,
      avgConsumption: avgConsumption.toFixed(2),
    };
  }, [units]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Unidades de Vehículos Pesados"
        subtitle="Administra las unidades individuales de vehículos pesados del sistema"
        icon={Gauge}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nueva Unidad
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Unidades</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Activas</p>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">En Ruta</p>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.onRoute}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Consumo Promedio</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {stats.avgConsumption} <span className="text-sm text-muted-foreground">L/100km</span>
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Unidades de Vehículos Pesados</CardTitle>
                <Badge variant="outline" className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30">
                  Pesada
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Listado de todas las unidades pesadas registradas en el sistema.
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
                <span className="size-2 rounded-full bg-blue-500" />
                {" "}
                En Ruta
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-yellow-500" />
                {" "}
                Mantenimiento
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-gray-500" />
                {" "}
                Inactivo
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                {" "}
                Retirado
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            data={units}
            initialPageSize={10}
            searchable={true}
            emptyMessage={isLoading ? "Cargando..." : error || "Sin datos"}
            className="[&_th]:py-2 [&_td]:py-2"
          />
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Total: {units.length}
          <Separator className="mx-3 h-4" orientation="vertical" />
          <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Refrescar
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de creación */}
      <CreateUnitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        defaultMachineType="HEAVY"
      />

      {/* Modal de edición */}
      {editUnit && (
        <EditUnitDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          unit={editUnit}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Drawer de visualización */}
      <ViewUnitDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        vehicleId={viewUnitId}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La unidad{" "}
              <strong>{confirmUnit?.plate}</strong> será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletePending}>
              {deletePending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

