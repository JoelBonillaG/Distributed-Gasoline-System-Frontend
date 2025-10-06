import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Activity, Users, Stethoscope } from "lucide-react";

const ReportHeader = ({ reportData }) => {
  const getHeaderStats = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return {
        totalConsultations: 0,
        totalSpecialties: 0,
        totalDoctors: 0
      };
    }

    const firstReport = reportData[0];
    let totalConsultations = 0;
    let totalSpecialties = 0;
    let totalDoctors = 0;

    // Calcular estadísticas según el tipo de datos disponibles
    if (firstReport.specialtyStatistics) {
      totalConsultations = firstReport.specialtyStatistics.reduce((sum, item) => sum + (item.totalConsultations || 0), 0);
      totalSpecialties = firstReport.specialtyStatistics.length;
      totalDoctors = firstReport.specialtyStatistics.reduce((sum, item) => sum + (item.uniqueDoctors || 0), 0);
    } else if (firstReport.doctorStatistics) {
      totalConsultations = firstReport.doctorStatistics.reduce((sum, item) => sum + (item.totalConsultations || 0), 0);
      totalDoctors = firstReport.doctorStatistics.length;
      const uniqueSpecialties = new Set(firstReport.doctorStatistics.map(item => item.specialty).filter(Boolean));
      totalSpecialties = uniqueSpecialties.size;
    } else if (firstReport.centerStatistics) {
      totalConsultations = firstReport.centerStatistics.reduce((sum, item) => sum + (item.totalConsultations || 0), 0);
      totalSpecialties = firstReport.kpis?.distinctSpecialties || 0;
      totalDoctors = firstReport.centerStatistics.reduce((sum, item) => sum + (item.uniqueDoctors || item.activeDoctors || 0), 0);
    } else if (firstReport.topActiveDoctors) {
      totalConsultations = firstReport.topActiveDoctors.reduce((sum, item) => sum + (item.totalConsultations || 0), 0);
      totalDoctors = firstReport.topActiveDoctors.length;
      // Contar especialidades únicas
      const uniqueSpecialties = new Set(firstReport.topActiveDoctors.map(item => item.specialty).filter(Boolean));
      totalSpecialties = uniqueSpecialties.size;
    } else if (firstReport.kpis) {
      totalConsultations = firstReport.kpis.totalConsultations || firstReport.executiveSummary?.totalConsultations || 0;
      totalSpecialties = firstReport.kpis.distinctSpecialties || firstReport.kpis.totalSpecialties || 0;
      totalDoctors = firstReport.kpis.doctorsInvolved || firstReport.kpis.totalDoctors || 0;
    }

    return {
      totalConsultations,
      totalSpecialties,
      totalDoctors
    };
  };

  const stats = getHeaderStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium dark:text-white">
            Total Consultas
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {stats.totalConsultations.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            Consultas registradas
          </p>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium dark:text-white">
            Especialidades
          </CardTitle>
          <Stethoscope className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {stats.totalSpecialties.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            Especialidades activas
          </p>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium dark:text-white">
            Médicos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {stats.totalDoctors.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            Médicos activos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportHeader;