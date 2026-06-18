import { useState, useMemo, useCallback } from "react";
import { Eye, Pencil, Trash2, Plus, Truck, Undo2, Ban } from "lucide-react";
import { toast } from "sonner";
import { useAllDrivers, useDeleteDriver, useInactiveDrivers, useRestoreDriver } from "@/hooks/use-drivers";
import { useAllUsers } from "@/hooks/use-users";
import { getErrorDetail } from "@/services/drivers.service";
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_MAP
} from "@/types/driver-types";

// Shadcn UI components
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/shadcn/alert-dialog";
import DataTable from "@/components/ui/table/data-table";
import { PageHeading } from "@/components/ui/typography/Heading";

// Driver components
import CreateDriverDialog from "@/components/drivers/CreateDriverDialog";
import EditDriverDialog from "@/components/drivers/EditDriverDialog";
import ViewDriverDrawer from "@/components/drivers/ViewDriverDrawer";

/**
 * Página principal de gestión de conductores
 */
const DriversPage = () => {
  // ========== STATE ==========
  const [showDeleted, setShowDeleted] = useState(false);

  // ========== HOOKS ==========
  const { 
    data: drivers = [], 
    isLoading: isLoadingActive, 
    refetch: refetchActive 
  } = useAllDrivers();
  
  const { 
    data: inactiveDrivers = [], 
    isLoading: isLoadingInactive, 
    refetch: refetchInactive 
  } = useInactiveDrivers({ enabled: showDeleted });
  
  const { data: users = [] } = useAllUsers();
  const deleteDriverMutation = useDeleteDriver();
  const restoreDriverMutation = useRestoreDriver();

  // ========== ENRICHED DATA ==========
  /**
   * Enriquecer conductores con información de usuarios
   */
  const enrichDrivers = useCallback((driversList) => {
    if (!driversList.length || !users.length) return driversList;
    
    return driversList.map(driver => {
      const user = users.find(u => (u.userId || u.id) === driver.userId);
      
      return {
        ...driver,
        // Información del usuario
        firstName: user?.firstName || user?.first_name || "—",
        lastName: user?.lastName || user?.last_name || "—",
        email: user?.email || "—",
        username: user?.username || "—",
        // Información de licencias
        licenseTypes: driver.licenses?.map(l => l.licenseType).filter(Boolean).join(", ") || "—",
      };
    });
  }, [users]);

  const enrichedDrivers = useMemo(() => {
    return enrichDrivers(drivers);
  }, [drivers, enrichDrivers]);

  const enrichedInactiveDrivers = useMemo(() => {
    return enrichDrivers(inactiveDrivers);
  }, [inactiveDrivers, enrichDrivers]);

  const tableData = useMemo(() => {
    return showDeleted ? enrichedInactiveDrivers : enrichedDrivers;
  }, [showDeleted, enrichedDrivers, enrichedInactiveDrivers]);

  const currentLoading = showDeleted ? isLoadingInactive : isLoadingActive;

  // Modal states
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    driver: null,
    isDeleting: false
  });

  // Restore dialog state
  const [restoreDialog, setRestoreDialog] = useState({
    open: false,
    driver: null,
    isRestoring: false
  });

  // ========== HANDLERS ==========

  /**
   * Confirma y ejecuta eliminación lógica
   */
  const handleDeleteConfirm = async () => {
    const { driver } = deleteDialog;
    if (!driver) return;

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteDriverMutation.mutateAsync(driver.driverId);
      
      toast.success(`Conductor #${driver.driverId} eliminado lógicamente`);
      setDeleteDialog({ open: false, driver: null, isDeleting: false });
      refetchActive();
      if (showDeleted) {
        refetchInactive();
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      const message = getErrorDetail(error, "Error al eliminar conductor");
      toast.error(message);
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  /**
   * Confirma y ejecuta restauración
   */
  const handleRestoreConfirm = async () => {
    const { driver } = restoreDialog;
    if (!driver) return;

    setRestoreDialog(prev => ({ ...prev, isRestoring: true }));

    try {
      await restoreDriverMutation.mutateAsync(driver.driverId);
      
      toast.success(`Conductor #${driver.driverId} restaurado`);
      setRestoreDialog({ open: false, driver: null, isRestoring: false });
      refetchInactive();
      refetchActive();
    } catch (error) {
      console.error("Error restoring driver:", error);
      const message = getErrorDetail(error, "Error al restaurar conductor");
      toast.error(message);
      setRestoreDialog(prev => ({ ...prev, isRestoring: false }));
    }
  };

  // ========== COLUMNS ==========
  const columns = [
    {
      accessorKey: "driverId",
      header: "ID",
      size: 60,
    },
    {
      accessorKey: "firstName",
      header: "Nombre",
      size: 120,
    },
    {
      accessorKey: "lastName",
      header: "Apellido",
      size: 120,
    },
    {
      accessorKey: "availability",
      header: "Disponibilidad",
      size: 140,
      cell: ({ row }) => {
        const availability = row.original.availability || "AVAILABLE";
        const label = AVAILABILITY_MAP[availability] || availability;
        const colorClass = AVAILABILITY_COLORS[availability] || "bg-gray-500 text-white";
        
        return (
          <Badge className={colorClass}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "summary.activeLicenses",
      header: "Lic. Activas",
      size: 100,
      cell: ({ row }) => {
        const active = row.original.summary?.activeLicenses || 0;
        const total = row.original.summary?.totalLicenses || 0;
        const color = active > 0 ? "text-green-600 font-semibold" : "text-muted-foreground";
        return <span className={color}>{active}</span>;
      },
    },
    {
      accessorKey: "summary.totalLicenses",
      header: "Total Lic.",
      size: 90,
      cell: ({ row }) => row.original.summary?.totalLicenses || 0,
    },
    {
      accessorKey: "licenseTypes",
      header: "Tipos de Licencia",
      size: 180,
      cell: ({ row }) => {
        const types = row.original.licenseTypes || "—";
        return (
          <span className="text-xs" title={types}>
            {types.length > 30 ? types.substring(0, 30) + "..." : types}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Fecha Creación",
      size: 120,
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      },
    },
  ];

  // ========== ROW ACTIONS ==========
  const rowActions = (row) => {
    const driver = row.original;
    
    if (showDeleted) {
      return (
        <div className="flex gap-1 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setSelectedDriver(driver);
              setIsViewOpen(true);
            }}
            title="Ver"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setRestoreDialog({
                open: true,
                driver,
                isRestoring: false
              });
            }}
            title="Restaurar"
          >
            <Undo2 className="size-4 text-green-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setSelectedDriver(driver);
            setIsViewOpen(true);
          }}
          title="Ver"
        >
          <Eye className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setSelectedDriver(driver);
            setIsEditOpen(true);
          }}
          title="Editar"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setDeleteDialog({
              open: true,
              driver,
              isDeleting: false
            });
          }}
          title="Eliminar"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Conductores"
        subtitle="Administra los conductores y sus licencias de conducir."
        icon={Truck}
        actions={
          <div className="flex gap-2">
            <Button
              variant={showDeleted ? "outline" : "secondary"}
              size="icon"
              onClick={() => setShowDeleted((prev) => !prev)}
              title={
                showDeleted
                  ? "Ver conductores activos"
                  : "Ver conductores eliminados"
              }
            >
              {showDeleted ? <Truck className="size-4" /> : <Ban className="size-4" />}
            </Button>
            {!showDeleted && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 size-4" />
                Nuevo conductor
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-xl border bg-card">
        <div className="p-4">
          {currentLoading ? (
            <div className="text-sm text-muted-foreground">Cargando conductores…</div>
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              rowActions={rowActions}
              emptyMessage={showDeleted ? "No hay conductores eliminados" : "No hay conductores registrados"}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, driver: null, isDeleting: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción deshabilitará al conductor{" "}
              <span className="font-semibold">#{deleteDialog.driver?.driverId}</span>{" "}
              y también deshabilitará su usuario asociado. Puedes restaurarlo más tarde desde la vista de conductores eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialog.open} onOpenChange={(open) => !open && setRestoreDialog({ open: false, driver: null, isRestoring: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reactivará al conductor{" "}
              <span className="font-semibold">#{restoreDialog.driver?.driverId}</span>{" "}
              y también reactivará su usuario asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreDialog.isRestoring}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={restoreDialog.isRestoring}
              className="bg-green-600 hover:bg-green-700"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals y Drawer */}
      <CreateDriverDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={() => {
          refetchActive();
          if (showDeleted) {
            refetchInactive();
          }
        }} 
      />
      
      <EditDriverDialog 
        open={isEditOpen} 
        driver={selectedDriver} 
        onOpenChange={setIsEditOpen} 
        onSuccess={() => {
          refetchActive();
          if (showDeleted) {
            refetchInactive();
          }
        }} 
      />
      
      <ViewDriverDrawer 
        open={isViewOpen} 
        driverId={selectedDriver?.driverId} 
        onOpenChange={setIsViewOpen} 
      />
    </div>
  );
};

export default DriversPage;
