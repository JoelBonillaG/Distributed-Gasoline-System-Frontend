import { useState } from "react";
import { Shield, Plus, Ban, RotateCcw, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
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
import driversService from "@/services/drivers.service";
import CreateLicenseDialog from "./CreateLicenseDialog";
import EditLicenseDialog from "./EditLicenseDialog";
import {
  LICENSE_STATUS_MAP,
  LICENSE_STATUS_COLORS,
  formatDate,
  getDaysUntilExpiry,
  getDaysColor
} from "@/types/driver-types";

/**
 * Componente que muestra el tab de licencias con la tabla y acciones CRUD
 */
const DriverLicensesTab = ({ driver, onRefresh }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({
    open: false,
    license: null,
  });
  const [suspendDialog, setSuspendDialog] = useState({
    open: false,
    license: null,
    isSuspending: false,
  });

  const [reactivateDialog, setReactivateDialog] = useState({
    open: false,
    license: null,
    isReactivating: false,
  });
  const handleSuspend = async () => {
    const { license } = suspendDialog;
    if (!license) return;

    setSuspendDialog((prev) => ({ ...prev, isSuspending: true }));

    try {
      await driversService.suspendLicense(driver.driverId, license.driverLicenseId);
      toast.success("Licencia suspendida exitosamente");
      setSuspendDialog({ open: false, license: null, isSuspending: false });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error suspending license:", error);
      const message =
        error.response?.data?.message || "Error al suspender la licencia";
      toast.error(message);
      setSuspendDialog((prev) => ({ ...prev, isSuspending: false }));
    }
  };

  const handleReactivate = async () => {
    const { license } = reactivateDialog;
    if (!license) return;

    setReactivateDialog((prev) => ({ ...prev, isReactivating: true }));

    try {
      await driversService.reactivateLicense(driver.driverId, license.driverLicenseId);
      toast.success("Licencia reactivada exitosamente");
      setReactivateDialog({ open: false, license: null, isReactivating: false });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error reactivating license:", error);
      const message =
        error.response?.data?.message || "Error al reactivar la licencia";
      toast.error(message);
      setReactivateDialog((prev) => ({ ...prev, isReactivating: false }));
    }
  };

  // Columnas para tabla de licencias
  const licenseColumns = [
    {
      accessorKey: "driverLicenseId",
      header: "#",
      size: 60,
    },
    {
      accessorKey: "licenseTypeCode",
      header: "Tipo",
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-lg">
          {row.original.licenseTypeCode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "number",
      header: "Número",
      cell: ({ row }) => (
        <span className="font-mono">{row.original.number}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={LICENSE_STATUS_COLORS[status]}>
            {LICENSE_STATUS_MAP[status] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "issuedAt",
      header: "Emisión",
      cell: ({ row }) => formatDate(row.original.issuedAt),
    },
    {
      accessorKey: "expiresAt",
      header: "Vencimiento",
      cell: ({ row }) => {
        const expiresAt = row.original.expiresAt;
        const days = getDaysUntilExpiry(expiresAt);
        const colorClass = getDaysColor(days);
        
        return (
          <div>
            <div>{formatDate(expiresAt)}</div>
            <div className={`text-xs ${colorClass}`}>
              {days < 0 
                ? `Vencida hace ${Math.abs(days)} días`
                : days === 0
                ? "Vence hoy"
                : `${days} días`
              }
            </div>
          </div>
        );
      },
    },
  ];

  // Acciones de fila
  const rowActions = (row) => {
    const license = row.original;
    const canSuspend = license.status === "VALID";
    const canReactivate = license.status === "SUSPENDED";

    return (
      <div className="flex gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setEditDialog({
              open: true,
              license,
            });
          }}
          title="Editar licencia"
        >
          <Edit className="size-4" />
        </Button>
        {canSuspend && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setSuspendDialog({
                open: true,
                license,
                isSuspending: false,
              });
            }}
            title="Suspender licencia"
          >
            <Ban className="size-4 text-orange-600" />
          </Button>
        )}
        {canReactivate && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setReactivateDialog({
                open: true,
                license,
                isReactivating: false,
              });
            }}
            title="Reactivar licencia"
          >
            <RotateCcw className="size-4 text-green-600" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Botón para crear nueva licencia */}
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Licencia
        </Button>
      </div>

      {/* Tabla de licencias */}
      {!driver.licenses || driver.licenses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Este conductor no tiene licencias registradas
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Primera Licencia
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="p-2">
            <DataTable
              columns={licenseColumns}
              data={driver.licenses}
              rowActions={rowActions}
              emptyMessage="No hay licencias registradas"
            />
          </div>
        </div>
      )}

      {/* Dialog para crear licencia */}
      <CreateLicenseDialog
        open={isCreateOpen}
        driverId={driver.driverId}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />

      {/* Dialog para suspender licencia */}
      <AlertDialog
        open={suspendDialog.open}
        onOpenChange={(open) =>
          !open &&
          setSuspendDialog({ open: false, license: null, isSuspending: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Suspender licencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción suspenderá la licencia{" "}
              <span className="font-semibold">
                {suspendDialog.license?.number}
              </span>{" "}
              del conductor. La licencia quedará marcada como suspendida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendDialog.isSuspending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={suspendDialog.isSuspending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {suspendDialog.isSuspending ? "Suspendiendo..." : "Suspender"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para reactivar licencia */}
      <AlertDialog
        open={reactivateDialog.open}
        onOpenChange={(open) =>
          !open &&
          setReactivateDialog({ open: false, license: null, isReactivating: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar licencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reactivará la licencia{" "}
              <span className="font-semibold">
                {reactivateDialog.license?.number}
              </span>{" "}
              del conductor. La licencia volverá a estar vigente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivateDialog.isReactivating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={reactivateDialog.isReactivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivateDialog.isReactivating ? "Reactivando..." : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para editar licencia */}
      <EditLicenseDialog
        open={editDialog.open}
        driverId={driver.driverId}
        license={editDialog.license}
        onOpenChange={(open) =>
          setEditDialog({ open, license: null })
        }
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
};

export default DriverLicensesTab;
