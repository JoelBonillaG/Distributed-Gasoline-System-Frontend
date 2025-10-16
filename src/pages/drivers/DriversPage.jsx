import { useState, useMemo } from "react";
import { Eye, Pencil, Trash2, Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAllDrivers, useDeleteDriver } from "@/hooks/use-drivers";
import { useAllUsers } from "@/hooks/use-users";
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
  // ========== HOOKS ==========
  const { data: drivers = [], isLoading, refetch } = useAllDrivers();
  const { data: users = [] } = useAllUsers();
  const deleteDriverMutation = useDeleteDriver();

  // ========== ENRICHED DATA ==========
  /**
   * Enriquecer conductores con información de usuarios
   */
  const enrichedDrivers = useMemo(() => {
    if (!drivers.length || !users.length) return drivers;
    
    return drivers.map(driver => {
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
  }, [drivers, users]);

  // ========== STATE ==========
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    driver: null,
    isDeleting: false
  });

  // ========== HANDLERS ==========

  /**
   * Confirma y ejecuta eliminación
   */
  const handleDeleteConfirm = async () => {
    const { driver } = deleteDialog;
    if (!driver) return;

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteDriverMutation.mutateAsync(driver.driverId);
      
      toast.success(`Conductor #${driver.driverId} eliminado`);
      setDeleteDialog({ open: false, driver: null, isDeleting: false });
    } catch (error) {
      console.error("Error deleting driver:", error);
      const message = error.response?.data?.message || "Error al eliminar conductor";
      toast.error(message);
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
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
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nuevo conductor
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <div className="p-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando conductores…</div>
          ) : (
            <DataTable
              columns={columns}
              data={enrichedDrivers}
              rowActions={rowActions}
              emptyMessage="No hay conductores registrados"
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
              Esta acción eliminará permanentemente al conductor{" "}
              <span className="font-semibold">#{deleteDialog.driver?.driverId}</span>.
              Esta acción no se puede deshacer.
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

      {/* Modals y Drawer */}
      <CreateDriverDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={refetch} 
      />
      
      <EditDriverDialog 
        open={isEditOpen} 
        driver={selectedDriver} 
        onOpenChange={setIsEditOpen} 
        onSuccess={refetch} 
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
