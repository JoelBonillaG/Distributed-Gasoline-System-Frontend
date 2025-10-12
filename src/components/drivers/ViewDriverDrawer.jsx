import { useState, useEffect } from "react";
import { Loader2, Truck, Info, FileText, Calendar, User, Shield } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/shadcn/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";
import DataTable from "@/components/ui/table/data-table";
import driversService from "@/services/drivers.service";
import { getUser } from "@/services/users.service";
import {
  AVAILABILITY_MAP,
  AVAILABILITY_COLORS,
  LICENSE_STATUS_MAP,
  LICENSE_STATUS_COLORS,
  formatDate,
  getDaysUntilExpiry,
  getDaysColor
} from "@/types/driver-types";

/**
 * Drawer para ver detalles completos de un conductor
 * @param {Object} props
 * @param {boolean} props.open - Si el drawer está abierto
 * @param {number|null} props.driverId - ID del conductor a mostrar
 * @param {(open: boolean) => void} props.onOpenChange - Callback para cambiar estado
 */
const ViewDriverDrawer = ({ open, driverId, onOpenChange }) => {
  const [driver, setDriver] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (open && driverId) {
      loadDriverData();
    } else {
      // Reset cuando se cierra
      setDriver(null);
      setUser(null);
      setActiveTab("info");
    }
  }, [open, driverId]);

  const loadDriverData = async () => {
    setIsLoading(true);
    try {
      // Fetch driver con licenses incluidas
      const driverData = await driversService.getDriverById(driverId);
      setDriver(driverData);

      // Fetch user data
      if (driverData.userId) {
        try {
          const userData = await getUser(driverData.userId);
          setUser(userData);
        } catch (err) {
          console.error("Error loading user:", err);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error loading driver:", error);
      setDriver(null);
    } finally {
      setIsLoading(false);
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-4xl mx-auto max-h-[50vh]" style={{ bottom: '13rem' }}>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {isLoading ? (
              "Cargando conductor..."
            ) : driver ? (
              `Conductor #${driver.driverId}`
            ) : (
              "Conductor no encontrado"
            )}
          </DrawerTitle>
          <DrawerDescription>
            {driver && `Usuario: ${user?.name || user?.username || `#${driver.userId}`}`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !driver ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se pudo cargar el conductor</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">
                  <Info className="mr-2 h-4 w-4" />
                  Información
                </TabsTrigger>
                <TabsTrigger value="licenses" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Licencias ({driver.summary?.totalLicenses || 0})
                </TabsTrigger>
              </TabsList>

              {/* TAB: Información */}
              <TabsContent value="info" className="space-y-1 mt-4">
                {/* Datos del Conductor */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Datos del Conductor
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">ID Conductor</p>
                      <p className="font-mono font-semibold">#{driver.driverId}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Disponibilidad</p>
                      <Badge className={AVAILABILITY_COLORS[driver.availability]}>
                        {AVAILABILITY_MAP[driver.availability]}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Registrado</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(driver.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Última actualización</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(driver.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Datos del Usuario */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuario Asociado
                  </h3>
                  
                  {user ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">ID Usuario</p>
                        <p className="font-mono">#{user.userId || user.id}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p>{user.name || user.username || "-"}</p>
                      </div>

                      {user.email && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p>{user.email}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Usuario #{driver.userId}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Resumen de Licencias */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Resumen de Licencias
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border bg-card p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{driver.summary?.totalLicenses || 0}</p>
                    </div>
                    
                    <div className="rounded-lg border bg-emerald-50 p-4 space-y-1">
                      <p className="text-sm text-emerald-700">Activas</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {driver.summary?.activeLicenses || 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-red-50 p-4 space-y-1">
                      <p className="text-sm text-red-700">Vencidas</p>
                      <p className="text-2xl font-bold text-red-700">
                        {driver.summary?.expiredLicenses || 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-amber-50 p-4 space-y-1">
                      <p className="text-sm text-amber-700">Suspendidas</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {driver.summary?.suspendedLicenses || 0}
                      </p>
                    </div>
                  </div>

                  {driver.summary?.licenseTypes?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tipos de licencia:</p>
                      <div className="flex flex-wrap gap-2">
                        {driver.summary.licenseTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="font-mono text-lg">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Licencias */}
              <TabsContent value="licenses" className="mt-6">
                {driver.licenses && driver.licenses.length > 0 ? (
                  <div className="rounded-xl border bg-card">
                    <div className="p-2">
                      <DataTable
                        columns={licenseColumns}
                        data={driver.licenses}
                        emptyMessage="No hay licencias registradas"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/30">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Este conductor no tiene licencias registradas
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ViewDriverDrawer;
