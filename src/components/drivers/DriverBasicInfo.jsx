import { Truck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  AVAILABILITY_MAP,
  AVAILABILITY_COLORS,
  formatDate,
} from "@/types/driver-types";

/**
 * Componente que muestra la información básica de un conductor
 */
const DriverBasicInfo = ({ driver }) => {
  return (
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
  );
};

export default DriverBasicInfo;
