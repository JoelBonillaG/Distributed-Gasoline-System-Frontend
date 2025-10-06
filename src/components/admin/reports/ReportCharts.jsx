import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shadcn/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportCharts = ({ reportData, filters }) => {
  if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
    return null;
  }

  const firstReport = reportData[0];

  const getChartData = () => {
    try {
      console.log('Procesando datos para gráficos:', firstReport);
      
      // Para reportes por especialidad
      if (filters.reportType === 'specialty') {
        // Si viene en el formato esperado con specialtyStatistics
        if (firstReport.specialtyStatistics) {
          return firstReport.specialtyStatistics.map(item => ({
            name: item.specialty || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0,
            uniqueDoctors: item.uniqueDoctors || 0
          }));
        } 
        // Formato alternativo: si es un único objeto con propiedades directas
        else if (firstReport.specialty) {
          return [{
            name: firstReport.specialty || 'N/A',
            total: firstReport.totalConsultations || 0,
            uniquePatients: firstReport.uniquePatients || 0,
            uniqueDoctors: firstReport.uniqueDoctors || 0
          }];
        }
        // Otro formato posible: array de objetos simples
        else if (Array.isArray(reportData)) {
          return reportData.map(item => ({
            name: item.specialty || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0,
            uniqueDoctors: item.uniqueDoctors || 0
          }));
        }
      }
      
      // Para reportes por médico
      if (filters.reportType === 'doctor') {
        // Formato esperado: con topActiveDoctors
        if (firstReport.topActiveDoctors) {
          return firstReport.topActiveDoctors.map(item => ({
            name: item.doctorName || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0
          }));
        }
        // Formato alternativo: si es un objeto con datos de doctor directamente
        else if (firstReport.doctorName || firstReport.doctorId) {
          return [{
            name: firstReport.doctorName || `Doctor ID: ${firstReport.doctorId}` || 'N/A',
            total: firstReport.totalConsultations || 0,
            uniquePatients: firstReport.uniquePatients || 0
          }];
        }
        // Otro formato: array de objetos simples de doctor
        else if (Array.isArray(reportData)) {
          return reportData.map(item => ({
            name: item.doctorName || `Doctor ID: ${item.doctorId}` || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0
          }));
        }
      }

      // Para centros médicos
      if (filters.reportType === 'medical-center') {
        // Formato esperado: con medicalCenterStatistics
        if (firstReport.medicalCenterStatistics) {
          return firstReport.medicalCenterStatistics.map(item => ({
            name: item.centerName || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0,
            activeDoctors: item.activeDoctors || 0
          }));
        } 
        // Formato alternativo: objeto con datos directamente
        else if (firstReport.centerName || firstReport.medicalCenterId) {
          return [{
            name: firstReport.centerName || `Centro ID: ${firstReport.medicalCenterId}` || 'N/A',
            total: firstReport.totalConsultations || 0,
            uniquePatients: firstReport.uniquePatients || 0,
            activeDoctors: firstReport.activeDoctors || 0
          }];
        }
        // Otro formato: array de objetos simples
        else if (Array.isArray(reportData)) {
          return reportData.map(item => ({
            name: item.centerName || `Centro ID: ${item.medicalCenterId}` || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0,
            activeDoctors: item.activeDoctors || 0
          }));
        }
      }

      // Para reportes mensuales
      if (filters.reportType === 'monthly') {
        // Formato esperado: con monthlyStatistics
        if (firstReport.monthlyStatistics) {
          return firstReport.monthlyStatistics.map(item => ({
            name: item.period || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0
          }));
        }
        // Formato alternativo: objeto con datos directamente
        else if (firstReport.period) {
          return [{
            name: firstReport.period || 'N/A',
            total: firstReport.totalConsultations || 0,
            uniquePatients: firstReport.uniquePatients || 0
          }];
        }
        // Otro formato: array de períodos simple
        else if (Array.isArray(reportData)) {
          return reportData.map(item => ({
            name: item.period || 'N/A',
            total: item.totalConsultations || 0,
            uniquePatients: item.uniquePatients || 0
          }));
        }
      }
      
      // Si llegamos hasta aquí y no hemos identificado el formato, intentamos extraer datos genéricos
      if (Array.isArray(reportData) && reportData.length > 0) {
        return reportData.map(item => {
          const name = item.name || item.specialty || item.doctorName || item.centerName || item.period || 'Elemento';
          return {
            name: name,
            total: item.totalConsultations || item.total || 0,
            uniquePatients: item.uniquePatients || item.patients || 0
          };
        });
      }
      
      console.warn('No se pudo identificar un formato de datos reconocible para los gráficos');
        console.warn('No se pudo identificar un formato de datos reconocible para los gráficos');
      return [];
    } catch (error) {
      console.error('Error al procesar datos para gráficos:', error);
      return [];
    }
  };

  const getWeeklyDistributionData = () => {
    try {
      // Si no hay distribución semanal, retornar array vacío
      if (!firstReport || !firstReport.weeklyDistribution) {
        // Intentar buscar en otros formatos posibles
        if (firstReport && firstReport.weekdayDistribution) {
          const distribution = firstReport.weekdayDistribution;
          const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const daysSpanish = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          
          return daysOrder.map((day, index) => ({
            day: daysSpanish[index],
            consultations: distribution[day] || 0
          }));
        }
        
        return [];
      }
      
      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const daysSpanish = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      
      return daysOrder.map((day, index) => ({
        day: daysSpanish[index],
        consultations: firstReport.weeklyDistribution[day] || 0
      }));
    } catch (error) {
      console.error('Error al procesar distribución semanal:', error);
      return [];
    }
  };

  const chartData = getChartData();
  const weeklyData = getWeeklyDistributionData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras - Consultas Totales */}
      {chartData.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Consultas por {filters.reportType === 'specialty' ? 'Especialidad' : filters.reportType === 'doctor' ? 'Médico' : filters.reportType === 'medical-center' ? 'Centro Médico' : 'Período'}</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Distribución de consultas totales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
                <XAxis 
                  dataKey="name" 
                  className="dark:fill-gray-300"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="dark:fill-gray-300" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#374151', 
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total Consultas" />
                <Bar dataKey="uniquePatients" fill="#10B981" name="Pacientes Únicos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico Circular - Distribución */}
      {chartData.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Distribución de Consultas</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Proporción de consultas por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#374151', 
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Área - Distribución Semanal */}
      {weeklyData.length > 0 && (
        <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Distribución Semanal</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Consultas por día de la semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
                <XAxis dataKey="day" className="dark:fill-gray-300" />
                <YAxis className="dark:fill-gray-300" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#374151', 
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="consultations" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Consultas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportCharts;