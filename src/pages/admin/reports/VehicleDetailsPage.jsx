import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import fuelService from "@/services/fuel.service";
import { toast } from "sonner";
import { PageHeading } from "@/components/ui/typography/Heading";
import DataTable from "@/components/ui/table/data-table-pb";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/shadcn/card";

const VehicleDetailsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleTypeParam = searchParams.get("vehicleType");

  const [vehicleDetails, setVehicleDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mapeo de tipos: 1 = LIVIANO, 2 = PESADO, 3 = CUALQUIERA
  const getMachineTypeLabel = (type) => {
    switch (Number.parseInt(type, 10)) {
      case 1:
        return "Liviana";
      case 2:
        return "Pesada";
      case 3:
        return "Cualquiera";
      default:
        return "Desconocido";
    }
  };

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!vehicleTypeParam) {
        toast.error("Falta el parámetro requerido");
        navigate("/dashboard");
        return;
      }

      // Validar que vehicleType sea válido (1, 2, o 3)
      const vehicleType = Number.parseInt(vehicleTypeParam, 10);
      if (![1, 2, 3].includes(vehicleType)) {
        toast.error("Tipo de vehículo inválido");
        navigate("/dashboard");
        return;
      }

      setLoading(true);
      try {
        const response = await fuelService.getVehicleDetailReport(vehicleType);
        setVehicleDetails(response.vehicles || []);
      } catch (error) {
        console.error("Error al obtener detalles de vehículos:", error);

        // Manejar errores de validación del backend
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.vehicleTypeFilter?.[0] ||
          error.message ||
          "Error al cargar los detalles de vehículos";

        toast.error(errorMessage);

        // Si es un error de validación, regresar al dashboard
        if (error.response?.status === 400) {
          setTimeout(() => navigate("/dashboard"), 2000);
        }

        setVehicleDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [vehicleTypeParam, navigate]);

  const machineTypeLabel = getMachineTypeLabel(vehicleTypeParam);

  // Definir columnas para la tabla
  const columns = [
    {
      accessorKey: "vehicleId",
      header: "ID Vehículo",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.vehicleId}</span>
      ),
    },
    {
      accessorKey: "trips",
      header: "Viajes",
      cell: ({ row }) => row.original.trips,
    },
    {
      accessorKey: "estimated",
      header: "Estimado (L)",
      cell: ({ row }) =>
        row.original.estimated.toLocaleString("es-ES", {
          maximumFractionDigits: 2,
        }),
    },
    {
      accessorKey: "actual",
      header: "Real (L)",
      cell: ({ row }) =>
        row.original.actual.toLocaleString("es-ES", {
          maximumFractionDigits: 2,
        }),
    },
    {
      accessorKey: "difference",
      header: "Diferencia (L)",
      cell: ({ row }) => {
        const diff = row.original.difference;
        return (
          <span
            className={`font-medium ${
              diff >= 0 ? "text-destructive" : "text-green-600"
            }`}
          >
            {diff >= 0 ? "+" : ""}
            {diff.toLocaleString("es-ES", {
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "efficiency",
      header: "Eficiencia (%)",
      cell: ({ row }) =>
        `${row.original.efficiency.toLocaleString("es-ES", {
          maximumFractionDigits: 1,
        })}%`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={`Detalles de Vehículos - ${machineTypeLabel}`}
        subtitle="Consumo detallado por vehículo"
        icon={Truck}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Detalles de Vehículos - {machineTypeLabel}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Consumo detallado por vehículo. Revisa la eficiencia y diferencias
            de combustible.
          </p>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            data={vehicleDetails}
            initialPageSize={10}
            searchable={false}
            className="[&_th]:py-2 [&_td]:py-2 [&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-muted/50"
            emptyMessage={
              loading
                ? "Cargando..."
                : "No hay datos de vehículos disponibles para este tipo de maquinaria"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleDetailsPage;
