import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subDays } from "date-fns";
import {
  BarChart3,
  Route,
  TrendingUp,
  Loader2,
  Users,
  Medal,
  FileText,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  Gauge,
  Fuel,
  CalendarIcon,
  FileDown,
  Truck,
  UserCircle,
} from "lucide-react";
import { PageHeading } from "@/components/ui/typography/Heading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Button } from "@/components/ui/shadcn/button";
import FuelConsumptionChart from "@/components/fuel/FuelConsumptionChart";
import fuelService from "@/services/fuel.service";
import { toast } from "sonner";
import MachineryReportViewer from "@/components/admin/reports/MachineryReportViewer";
import DriverConsumptionReportViewer from "@/components/admin/reports/DriverConsumptionReportViewer";
import RouteConsumptionReportViewer from "@/components/admin/reports/RouteConsumptionReportViewer";

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    totalTrips: 0,
    averageEfficiency: 0,
  });
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Estados para el generador de PDF
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [pdfStartDate, setPdfStartDate] = useState(() => {
    const date = subDays(new Date(), 30);
    return getLocalDateString(date);
  });
  const [pdfEndDate, setPdfEndDate] = useState(() => {
    return getLocalDateString(new Date());
  });
  const [machineryReport, setMachineryReport] = useState(null);
  const [driverReport, setDriverReport] = useState(null);
  const [routeReport, setRouteReport] = useState(null);
  const [machineryReportLoading, setMachineryReportLoading] = useState(false);
  const [driverReportLoading, setDriverReportLoading] = useState(false);
  const [routeReportLoading, setRouteReportLoading] = useState(false);

  useEffect(() => {
    fetchKPIs();
    fetchDriverRanking();
    fetchRoutesSummary();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const data = await fuelService.getKPIs();
      setKpis(data);
    } catch (error) {
      console.error("Error al obtener KPIs:", error);
      toast.error("Error al cargar los KPIs");
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverRanking = async () => {
    try {
      setDriversLoading(true);
      const data = await fuelService.getDriverRankingReport();
      setDrivers(data.drivers || []);
    } catch (error) {
      console.error("Error al obtener ranking de choferes:", error);
      toast.error("Error al cargar el ranking de choferes");
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchRoutesSummary = async () => {
    try {
      setRoutesLoading(true);
      const data = await fuelService.getRoutesSummaryReport();
      setRoutes(data.routes || []);
    } catch (error) {
      console.error("Error al obtener resumen de rutas:", error);
      toast.error("Error al cargar el resumen de rutas");
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleGenerateMachineryPDF = async () => {
    if (!pdfStartDate || !pdfEndDate) {
      toast.error("Por favor selecciona un rango de fechas");
      return;
    }

    setMachineryReportLoading(true);
    try {
      const data = await fuelService.generateMachineryTypeReport(
        pdfStartDate,
        pdfEndDate
      );
      setMachineryReport(data);
      toast.success("Reporte de maquinaria generado exitosamente");
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al generar el reporte PDF";
      toast.error(errorMessage);
    } finally {
      setMachineryReportLoading(false);
    }
  };

  const handleGenerateDriverPDF = async () => {
    if (!pdfStartDate || !pdfEndDate) {
      toast.error("Por favor selecciona un rango de fechas");
      return;
    }

    setDriverReportLoading(true);
    try {
      const data = await fuelService.generateDriverConsumptionReport(
        pdfStartDate,
        pdfEndDate
      );
      setDriverReport(data);
      toast.success("Reporte de choferes generado exitosamente");
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al generar el reporte PDF";
      toast.error(errorMessage);
    } finally {
      setDriverReportLoading(false);
    }
  };

  const handleGenerateRoutePDF = async () => {
    if (!pdfStartDate || !pdfEndDate) {
      toast.error("Por favor selecciona un rango de fechas");
      return;
    }

    setRouteReportLoading(true);
    try {
      const data = await fuelService.generateRouteConsumptionReport(
        pdfStartDate,
        pdfEndDate
      );
      setRouteReport(data);
      toast.success("Reporte de rutas generado exitosamente");
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al generar el reporte PDF";
      toast.error(errorMessage);
    } finally {
      setRouteReportLoading(false);
    }
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
      green: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
      yellow:
        "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
      purple:
        "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-2xl font-bold">Cargando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={`p-3 rounded-full ${colorClasses[color]} flex-shrink-0 ml-4`}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Dashboard"
        subtitle="Visualización de reportes y análisis de consumo"
        icon={BarChart3}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Total de Viajes"
          value={kpis.totalTrips.toLocaleString("es-ES")}
          subtitle="Viajes registrados en el sistema"
          icon={Route}
          color="blue"
        />

        <KPICard
          title="Eficiencia Promedio"
          value={`${kpis.averageEfficiency.toFixed(2)}%`}
          subtitle="Eficiencia promedio de combustible"
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Sección de Reportes PDF */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileDown className="h-6 w-6 text-primary" />
                Reportes en PDF
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Genera reportes detallados de consumo de combustible
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector de fechas compartido */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Rango de Fechas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="pdfStartDate"
                  className="text-sm font-medium text-foreground"
                >
                  Fecha Inicio
                </Label>
                <div className="relative">
                  <Input
                    id="pdfStartDate"
                    type="date"
                    value={pdfStartDate}
                    max={pdfEndDate}
                    onChange={(e) => {
                      setPdfStartDate(e.target.value);
                    }}
                    className="w-full"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="pdfEndDate"
                  className="text-sm font-medium text-foreground"
                >
                  Fecha Fin
                </Label>
                <div className="relative">
                  <Input
                    id="pdfEndDate"
                    type="date"
                    value={pdfEndDate}
                    min={pdfStartDate}
                    max={getLocalDateString(new Date())}
                    onChange={(e) => {
                      setPdfEndDate(e.target.value);
                    }}
                    className="w-full"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards de reportes individuales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reporte de Maquinaria */}
            <div className="border rounded-lg p-5 hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Tipo de Maquinaria
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consumo por tipo de vehículo
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analiza el consumo de combustible agrupado por tipo de
                  maquinaria (Liviana, Pesada, etc.)
                </p>
                <Button
                  onClick={handleGenerateMachineryPDF}
                  disabled={
                    machineryReportLoading || !pdfStartDate || !pdfEndDate
                  }
                  className="w-full"
                  variant="default"
                >
                  {machineryReportLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Reporte de Choferes */}
            <div className="border rounded-lg p-5 hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Consumo por Chofer
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Análisis por conductor
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Evalúa el rendimiento y consumo de combustible de cada chofer
                  en el período seleccionado
                </p>
                <Button
                  onClick={handleGenerateDriverPDF}
                  disabled={driverReportLoading || !pdfStartDate || !pdfEndDate}
                  className="w-full"
                  variant="default"
                >
                  {driverReportLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Reporte de Rutas */}
            <div className="border rounded-lg p-5 hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Consumo por Ruta</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Análisis por ruta
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revisa el consumo de combustible y eficiencia de cada ruta
                  configurada en el sistema
                </p>
                <Button
                  onClick={handleGenerateRoutePDF}
                  disabled={routeReportLoading || !pdfStartDate || !pdfEndDate}
                  className="w-full"
                  variant="default"
                >
                  {routeReportLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa del PDF en Modal - Maquinaria */}
      {machineryReport && (
        <MachineryReportViewer
          reportData={machineryReport}
          startDate={pdfStartDate}
          endDate={pdfEndDate}
          open={!!machineryReport}
          onOpenChange={(open) => {
            if (!open) {
              setMachineryReport(null);
            }
          }}
        />
      )}

      {/* Vista previa del PDF en Modal - Choferes */}
      {driverReport && (
        <DriverConsumptionReportViewer
          reportData={driverReport}
          startDate={pdfStartDate}
          endDate={pdfEndDate}
          open={!!driverReport}
          onOpenChange={(open) => {
            if (!open) {
              setDriverReport(null);
            }
          }}
        />
      )}

      {/* Vista previa del PDF en Modal - Rutas */}
      {routeReport && (
        <RouteConsumptionReportViewer
          reportData={routeReport}
          startDate={pdfStartDate}
          endDate={pdfEndDate}
          open={!!routeReport}
          onOpenChange={(open) => {
            if (!open) {
              setRouteReport(null);
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Gráfico de consumo de combustible */}
        <FuelConsumptionChart />

        {/* Tabla de ranking de choferes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ranking de Choferes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Cargando datos...
                </span>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de choferes disponibles
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b">
                      <TableHead className="font-semibold w-12">#</TableHead>
                      <TableHead className="font-semibold">Chofer</TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Route className="h-4 w-4 text-primary" />
                          Total
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <FileText className="h-4 w-4 text-gray-500" />
                          Creados
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          En Ruta
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          En Revisión
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Terminados
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver, index) => {
                      const getRankIcon = (index) => {
                        if (index === 0) {
                          return <Medal className="h-4 w-4 text-yellow-500" />;
                        } else if (index === 1) {
                          return <Medal className="h-4 w-4 text-gray-400" />;
                        } else if (index === 2) {
                          return <Medal className="h-4 w-4 text-orange-400" />;
                        }
                        return null;
                      };

                      return (
                        <TableRow
                          key={driver.driverId}
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all border-b group"
                          onClick={() =>
                            navigate(
                              `/dashboard/drivers/${driver.driverId}/trips`
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRankIcon(index)}
                              <span className="text-muted-foreground text-sm font-semibold">
                                {index + 1}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-base">
                              {driver.driverFirstName} {driver.driverLastName}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="default"
                              className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1"
                            >
                              {driver.totalTrips}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {driver.tripsCreados > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-gray-50 text-gray-700 border-gray-300 font-medium"
                              >
                                {driver.tripsCreados}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {driver.tripsCreados}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {driver.tripsEnRuta > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-300 font-medium"
                              >
                                {driver.tripsEnRuta}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {driver.tripsEnRuta}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {driver.tripsEnRevision > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-300 font-medium"
                              >
                                {driver.tripsEnRevision}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {driver.tripsEnRevision}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {driver.tripsTerminados > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-300 font-medium"
                              >
                                {driver.tripsTerminados}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {driver.tripsTerminados}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de resumen de rutas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Resumen de Rutas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Cargando datos...
                </span>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de rutas disponibles
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b">
                      <TableHead className="font-semibold">Ruta</TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Route className="h-4 w-4 text-primary" />
                          Viajes
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Fuel className="h-4 w-4 text-blue-500" />
                          Estimado (L)
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Fuel className="h-4 w-4 text-green-500" />
                          Real (L)
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          Diferencia (L)
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Gauge className="h-4 w-4 text-orange-500" />
                          Eficiencia (%)
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => {
                      const hasActualFuel = route.actual > 0;

                      return (
                        <TableRow
                          key={route.routeId}
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all border-b group"
                          onClick={() =>
                            navigate(`/dashboard/routes/${route.routeId}/trips`)
                          }
                        >
                          <TableCell>
                            <div className="font-semibold text-base">
                              {route.routeName}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="default"
                              className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1"
                            >
                              {route.totalTrips}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-blue-700">
                              {route.estimated.toLocaleString("es-ES", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasActualFuel ? (
                              <span className="text-sm font-medium text-green-700">
                                {route.actual.toLocaleString("es-ES", {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasActualFuel ? (
                              <span
                                className={`text-sm font-medium ${
                                  route.difference >= 0
                                    ? "text-destructive"
                                    : "text-green-600"
                                }`}
                              >
                                {route.difference >= 0 ? "+" : ""}
                                {route.difference.toLocaleString("es-ES", {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasActualFuel ? (
                              <Badge
                                variant="outline"
                                className={`font-medium ${
                                  route.efficiency >= 95
                                    ? "bg-green-50 text-green-700 border-green-300"
                                    : route.efficiency >= 85
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                    : "bg-red-50 text-red-700 border-red-300"
                                }`}
                              >
                                {route.efficiency.toLocaleString("es-ES", {
                                  maximumFractionDigits: 2,
                                })}
                                %
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
