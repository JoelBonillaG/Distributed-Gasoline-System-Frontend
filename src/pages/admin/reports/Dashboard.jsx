import { BarChart3 } from "lucide-react";
import { PageHeading } from "@/components/ui/typography/Heading";
import FuelConsumptionChart from "@/components/fuel/FuelConsumptionChart";

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Dashboard"
        subtitle="Visualización de reportes y análisis de consumo"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de consumo de combustible */}
        <FuelConsumptionChart />

        {/* Espacio para futuras métricas */}
        <div className="rounded-xl border bg-card p-6 flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-center">
            Espacio disponible para más métricas
          </p>
        </div>
      </div>
    </div>
  );
}
