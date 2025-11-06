import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import FuelConsumptionChart from "@/components/fuel/FuelConsumptionChart";
import fuelService from "@/services/fuel.service";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    totalTrips: 0,
    averageEfficiency: 0,
  });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
    fetchDriverRanking();
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
      </div>
    </div>
  );
}
