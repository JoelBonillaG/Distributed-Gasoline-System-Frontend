import React, { useState } from 'react';
import { Download, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import reportsService from '@/services/reports.service';
import { listAllDoctors } from '@/services/doctors.service';
import { format } from 'date-fns';

const ReportsExport = () => {
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  // Export history removed per UX simplification request

  const [exportConfig, setExportConfig] = useState({
    reportType: 'specialty',
    format: 'pdf',
    startDate: '',
    endDate: '',
    includeDetails: true,
    exportName: ''
  });

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const reportTypes = [
    { value: 'specialty', label: 'Consultas por Especialidad' },
    { value: 'doctor', label: 'Rendimiento de Médicos' },
    { value: 'medical_center', label: 'Análisis por Centro Médico' },
    { value: 'monthly', label: 'Reporte Mensual' },
    { value: 'comprehensive', label: 'Reporte Integral' }
  ];

  const exportFormats = [
    { value: 'pdf', label: 'PDF', description: 'Formato profesional para presentaciones' },
    { value: 'excel', label: 'Excel', description: 'Para análisis y manipulación de datos' },
    { value: 'csv', label: 'CSV', description: 'Para importar en otras herramientas' },
  ];

  const handleConfigChange = (key, value) => {
    setExportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateExportConfig = () => {
    if (!exportConfig.reportType) {
      throw new Error('Selecciona un tipo de reporte');
    }
    if (!exportConfig.format) {
      throw new Error('Selecciona un formato de exportación');
    }
    if (!exportConfig.exportName.trim()) {
      throw new Error('Ingresa un nombre para el reporte');
    }
    // When generating doctor reports, a specific doctor must be selected
    if (exportConfig.reportType === 'doctor' && (selectedDoctorId === null || selectedDoctorId === undefined)) {
      throw new Error('Selecciona un médico para el reporte por médico');
    }
    return true;
  };

  // Load doctors when report type switches to doctor
  React.useEffect(() => {
    let mounted = true;
    if (exportConfig.reportType === 'doctor') {
      listAllDoctors()
        .then(data => {
          if (!mounted) return;
          // Debug: log raw response (helps diagnose shape issues)
          console.debug('[ReportsExport] listAllDoctors raw response:', data);
          // Normalize possible response shapes: array | { data: [] } | { content: [] }
          const docs = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.content)
                ? data.content
                : [];
          console.debug('[ReportsExport] normalized doctors array:', docs);
          setDoctors(docs);
          // Auto-select first doctor when switching to doctor report if none selected
          if (docs.length > 0) {
            setSelectedDoctorId(prev => (prev === null || prev === undefined) ? docs[0].id : prev);
          } else {
            console.warn('[ReportsExport] No doctors were returned by listAllDoctors');
          }
        })
        .catch(err => {
          console.error('Error fetching doctors for export:', err);
          setDoctors([]);
        });
    }
    return () => { mounted = false; };
  }, [exportConfig.reportType]);

  // Helper to format doctor label as "Nombre Apellido" with sensible fallbacks
  const fixEncoding = (str) => {
  if (!str) return str;
  return str
    .replace(/¡/g, 'í')
    .replace(/¢/g, 'ó')
    .replace(/‚/g, 'é')
    .replace(/„/g, 'ä')
    .replace(/…/g, 'à')
    .replace(/†/g, 'á')
    .replace(/‡/g, 'â')
    .replace(/ˆ/g, 'ê')
    .replace(/‰/g, 'ë')
    .replace(/Š/g, 'è')
    .replace(/‹/g, 'ï')
    .replace(/Œ/g, 'î')
    .replace(//g, 'ì')
    .replace(/Ž/g, 'ô')
    .replace(//g, 'ö')
    .replace(//g, 'ò')
    .replace(/'/g, 'ú')
    .replace(/'/g, 'ù')
    .replace(/“/g, 'ü')
    .replace(/”/g, 'û')
    .replace(/•/g, 'ñ')
    .replace(/–/g, 'Ñ')
    .replace(/—/g, 'Á')
    .replace(/˜/g, 'É')
    .replace(/™/g, 'Í')
    .replace(/š/g, 'Ó')
    .replace(/›/g, 'Ú')
    .replace(/œ/g, 'Ü')
    .replace(//g, '¿')
    .replace(/ž/g, '¡');
};

  const formatDoctorLabel = (doc) => {
    if (!doc) return '';
    const user = doc.user || {};
    const firstName = fixEncoding(user.firstName || user.name || '');
    const lastName = fixEncoding(user.lastName || user.surname || '');
    // Try to locate a document/cedula value from multiple possible fields
    const docCandidates = [
      doc.dni,
      doc.cedula,
      doc.documentNumber,
      doc.document,
      doc.identificationNumber,
      user.dni,
      user.cedula,
      user.documentNumber,
      user.document,
      user.identificationNumber
    ];

    const docValue = docCandidates.find(v => v !== null && v !== undefined && String(v).trim() !== '');

    const namePart = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}`.trim() : (fixEncoding(doc.fullName) || fixEncoding(user.name) || doc.username || `Doctor ${doc.id || ''}`);

    return docValue ? `${namePart} — Cédula: ${String(docValue)}` : namePart;
  };

  const exportReport = async () => {
    try {
      validateExportConfig();
      setLoading(true);
      setExportProgress(0);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      let reportData;
      const filterData = {
        startDate: exportConfig.startDate || null,
        endDate: exportConfig.endDate || null
      };

      // If includeDetails is checked -> fetch detailed data from consultation endpoints and generate client-side PDF
      if (exportConfig.includeDetails) {
        switch (exportConfig.reportType) {
          case 'specialty':
            reportData = await reportsService.getConsultationsBySpecialty(filterData);
            break;
          case 'doctor': {
            // attach selected doctor id if available
            const f = { ...filterData };
            if (selectedDoctorId) f.doctorId = selectedDoctorId;
            reportData = await reportsService.getConsultationsByDoctor(f);
            break;
          }
          case 'medical-center':
            reportData = await reportsService.getConsultationsByMedicalCenter(filterData);
            break;
          case 'monthly':
            reportData = await reportsService.getConsultationsByMonth(filterData);
            break;
          case 'comprehensive': {
            const specialtyData = await reportsService.getConsultationsBySpecialty(filterData);
            const doctorData = await reportsService.getConsultationsByDoctor(filterData);
            const centerData = await reportsService.getConsultationsByMedicalCenter(filterData);
            const monthlyData = await reportsService.getConsultationsByMonth(filterData);
            reportData = { specialties: specialtyData, doctors: doctorData, centers: centerData, monthly: monthlyData };
            break;
          }
          default:
            throw new Error('Tipo de reporte no válido');
        }

        // Generate PDF in frontend using pdfGenerator utilities
        const pdfGenerator = await import('@/utils/pdfGenerator');
        let doc;
        switch (exportConfig.reportType) {
          case 'specialty':
            doc = pdfGenerator.generateSpecialtyPDF(reportData, filterData);
            break;
          case 'doctor':
            doc = pdfGenerator.generateDoctorPDF(reportData, filterData);
            break;
          case 'medical-center':
            doc = pdfGenerator.generateMedicalCenterPDF(reportData, filterData);
            break;
          case 'monthly':
            doc = pdfGenerator.generateMonthlyPDF(reportData, filterData);
            break;
          default:
            doc = pdfGenerator.generateSpecialtyPDF(reportData, filterData);
        }

        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const filename = `${exportConfig.exportName || 'reporte'}_${timestamp}.pdf`;
        pdfGenerator.downloadPDF(doc, filename);

      } else {
        // Not includeDetails: call backend /generate which returns a PDF (or other format) already generated
        const payload = {
          reportType: exportConfig.reportType.toUpperCase(),
          exportFormat: (exportConfig.format || 'pdf').toUpperCase(),
          startDate: exportConfig.startDate || null,
          endDate: exportConfig.endDate || null,
          filterId: exportConfig.reportType === 'doctor' && selectedDoctorId ? Number(selectedDoctorId) : null
        };

        await reportsService.generateReport(payload);
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      
      } catch (error) {
      console.error('Error al exportar reporte:', error);
      alert(error.message || 'Error al exportar el reporte');
    } finally {
      setLoading(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  // Helpers for CSV/other formats removed (backend generate endpoint handles binary downloads)

  // Export history/status helpers removed

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exportación de Reportes</h1>
          <p className="text-gray-600 mt-1">Genera y descarga reportes en diferentes formatos</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuración */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración del Reporte</span>
                </CardTitle>
                <CardDescription>
                  Personaliza los parámetros de tu reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportName">Nombre del Reporte</Label>
                    <Input
                      id="exportName"
                      placeholder="Ej: Reporte_Especialidades_Enero"
                      value={exportConfig.exportName}
                      onChange={(e) => handleConfigChange('exportName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportType">Tipo de Reporte</Label>
                    <Select
                      value={exportConfig.reportType}
                      onValueChange={(value) => handleConfigChange('reportType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* When choosing DOCTOR report, show doctors combobox */}
                  {exportConfig.reportType === 'doctor' && (
                    <div className="space-y-2">
                      <Label htmlFor="doctorSelect">Médico</Label>
                      <Select value={selectedDoctorId != null ? String(selectedDoctorId) : ''} onValueChange={(v) => setSelectedDoctorId(v && v !== 'none' ? Number(v) : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona médico" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.length === 0 ? (
                            <SelectItem value="none">No hay médicos disponibles</SelectItem>
                          ) : (
                            doctors.map((doc) => (
                              <SelectItem key={doc.id} value={String(doc.id)}>
                                {formatDoctorLabel(doc)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Rango de fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <Input
                      type="date"
                      id="startDate"
                      value={exportConfig.startDate}
                      onChange={(e) => handleConfigChange('startDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <Input
                      type="date"
                      id="endDate"
                      value={exportConfig.endDate}
                      onChange={(e) => handleConfigChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Formato de exportación */}
                <div className="space-y-3">
                  <Label>Formato de Exportación</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportFormats.map((format) => (
                      <div
                        key={format.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          exportConfig.format === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleConfigChange('format', format.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            checked={exportConfig.format === format.value}
                            onChange={() => handleConfigChange('format', format.value)}
                            className="text-blue-600"
                          />
                          <div>
                            <p className="font-medium">{format.label}</p>
                            <p className="text-sm text-gray-500">{format.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opciones adicionales simplificadas */}
                <div className="space-y-3">
                  <Label>Opciones Adicionales</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeDetails"
                        aria-label="Incluir datos detallados"
                        checked={exportConfig.includeDetails}
                        onCheckedChange={(checked) => handleConfigChange('includeDetails', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista previa y acciones */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>Resumen de la configuración</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">
                      {reportTypes.find(t => t.value === exportConfig.reportType)?.label || 'No seleccionado'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Formato:</span>
                    <span className="font-medium">
                      {exportFormats.find(f => f.value === exportConfig.format)?.label || 'No seleccionado'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium">
                      {exportConfig.startDate && exportConfig.endDate 
                        ? `${exportConfig.startDate} a ${exportConfig.endDate}`
                        : 'Todo el período'
                      }
                    </span>
                  </div>
                  {exportConfig.reportType === 'doctor' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Médico:</span>
                      <span className="font-medium">
                        {selectedDoctorId
                          ? formatDoctorLabel(doctors.find(d => String(d.id) === String(selectedDoctorId)) || {})
                          : 'No seleccionado'}
                      </span>
                    </div>
                  )}
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso:</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                  </div>
                )}

                <Button
                  onClick={exportReport}
                  disabled={loading || !exportConfig.exportName.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Reporte
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;