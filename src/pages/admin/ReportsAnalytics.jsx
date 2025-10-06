import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Filter, Users, Activity, Stethoscope, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import reportsService from '@/services/reports.service';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';


const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('6months');
  const [analyticsData, setAnalyticsData] = useState({
    trends: [],
    kpis: {
      totalConsultations: 0,
      monthlyGrowth: 0,
      averageDaily: 0,
      completionRate: 0,
      topSpecialty: '',
      topDoctor: '',
      activePatients: 0,
      efficiency: 0
    },
    chartData: {
      monthly: [],
      specialties: [],
      doctors: [],
      centers: []
    }
  });

  const timeRanges = [
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '1year', label: 'Último año' },
    { value: '2years', label: 'Últimos 2 años' }
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]); // loadAnalyticsData se define dentro del componente y no cambia

  const getDateRange = () => {
    const now = new Date();
    let months = 6;
    
    switch (timeRange) {
      case '3months': months = 3; break;
      case '6months': months = 6; break;
      case '1year': months = 12; break;
      case '2years': months = 24; break;
    }
    
    const startDate = format(startOfMonth(subMonths(now, months)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    
    return { startDate, endDate };
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Cargar datos de diferentes tipos de reportes en paralelo
      const [monthlyData, specialtyData, doctorData, centerData] = await Promise.all([
        reportsService.getConsultationsByMonth({ startDate, endDate }),
        reportsService.getConsultationsBySpecialty({ startDate, endDate }),
        reportsService.getConsultationsByDoctor({ startDate, endDate }),
        reportsService.getConsultationsByMedicalCenter({ startDate, endDate })
      ]);

      // Procesar datos mensuales para tendencias
      const trendsData = monthlyData.map(item => ({
        month: item.month || 'N/A',
        total: item.totalConsultations || 0,
        active: item.activeConsultations || 0,
        completed: item.completedConsultations || 0,
        trend: item.totalConsultations > 0 ? 
          ((item.completedConsultations / item.totalConsultations) * 100) : 0
      }));

      // Calcular KPIs
      const totalConsultations = monthlyData.reduce((sum, item) => sum + (item.totalConsultations || 0), 0);
      const totalCompleted = monthlyData.reduce((sum, item) => sum + (item.completedConsultations || 0), 0);
      const totalActive = monthlyData.reduce((sum, item) => sum + (item.activeConsultations || 0), 0);
      
      const completionRate = totalConsultations > 0 ? (totalCompleted / totalConsultations) * 100 : 0;
      const averageDaily = totalConsultations / (monthlyData.length * 30); // Aproximado
      
      // Calcular crecimiento mensual
      const monthlyGrowth = trendsData.length >= 2 ? 
        ((trendsData[trendsData.length - 1].total - trendsData[trendsData.length - 2].total) / 
         Math.max(trendsData[trendsData.length - 2].total, 1)) * 100 : 0;

      // Encontrar top performers
      const topSpecialty = specialtyData.length > 0 ? 
        specialtyData.reduce((max, item) => 
          (item.totalConsultations || 0) > (max.totalConsultations || 0) ? item : max
        ).specialtyName : 'N/A';

      const topDoctor = doctorData.length > 0 ? 
        doctorData.reduce((max, item) => 
          (item.totalConsultations || 0) > (max.totalConsultations || 0) ? item : max
        ).doctorName : 'N/A';

      setAnalyticsData({
        trends: trendsData,
        kpis: {
          totalConsultations,
          monthlyGrowth,
          averageDaily,
          completionRate,
          topSpecialty,
          topDoctor,
          activePatients: totalActive,
          efficiency: completionRate
        },
        chartData: {
          monthly: trendsData,
          specialties: specialtyData.slice(0, 8), // Top 8
          doctors: doctorData.slice(0, 10), // Top 10
          centers: centerData
        }
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      purple: 'text-purple-600 bg-purple-50',
      red: 'text-red-600 bg-red-50'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="mt-4 flex items-center space-x-2">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Avanzado</h1>
          <p className="text-gray-600 mt-1">Análisis detallado del rendimiento y tendencias</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadAnalyticsData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Consultas Totales"
          value={analyticsData.kpis.totalConsultations.toLocaleString()}
          subtitle={`${analyticsData.kpis.averageDaily.toFixed(1)} promedio diario`}
          icon={Activity}
          trend={analyticsData.kpis.monthlyGrowth}
          color="blue"
        />
        
        <KPICard
          title="Tasa de Finalización"
          value={`${analyticsData.kpis.completionRate.toFixed(1)}%`}
          subtitle="Consultas completadas"
          icon={TrendingUp}
          color="green"
        />

        <KPICard
          title="Pacientes Activos"
          value={analyticsData.kpis.activePatients.toLocaleString()}
          subtitle="En tratamiento"
          icon={Users}
          color="yellow"
        />

        <KPICard
          title="Eficiencia Global"
          value={`${analyticsData.kpis.efficiency.toFixed(1)}%`}
          subtitle="Rendimiento sistema"
          icon={Stethoscope}
          color="purple"
        />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5" />
              <span>Top Especialidad</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <p className="text-2xl font-bold text-blue-600">{analyticsData.kpis.topSpecialty}</p>
              <p className="text-sm text-gray-500 mt-2">Especialidad más activa</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Médico</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <p className="text-2xl font-bold text-green-600">{analyticsData.kpis.topDoctor}</p>
              <p className="text-sm text-gray-500 mt-2">Médico más productivo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="specialties">Especialidades</TabsTrigger>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="centers">Centros</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
              <CardDescription>Evolución de consultas a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="Completadas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stackId="3"
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    fillOpacity={0.6}
                    name="Activas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specialties">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Especialidades</CardTitle>
              <CardDescription>Top especialidades médicas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.chartData.specialties}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="specialtyName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalConsultations" fill="#3B82F6" name="Total Consultas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Médico</CardTitle>
              <CardDescription>Top médicos por productividad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.chartData.doctors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="doctorName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalConsultations" fill="#10B981" name="Consultas" />
                  <Bar dataKey="completedConsultations" fill="#F59E0B" name="Completadas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Centros</CardTitle>
                <CardDescription>Consultas por centro médico</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.chartData.centers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalConsultations"
                    >
                      {analyticsData.chartData.centers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiencia por Centro</CardTitle>
                <CardDescription>Tasa de finalización</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.chartData.centers.map((center, index) => {
                    const efficiency = center.totalConsultations > 0 ? 
                      ((center.completedConsultations || 0) / center.totalConsultations) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{center.medicalCenterName || 'N/A'}</p>
                          <p className="text-sm text-gray-500">
                            {(center.totalConsultations || 0).toLocaleString()} consultas
                          </p>
                        </div>
                        <Badge 
                          variant={efficiency > 80 ? 'success' : efficiency > 60 ? 'warning' : 'destructive'}
                        >
                          {efficiency.toFixed(1)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAnalytics;