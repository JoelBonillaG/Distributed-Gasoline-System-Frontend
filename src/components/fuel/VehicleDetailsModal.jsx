import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { Loader2 } from "lucide-react";

const VehicleDetailsModal = ({
  isOpen,
  onClose,
  machineType,
  vehicleDetails,
  loadingDetails,
  dateRange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-semibold">
            Detalles de Vehículos - {machineType}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Consumo detallado por vehículo del período: {dateRange}
          </DialogDescription>
        </DialogHeader>

        {loadingDetails ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vehicleDetails.length > 0 ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="rounded-lg border overflow-hidden flex-1 flex flex-col">
              <div className="overflow-y-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="font-semibold py-4 px-4">
                        ID Vehículo
                      </TableHead>
                      <TableHead className="font-semibold py-4 px-4">
                        Viajes
                      </TableHead>
                      <TableHead className="font-semibold py-4 px-4">
                        Estimado (L)
                      </TableHead>
                      <TableHead className="font-semibold py-4 px-4">
                        Real (L)
                      </TableHead>
                      <TableHead className="font-semibold py-4 px-4">
                        Diferencia (L)
                      </TableHead>
                      <TableHead className="font-semibold py-4 px-4">
                        Eficiencia (%)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleDetails.map((vehicle) => (
                      <TableRow
                        key={vehicle.vehicleId}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium py-4 px-4">
                          {vehicle.vehicleId}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          {vehicle.trips}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          {vehicle.estimated.toLocaleString("es-ES", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          {vehicle.actual.toLocaleString("es-ES", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className={`py-4 px-4 font-medium ${
                            vehicle.difference >= 0
                              ? "text-destructive"
                              : "text-green-600"
                          }`}
                        >
                          {vehicle.difference >= 0 ? "+" : ""}
                          {vehicle.difference.toLocaleString("es-ES", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          {vehicle.efficiency.toLocaleString("es-ES", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de vehículos disponibles para este tipo de maquinaria
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailsModal;

