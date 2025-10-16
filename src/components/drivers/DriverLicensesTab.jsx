import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/shadcn/badge";
import DataTable from "@/components/ui/table/data-table";
import {
  LICENSE_STATUS_MAP,
  LICENSE_STATUS_COLORS,
  formatDate,
  getDaysUntilExpiry,
  getDaysColor
} from "@/types/driver-types";

/**
 * Componente que muestra el tab de licencias con la tabla
 */
const DriverLicensesTab = ({ driver }) => {
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

  if (!driver.licenses || driver.licenses.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Este conductor no tiene licencias registradas
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-2">
        <DataTable
          columns={licenseColumns}
          data={driver.licenses}
          emptyMessage="No hay licencias registradas"
        />
      </div>
    </div>
  );
};

export default DriverLicensesTab;
