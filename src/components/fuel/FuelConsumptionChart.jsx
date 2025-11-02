import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
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
      fill="var(--foreground)"
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
      fontFamily="sans-serif"
      style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)" }}
    >
      {value.toLocaleString("es-ES", { maximumFractionDigits: 0 })} L
    </text>
  );
};

const FuelConsumptionChart = () => {
  // Función helper para obtener fecha en formato YYYY-MM-DD sin problemas de zona horaria
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const date = subDays(new Date(), 30);
    return getLocalDateString(date);
  });
  const [endDate, setEndDate] = useState(() => {
    return getLocalDateString(new Date());
  });
  const [data, setData] = useState({
    LIGHT: { tipo: "Liviana", label: "Liviana", Estimado: 0, Real: 0 },
    HEAVY: { tipo: "Pesada", label: "Pesada", Estimado: 0, Real: 0 },
    ANY: { tipo: "Cualquiera", label: "Cualquiera", Estimado: 0, Real: 0 },
  });
  const [loading, setLoading] = useState(false);

  // Colores especificados
  const ESTIMATED_COLOR = "#10b981"; // verde esmeralda - complementa con el naranja
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
      // Formato esperado: { LIGHT: { estimated, actual }, HEAVY: { estimated, actual }, ANY: { estimated, actual } }

      const processedData = {
        LIGHT: {
          tipo: "Liviana",
          label: "Liviana",
          Estimado: response.LIGHT?.estimated || 0,
          Real: response.LIGHT?.actual || 0,
        },
        HEAVY: {
          tipo: "Pesada",
          label: "Pesada",
          Estimado: response.HEAVY?.estimated || 0,
          Real: response.HEAVY?.actual || 0,
        },
        ANY: {
          tipo: "Cualquiera",
          label: "Cualquiera",
          Estimado: response.ANY?.estimated || 0,
          Real: response.ANY?.actual || 0,
        },
      };

      setData(processedData);
    } catch (error) {
      console.error("Error al obtener datos de combustible:", error);
      toast.error("Error al cargar los datos del reporte");
      // Datos vacíos en caso de error
      setData({
        LIGHT: { tipo: "Liviana", label: "Liviana", Estimado: 0, Real: 0 },
        HEAVY: { tipo: "Pesada", label: "Pesada", Estimado: 0, Real: 0 },
        ANY: {
          tipo: "Cualquiera",
          label: "Cualquiera",
          Estimado: 0,
          Real: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-semibold text-foreground font-sans">
          Consumo de Combustible: Estimado vs Real por Tipo de Maquinaria
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground font-sans mt-1">
          Analice el consumo de combustible de su flota de maquinaria.
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
                onChange={(e) => {
                  // El input type="date" devuelve siempre YYYY-MM-DD en la zona horaria local
                  // No necesita conversión, solo usamos el valor directamente
                  setStartDate(e.target.value);
                }}
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
                max={getLocalDateString(new Date())}
                onChange={(e) => {
                  // El input type="date" devuelve siempre YYYY-MM-DD en la zona horaria local
                  // No necesita conversión, solo usamos el valor directamente
                  setEndDate(e.target.value);
                }}
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

        {/* Gráficos en grid de 2 columnas */}
        {loading && (!data.LIGHT || !data.HEAVY || !data.ANY) ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Leyenda única en la esquina superior izquierda */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: ESTIMATED_COLOR }}
                />
                <span className="text-sm font-medium text-foreground">
                  Estimado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: REAL_COLOR }}
                />
                <span className="text-sm font-medium text-foreground">
                  Real
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gráfico Liviana */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground text-center">
                  Maquinaria Liviana
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[data.LIGHT]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                      label={{
                        value: "Litros",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "var(--muted-foreground)",
                          fontSize: 11,
                          fontFamily: "sans-serif",
                          fontWeight: 500,
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontFamily: "sans-serif",
                        color: "var(--card-foreground)",
                        fontWeight: 500,
                      }}
                      formatter={(value) => [
                        `${value.toLocaleString("es-ES")} L`,
                        "",
                      ]}
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
              </div>

              {/* Gráfico Pesada */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground text-center">
                  Maquinaria Pesada
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[data.HEAVY]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                      label={{
                        value: "Litros",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "var(--muted-foreground)",
                          fontSize: 11,
                          fontFamily: "sans-serif",
                          fontWeight: 500,
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontFamily: "sans-serif",
                        color: "var(--card-foreground)",
                        fontWeight: 500,
                      }}
                      formatter={(value) => [
                        `${value.toLocaleString("es-ES")} L`,
                        "",
                      ]}
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
              </div>

              {/* Gráfico Cualquiera - Ocupa ambas columnas en móvil, una columna en desktop */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground text-center">
                  Maquinaria Cualquiera
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[data.ANY]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        fill: "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                      stroke="var(--border)"
                      label={{
                        value: "Litros",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "var(--muted-foreground)",
                          fontSize: 11,
                          fontFamily: "sans-serif",
                          fontWeight: 500,
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontFamily: "sans-serif",
                        color: "var(--card-foreground)",
                        fontWeight: 500,
                      }}
                      formatter={(value) => [
                        `${value.toLocaleString("es-ES")} L`,
                        "",
                      ]}
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
              </div>
            </div>
          </div>
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
