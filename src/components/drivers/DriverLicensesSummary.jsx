import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/shadcn/badge";

/**
 * Componente que muestra el resumen de licencias con cards estadísticas
 */
const DriverLicensesSummary = ({ driver }) => {
  const summary = driver.summary || {};
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Resumen de Licencias
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{summary.totalLicenses || 0}</p>
        </div>
        
        <div className="rounded-lg border bg-emerald-50 p-4 space-y-1">
          <p className="text-sm text-emerald-700">Activas</p>
          <p className="text-2xl font-bold text-emerald-700">
            {summary.activeLicenses || 0}
          </p>
        </div>

        <div className="rounded-lg border bg-red-50 p-4 space-y-1">
          <p className="text-sm text-red-700">Vencidas</p>
          <p className="text-2xl font-bold text-red-700">
            {summary.expiredLicenses || 0}
          </p>
        </div>

        <div className="rounded-lg border bg-amber-50 p-4 space-y-1">
          <p className="text-sm text-amber-700">Suspendidas</p>
          <p className="text-2xl font-bold text-amber-700">
            {summary.suspendedLicenses || 0}
          </p>
        </div>
      </div>

      {summary.licenseTypes?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tipos de licencia:</p>
          <div className="flex flex-wrap gap-2">
            {summary.licenseTypes.map((type) => (
              <Badge key={type} variant="secondary" className="font-mono text-lg">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLicensesSummary;
