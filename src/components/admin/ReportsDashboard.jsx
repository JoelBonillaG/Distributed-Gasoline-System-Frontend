// ReportsDashboard.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { BarChart3, Table } from "lucide-react";
import reportsService from "../../services/reports.service";
import { toast } from "sonner";

import ReportHeader from "./reports/ReportHeader";
import ReportCharts from "./reports/ReportCharts";
import ReportTable from "./reports/ReportTable";

const ReportsDashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("charts");

  // No interactive filters UI: the page performs a single automatic specialty report on mount.
  const [filters] = useState({ reportType: "specialty" });

  // Helper: sleep
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Helper: timeout wrapper for a promise
  const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
    return Promise.race([promise, timeout]);
  };

  // Auto-fetch the specialty report on mount with retry/backoff (max 5 attempts)
  useEffect(() => {
    let cancelled = false;

    const fetchStaticReport = async () => {
      setIsLoading(true);
      setError(null);

      const payload = {
        fechaInicio: null,
        fechaFin: null,
        centrosMedicos: [],
        especialidades: [1],
        medicos: [],
        estado: null,
        ordenarPor: null,
        direccionOrden: null,
        pagina: 0,
        tamanio: 50,
      };

      const maxAttempts = 5;
      const baseTimeoutMs = 20000; // 20s base timeout

      for (let attempt = 1; attempt <= maxAttempts && !cancelled; attempt++) {
        try {
          console.log(`Fetching static specialty report attempt ${attempt}...`);
          const timeoutForAttempt = baseTimeoutMs * attempt; // increase per attempt
          const response = await withTimeout(reportsService.getConsultationsBySpecialty(payload), timeoutForAttempt);

          if (cancelled) return;

          const processedData = Array.isArray(response) ? response : [response];

          if (!processedData.length) {
            toast.info("No se encontraron datos para el reporte estático");
            setReportData([]);
          } else {
            toast.success("Reporte cargado correctamente");
            setReportData(processedData);
            setActiveTab("charts");
          }

          setIsLoading(false);
          return; // success
        } catch (err) {
          console.warn(`Static report attempt ${attempt} failed:`, err.message || err);
          if (attempt < maxAttempts && !cancelled) {
            const backoff = 2000 * attempt; // 2s, 4s, 6s...
            console.log(`Waiting ${backoff}ms before retrying...`);
            await sleep(backoff);
            continue;
          }

          if (!cancelled) {
            setError(err.message || "Error al cargar reporte estático");
            toast.error(err.message || "Error al cargar reporte estático");
            setReportData(null);
            setIsLoading(false);
          }
          return;
        }
      }
    };

    fetchStaticReport();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">
            Dashboard de Reportes
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Genere y visualice reportes de consultas médicas
          </p>
        </div>
      </div>

      <ReportHeader reportData={reportData} />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200 font-medium">
            Error al generar el reporte
          </div>
          <div className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</div>
        </div>
      )}

      {reportData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Gráficos
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" /> Tablas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <ReportCharts reportData={reportData} filters={filters} />
          </TabsContent>
          <TabsContent value="table" className="space-y-6">
            <ReportTable reportData={reportData} filters={filters} />
          </TabsContent>
        </Tabs>
      )}

      {(!reportData || !reportData.length) && !isLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow">
          <div className="text-gray-500 dark:text-gray-400">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay datos para mostrar</p>
            <p className="text-sm">
              {reportData && reportData.length === 0
                ? "No se encontraron resultados para los filtros aplicados."
                : "Configure los filtros y genere un reporte para ver los resultados."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
