import { useState, useEffect } from "react";
import { Loader2, Truck, Info, FileText, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/shadcn/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import driversService from "@/services/drivers.service";
import { getUser } from "@/services/users.service";
import DriverInfoTab from "./DriverInfoTab";
import DriverLicensesTab from "./DriverLicensesTab";

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

      // Fetch user data (including inactive users)
      if (driverData.userId) {
        try {
          // Intentar primero con includeInactive=true para obtener usuarios inactivos
          const userData = await getUser(driverData.userId, true);
          setUser(userData);
        } catch (err) {
          console.error("Error loading user:", err);
          // Si falla, intentar sin includeInactive como fallback
          try {
            const userData = await getUser(driverData.userId, false);
            setUser(userData);
          } catch (fallbackErr) {
            console.error("Error loading user (fallback):", fallbackErr);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error("Error loading driver:", error);
      setDriver(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="max-w-4xl mx-auto h-[95vh] top-[2.5vh] fixed" 
        style={{ 
          bottom: 'auto',
          top: '2.5vh',
          height: '95vh'
        }}
      >
        <DrawerHeader className="flex flex-row items-start justify-between space-y-0 pb-4 sm:pb-6 pt-6">
          <div className="flex-1 space-y-2">
            <DrawerTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              {isLoading ? (
                "Cargando conductor..."
              ) : driver ? (
                `Conductor #${driver.driverId}`
              ) : (
                "Conductor no encontrado"
              )}
            </DrawerTitle>
            <DrawerDescription className="text-sm sm:text-base">
              {driver && `Usuario: ${user?.name || user?.username || `#${driver.userId}`}`}
            </DrawerDescription>
          </div>
          <DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Cerrar</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto flex-1 h-[calc(100%-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !driver ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se pudo cargar el conductor</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full grid grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="info" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Información</span>
                  <span className="xs:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="licenses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  Licencias ({driver.summary?.totalLicenses || 0})
                </TabsTrigger>
              </TabsList>

              {/* TAB: Información */}
              <TabsContent value="info" className="space-y-4 sm:space-y-6 mt-0 h-full overflow-y-auto">
                <DriverInfoTab driver={driver} user={user} />
              </TabsContent>

              {/* TAB: Licencias */}
              <TabsContent value="licenses" className="mt-0 h-full">
                <DriverLicensesTab driver={driver} onRefresh={loadDriverData} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ViewDriverDrawer;