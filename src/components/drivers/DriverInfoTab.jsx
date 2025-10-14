import { Separator } from "@/components/ui/shadcn/separator";
import DriverBasicInfo from "./DriverBasicInfo";
import DriverUserInfo from "./DriverUserInfo";
import DriverLicensesSummary from "./DriverLicensesSummary";

/**
 * Componente que agrupa toda la información del tab "Información"
 */
const DriverInfoTab = ({ driver, user }) => {
  return (
    <div className="space-y-4">
      {/* Datos del Conductor */}
      <DriverBasicInfo driver={driver} />
      
      <Separator />

      {/* Datos del Usuario */}
      <DriverUserInfo driver={driver} user={user} />
      
      <Separator />

      {/* Resumen de Licencias */}
      <DriverLicensesSummary driver={driver} />
    </div>
  );
};

export default DriverInfoTab;
