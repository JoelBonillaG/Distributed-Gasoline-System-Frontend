import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { FileSpreadsheet, FileX } from "lucide-react";

const ReportTable = ({ reportData, filters }) => {
  if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
        <FileX className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-xl font-medium text-gray-500 dark:text-gray-400">No hay datos disponibles para mostrar</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Selecciona otros filtros o genera un nuevo reporte</p>
      </div>
    );
  }

  // Extraer los datos del reporte según su tipo
  const getTableData = () => {
    try {
      const firstReport = reportData[0];
      console.log('Procesando datos para tabla:', firstReport);
      
      // Para reportes por especialidad
      if (filters.reportType === 'specialty') {
        // Formato esperado con specialtyStatistics
        if (firstReport.specialtyStatistics) {
          return {
            headers: ['Especialidad', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: firstReport.specialtyStatistics.map(item => [
              item.specialty || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0,
              item.uniqueDoctors || 0
            ])
          };
        } 
        // Formato alternativo: si es un único objeto con propiedades directas
        else if (firstReport.specialty) {
          return {
            headers: ['Especialidad', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: [[
              firstReport.specialty || 'N/A',
              firstReport.totalConsultations || 0,
              firstReport.uniquePatients || 0,
              firstReport.uniqueDoctors || 0
            ]]
          };
        }
        // Otro formato posible: array de objetos simples
        else if (Array.isArray(reportData)) {
          return {
            headers: ['Especialidad', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: reportData.map(item => [
              item.specialty || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0,
              item.uniqueDoctors || 0
            ])
          };
        }
      }
      
      // Para reportes por médico
      if (filters.reportType === 'doctor') {
        // Formato esperado: doctorStatistics
        if (firstReport.doctorStatistics) {
          return {
            headers: ['Médico', 'Consultas Totales', 'Pacientes Únicos'],
            rows: firstReport.doctorStatistics.map(item => [
              item.doctorName || (item.doctorId != null ? `Doctor ID: ${item.doctorId}` : 'N/A'),
              item.totalConsultations || 0,
              item.uniquePatients || 0
            ])
          };
        }
        // Fallback: ranking de doctores activos
        if (firstReport.topActiveDoctors) {
          return {
            headers: ['Médico', 'Consultas Totales', 'Pacientes Únicos'],
            rows: firstReport.topActiveDoctors.map(item => [
              item.doctorName || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0
            ])
          };
        }
        // Formato alternativo: si es un objeto con datos de doctor directamente
        else if (firstReport.doctorName || firstReport.doctorId) {
          return {
            headers: ['Médico', 'Consultas Totales', 'Pacientes Únicos'],
            rows: [[
              firstReport.doctorName || `Doctor ID: ${firstReport.doctorId}` || 'N/A',
              firstReport.totalConsultations || 0,
              firstReport.uniquePatients || 0
            ]]
          };
        }
        // Otro formato: array de objetos simples de doctor
        else if (Array.isArray(reportData)) {
          return {
            headers: ['Médico', 'Consultas Totales', 'Pacientes Únicos'],
            rows: reportData.map(item => [
              item.doctorName || `Doctor ID: ${item.doctorId}` || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0
            ])
          };
        }
      }
      
      // Para centros médicos
      if (filters.reportType === 'medical-center') {
        // Formato esperado: centerStatistics
        if (firstReport.centerStatistics) {
          return {
            headers: ['Centro Médico', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: firstReport.centerStatistics.map(item => [
              item.centerName || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0,
              item.activeDoctors || item.uniqueDoctors || 0
            ])
          };
        } 
        // Fallback: nombre alternativo
        if (firstReport.medicalCenterStatistics) {
          return {
            headers: ['Centro Médico', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: firstReport.medicalCenterStatistics.map(item => [
              item.centerName || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0,
              item.activeDoctors || item.uniqueDoctors || 0
            ])
          };
        }
        // Formato alternativo: objeto con datos directamente
        else if (firstReport.centerName || firstReport.medicalCenterId) {
          return {
            headers: ['Centro Médico', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: [[
              firstReport.centerName || `Centro ID: ${firstReport.medicalCenterId}` || 'N/A',
              firstReport.totalConsultations || 0,
              firstReport.uniquePatients || 0,
              firstReport.activeDoctors || firstReport.uniqueDoctors || 0
            ]]
          };
        }
        // Otro formato: array de objetos simples
        else if (Array.isArray(reportData)) {
          return {
            headers: ['Centro Médico', 'Consultas Totales', 'Pacientes Únicos', 'Médicos Activos'],
            rows: reportData.map(item => [
              item.centerName || `Centro ID: ${item.medicalCenterId}` || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0,
              item.activeDoctors || item.uniqueDoctors || 0
            ])
          };
        }
      }
      
      // Para reportes mensuales
      if (filters.reportType === 'monthly') {
        // Formato esperado: con monthlyStatistics
        if (firstReport.monthlyStatistics) {
          return {
            headers: ['Período', 'Consultas Totales', 'Pacientes Únicos'],
            rows: firstReport.monthlyStatistics.map(item => [
              item.period || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0
            ])
          };
        }
        // Formato alternativo: objeto con datos directamente
        else if (firstReport.period) {
          return {
            headers: ['Período', 'Consultas Totales', 'Pacientes Únicos'],
            rows: [[
              firstReport.period || 'N/A',
              firstReport.totalConsultations || 0,
              firstReport.uniquePatients || 0
            ]]
          };
        }
        // Otro formato: array de períodos simple
        else if (Array.isArray(reportData)) {
          return {
            headers: ['Período', 'Consultas Totales', 'Pacientes Únicos'],
            rows: reportData.map(item => [
              item.period || 'N/A',
              item.totalConsultations || 0,
              item.uniquePatients || 0
            ])
          };
        }
      }
      
      // Si no se puede determinar el formato, intentar extraer datos genéricos
      if (Object.keys(firstReport).length > 0) {
        const headers = Object.keys(firstReport);
        const rows = [Object.values(firstReport)];
        
        return { headers, rows };
      }
      
      console.warn('No se pudo identificar un formato de datos reconocible para la tabla');
      return { headers: [], rows: [] };
    } catch (error) {
      console.error('Error al procesar datos para la tabla:', error);
      return { headers: [], rows: [] };
    }
  };
  
  const { headers, rows } = getTableData();

  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
        <FileX className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-xl font-medium text-gray-500 dark:text-gray-400">No se pudieron procesar los datos</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">El formato de los datos no es compatible</p>
      </div>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {filters.reportType === 'specialty' && 'Reporte por Especialidad'}
          {filters.reportType === 'doctor' && 'Reporte por Médico'}
          {filters.reportType === 'medical-center' && 'Reporte por Centro Médico'}
          {filters.reportType === 'monthly' && 'Reporte Mensual'}
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Datos detallados del reporte generado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border dark:border-gray-700 rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                {headers.map((header, index) => (
                  <TableHead key={index} className="dark:text-white font-medium">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="dark:border-gray-700 dark:hover:bg-gray-700/20">
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="dark:text-gray-300">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} className="h-24 text-center dark:text-gray-400">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTable;
