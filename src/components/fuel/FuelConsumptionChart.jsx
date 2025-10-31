import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Button } from "@/components/ui/shadcn/button";
import { CalendarIcon, Loader2 } from "lucide-react";
import fuelService from "@/services/fuel.service";
import { toast } from "sonner";

// Componente personalizado para mostrar valores encima de las barras
const CustomLabel = ({ x, y, width, value }) => {
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="hsl(var(--foreground))"
      textAnchor="middle"
      fontSize={12}
      fontWeight={500}
      fontFamily="sans-serif"
    >
      {value.toLocaleString("es-ES", { maximumFractionDigits: 0 })} L
    </text>
  );
};

const FuelConsumptionChart = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = subDays(new Date(), 30);
    return format(date, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    return format(new Date(), "yyyy-MM-dd");
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Colores especificados
  const ESTIMATED_COLOR = "#3b82f6"; // azul
  const REAL_COLOR = "#f97316"; // naranja

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor selecciona un rango de fechas");
      return;
    }

    setLoading(true);
    try {
      const response = await fuelService.getGeneralReport(startDate, endDate);

      // Procesar datos según el formato del backend
      // Formato esperado: { LIGHT: { estimated, actual, deviation, ... }, HEAVY: { ... } }

      let processedData = [];

      if (response.LIGHT && response.HEAVY) {
        // Formato del backend: LIGHT y HEAVY
        processedData = [
          {
            tipo: "Liviana",
            Estimado: response.LIGHT.estimated || 0,
            Real: response.LIGHT.actual || 0,
          },
          {
            tipo: "Pesada",
            Estimado: response.HEAVY.estimated || 0,
            Real: response.HEAVY.actual || 0,
          },
        ];
      } else if (response.liviana && response.pesada) {
        // Formato alternativo: liviana y pesada (lowercase)
        processedData = [
          {
            tipo: "Liviana",
            Estimado:
              response.liviana.estimated || response.liviana.estimado || 0,
            Real: response.liviana.actual || response.liviana.real || 0,
          },
          {
            tipo: "Pesada",
            Estimado:
              response.pesada.estimated || response.pesada.estimado || 0,
            Real: response.pesada.actual || response.pesada.real || 0,
          },
        ];
      } else {
        // Fallback: datos vacíos
        processedData = [
          { tipo: "Liviana", Estimado: 0, Real: 0 },
          { tipo: "Pesada", Estimado: 0, Real: 0 },
        ];
      }

      setData(processedData);
    } catch (error) {
      console.error("Error al obtener datos de combustible:", error);
      toast.error("Error al cargar los datos del reporte");
      // Datos vacíos en caso de error
      setData([
        { tipo: "Liviana", Estimado: 0, Real: 0 },
        { tipo: "Pesada", Estimado: 0, Real: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, "dd/MM/yyyy", { locale: es })} - ${format(
        end,
        "dd/MM/yyyy",
        { locale: es }
      )}`;
    } catch {
      return "Período no especificado";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-semibold text-foreground font-sans">
          Consumo de Combustible: Estimado vs Real por Tipo de Maquinaria
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground font-sans mt-1">
          Período seleccionado: {formatDateRange()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Selector de fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <Label
              htmlFor="startDate"
              className="text-sm font-medium text-foreground font-sans"
            >
              Fecha Inicio
            </Label>
            <div className="relative">
              <Input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-sans"
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="endDate"
              className="text-sm font-medium text-foreground font-sans"
            >
              Fecha Fin
            </Label>
            <div className="relative">
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-sans"
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchData}
              disabled={loading}
              className="w-full font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </div>

        {/* Gráfico */}
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="tipo"
                tick={{
                  fontSize: 12,
                  fontFamily: "sans-serif",
                  fill: "hsl(var(--muted-foreground))",
                }}
                stroke="hsl(var(--border))"
                label={{
                  value: "Tipo de Maquinaria",
                  position: "insideBottom",
                  offset: -5,
                  style: {
                    textAnchor: "middle",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    fontFamily: "sans-serif",
                  },
                }}
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  fontFamily: "sans-serif",
                  fill: "hsl(var(--muted-foreground))",
                }}
                stroke="hsl(var(--border))"
                label={{
                  value: "Litros de Combustible",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    fontFamily: "sans-serif",
                  },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontFamily: "sans-serif",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(value) => [
                  `${value.toLocaleString("es-ES")} L`,
                  "",
                ]}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "sans-serif",
                  paddingTop: "10px",
                }}
                iconType="rect"
              />
              <Bar
                dataKey="Estimado"
                fill={ESTIMATED_COLOR}
                name="Estimado"
                radius={[4, 4, 0, 0]}
              >
                <LabelList content={<CustomLabel />} />
              </Bar>
              <Bar
                dataKey="Real"
                fill={REAL_COLOR}
                name="Real"
                radius={[4, 4, 0, 0]}
              >
                <LabelList content={<CustomLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground font-sans">
            No hay datos disponibles para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelConsumptionChart;
