import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Route, TrendingUp, Loader2, Users } from "lucide-react";
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
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Chofer</TableHead>
                      <TableHead className="font-semibold text-center">
                        Total Viajes
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Creados
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        En Ruta
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        En Revisión
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Terminados
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => (
                      <TableRow
                        key={driver.driverId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          navigate(
                            `/dashboard/drivers/${driver.driverId}/trips`
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {driver.driverFirstName} {driver.driverLastName}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {driver.totalTrips}
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.tripsCreados}
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.tripsEnRuta}
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.tripsEnRevision}
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.tripsTerminados}
                        </TableCell>
                      </TableRow>
                    ))}
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
