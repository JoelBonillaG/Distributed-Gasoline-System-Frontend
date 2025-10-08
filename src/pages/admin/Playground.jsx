import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Progress } from "@/components/ui/shadcn/progress";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/shadcn/alert";
import { Separator } from "@/components/ui/shadcn/separator";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import DataTable from "@/components/ui/table/data-table";
import { Building2, MapPin, CalendarClock, CheckCircle2 } from "lucide-react";

const DATA = [
  {
    id: 1,
    name: "Camión Volvo FH16",
    type: "Pesado",
    fuel: "Diésel",
    status: "Activo",
  },
  {
    id: 2,
    name: "Toyota Hilux",
    type: "Liviano",
    fuel: "Gasolina",
    status: "Activo",
  },
  {
    id: 3,
    name: "Freightliner Cascadia",
    type: "Pesado",
    fuel: "Diésel",
    status: "Mantenimiento",
  },
];

const COLUMNS = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Vehículo" },
  { accessorKey: "type", header: "Tipo" },
  { accessorKey: "fuel", header: "Combustible" },
  { accessorKey: "status", header: "Estado" },
];

export default function PlaygroundStatic() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Componentes UI
        </h1>
        <p className="text-sm text-muted-foreground">
          Vista general de estilos visuales para la aplicación de control de
          combustible.
        </p>
      </div>

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vehículos Registrados</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-3xl font-bold">128</span>
            <Badge className="gap-1">
              <Building2 className="size-3" /> activos
            </Badge>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Total en base de datos
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rutas Cubiertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span>48 / 50</span>
              <span>96%</span>
            </div>
            <Progress value={96} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Cobertura nacional
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última sincronización</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center text-sm text-muted-foreground">
            <CalendarClock className="size-4" /> 07/10/2025 - 14:25
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Datos de ejemplo sincronizados
          </CardFooter>
        </Card>
      </div>

      {/* Tabla de muestra */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={COLUMNS}
            data={DATA}
            initialPageSize={5}
            searchable={false}
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Vista estática
        </CardFooter>
      </Card>

      {/* Formularios y alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Formulario de muestra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="placa">Número de Placa</Label>
              <Input id="placa" placeholder="ABC-1234" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conductor">Conductor</Label>
              <Input id="conductor" placeholder="Ej. Carlos Pérez" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Guardar</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas y estados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge>Normal</Badge>
            <Badge variant="secondary">Secundario</Badge>
            <Badge variant="destructive">Crítico</Badge>
            <Badge className="gap-1">
              <CheckCircle2 className="size-3" /> Éxito
            </Badge>

            <Separator />

            <Alert>
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                La ruta fue registrada correctamente.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                El consumo excede el límite permitido.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Mapa simbólico */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de ubicaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-center text-muted-foreground">
          <MapPin className="size-4" />
          <span>Simulación visual — rutas y ubicaciones en mapa.</span>
        </CardContent>
      </Card>
    </div>
  );
}
