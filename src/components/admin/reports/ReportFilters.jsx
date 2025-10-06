import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarIcon, 
  FileBarChart, 
  FileText, 
  Eye, 
  Download, 
  RefreshCw 
} from "lucide-react";
import { format } from "date-fns";
import specialtiesService from "@/services/specialties.service";
import doctorsService from "@/services/doctors.service";
import medicalCentersService from "@/services/medicalCenters.service";
import { toast } from "sonner";
import PDFGenerator from "@/utils/pdfGenerator";

const ReportFilters = ({
  filters,
  onFilterChange,
  onGenerateReport,
  isLoading,
  reportData,
}) => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);

  // Cargar opciones iniciales
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true);
      try {
        // Cargar todas las opciones en paralelo
        const [specialtiesRes, doctorsRes, centersRes] = await Promise.all([
          specialtiesService.listAllSpecialties(),
          doctorsService.listAllDoctors(),
          medicalCentersService.listAllCenters(),
        ]);

        setSpecialties(specialtiesRes || []);
        setDoctors(doctorsRes || []);
        setMedicalCenters(centersRes || []);
      } catch (error) {
        console.error("Error cargando opciones de filtros:", error);
        toast.error("Error al cargar opciones de filtros");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Manejar cambios de filtros y actualizar dependencias
  const handleFilterChange = useCallback(
    (key, value) => {
      // Restablecer especialidad si se cambia de reportType a no-specialty
      if (key === "reportType" && value !== "specialty") {
        onFilterChange("specialty", "");
      }

      // Restablecer doctor si se cambia de reportType a no-doctor
      if (key === "reportType" && value !== "doctor") {
        onFilterChange("doctor", "");
      }

      // Restablecer centro médico si se cambia de reportType a no-medical-center
      if (key === "reportType" && value !== "medical-center") {
        onFilterChange("medicalCenter", "");
      }

      // Actualizar el valor del filtro
      onFilterChange(key, value);

      // Si se selecciona un doctor, filtrar su especialidad
      if (key === "doctor" && value) {
        const selectedDoctor = doctors.find(
          (doc) => doc.id.toString() === value.toString()
        );

        if (selectedDoctor?.specialty?.id) {
          onFilterChange("specialty", selectedDoctor.specialty.id.toString());
        }
      }

      // Si autoUpdate está activado, actualizar el dashboard automáticamente
      // después de cada cambio de filtro, pero solo si hay suficientes datos
      if (autoUpdate && 
        ((filters.reportType === "specialty" && filters.specialty) ||
         (filters.reportType === "doctor" && filters.doctor) ||
         (filters.reportType === "medical-center" && filters.medicalCenter) ||
         (filters.reportType === "monthly"))
      ) {
        setTimeout(() => onGenerateReport(), 300);
      }
    },
    [doctors, onFilterChange, autoUpdate, filters.reportType, onGenerateReport]
  );

  // Validar y generar reporte
  const validateAndGenerateReport = useCallback(() => {
    const errors = [];

    // Validaciones específicas por tipo de reporte
    if (
      filters.reportType === "specialty" &&
      !filters.specialty
    ) {
      errors.push(
        "Debe seleccionar una especialidad para el reporte por especialidad"
      );
    }

    if (
      filters.reportType === "doctor" &&
      !filters.doctor
    ) {
      errors.push("Debe seleccionar un médico para el reporte por médico");
    }

    if (
      filters.reportType === "medical-center" &&
      !filters.medicalCenter
    ) {
      errors.push(
        "Debe seleccionar un centro médico para el reporte por centro médico"
      );
    }

    // Validar fechas
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const today = new Date();

      if (endDate > today) {
        errors.push("La fecha fin no puede ser superior a la fecha actual");
      }

      if (startDate > endDate) {
        errors.push("La fecha de inicio no puede ser posterior a la fecha fin");
      }
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }

    onGenerateReport();
    return true;
  }, [filters, onGenerateReport]);

  // Generar PDF a partir del reportData actual
  const generatePDF = useCallback((preview = false) => {
    if (!reportData || !reportData.length) {
      toast.error("No hay datos disponibles para generar PDF");
      return;
    }

    try {
      setPdfProcessing(true);
      
      // Preparar información adicional para el PDF
      const enhancedFilters = {
        ...filters,
        // Agregar nombres para mostrar en el PDF
        specialtyName:
          filters.specialty
            ? specialties.find((s) => s.id.toString() === filters.specialty)?.name
            : null,
        doctorName:
          filters.doctor
            ? (() => {
                const doctor = doctors.find(d => d.id.toString() === filters.doctor);
                return doctor ? `${doctor.firstName} ${doctor.lastName}` : null;
              })()
            : null,
        medicalCenterName:
          filters.medicalCenter
            ? medicalCenters.find(c => c.id.toString() === filters.medicalCenter)?.name
            : null,
      };

      // Generar el PDF usando el generador apropiado según el tipo de reporte
      const doc = PDFGenerator.generateReport(filters.reportType, reportData, enhancedFilters);

      // Definir el nombre de archivo con timestamp para hacerlo único
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
      const reportTypeName = {
        'specialty': 'especialidad',
        'doctor': 'medico',
        'medical-center': 'centro-medico',
        'monthly': 'mensual'
      }[filters.reportType] || filters.reportType;
      
      const filename = `reporte_${reportTypeName}_${timestamp}.pdf`;
      
      // Decidir si descargar o previsualizar
      if (preview) {
        PDFGenerator.previewPDF(doc);
        toast.success("Vista previa del PDF generada");
      } else {
        PDFGenerator.downloadPDF(doc, filename);
        toast.success("PDF descargado correctamente");
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error(`Error al generar el PDF: ${error.message || 'Error desconocido'}`);
    } finally {
      setPdfProcessing(false);
    }
  }, [reportData, filters, specialties, doctors, medicalCenters]);

  // Obtener fecha máxima (hoy)
  const getMaxDate = () => {
    return format(new Date(), "yyyy-MM-dd");
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="dark:text-white flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Configuración del Reporte
          </CardTitle>
          
          {/* Toggle de actualización automática */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="autoUpdate" 
              className="text-sm dark:text-gray-300 cursor-pointer flex items-center"
            >
              <Checkbox
                id="autoUpdate"
                checked={autoUpdate}
                onCheckedChange={setAutoUpdate}
                className="mr-2"
              />
              Actualización automática
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Reporte */}
        <div className="space-y-2">
          <Label htmlFor="reportType" className="dark:text-white">
            Tipo de Reporte *
          </Label>
          <Select
            value={filters.reportType}
            onValueChange={(value) => handleFilterChange("reportType", value)}
          >
            <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder="Seleccione el tipo de reporte" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectItem value="specialty">Por Especialidad</SelectItem>
              <SelectItem value="doctor">Por Médico</SelectItem>
              <SelectItem value="medical-center">Por Centro Médico</SelectItem>
              <SelectItem value="monthly">Reporte Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros condicionales organizados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Especialidad - Solo visible para reporte por especialidad */}
          {filters.reportType === "specialty" && (
            <div className="space-y-2">
              <Label htmlFor="specialty" className="dark:text-white">
                Especialidad *
              </Label>
              <Select
                value={filters.specialty}
                onValueChange={(value) =>
                  handleFilterChange("specialty", value)
                }
                disabled={loadingOptions}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione especialidad" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {specialties.map((specialty) => (
                    <SelectItem
                      key={specialty.id}
                      value={specialty.id.toString()}
                    >
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Doctor - Solo visible para reporte por doctor */}
          {filters.reportType === "doctor" && (
            <div className="space-y-2">
              <Label htmlFor="doctor" className="dark:text-white">
                Médico *
              </Label>
              <Select
                value={filters.doctor}
                onValueChange={(value) => handleFilterChange("doctor", value)}
                disabled={loadingOptions}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione médico" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600 max-h-56 overflow-y-auto">
                  {doctors.length === 0 ? (
                    <SelectItem value="no-doctors" disabled>
                      No hay médicos disponibles
                    </SelectItem>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.firstName} {doctor.lastName}
                        {doctor.specialty?.name
                          ? ` - ${doctor.specialty.name}`
                          : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Centro Médico - Solo visible para reporte por centro médico */}
          {filters.reportType === "medical-center" && (
            <div className="space-y-2">
              <Label htmlFor="medicalCenter" className="dark:text-white">
                Centro Médico *
              </Label>
              <Select
                value={filters.medicalCenter}
                onValueChange={(value) =>
                  handleFilterChange("medicalCenter", value)
                }
                disabled={loadingOptions}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione centro médico" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {medicalCenters.length === 0 ? (
                    <SelectItem value="no-centers" disabled>
                      No hay centros disponibles
                    </SelectItem>
                  ) : (
                    medicalCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Filtros de Fecha y Estado */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm dark:text-gray-300">
                Fecha Inicio
              </Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  max={getMaxDate()}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm dark:text-gray-300">
                Fecha Fin
              </Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  max={getMaxDate()}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acciones */}
        <div className="flex justify-end pt-4 gap-3">
          {/* Botones de PDF (solo visibles si hay datos) */}
          {reportData && reportData.length > 0 && (
            <>
              {/* Vista previa del PDF */}
              <Button
                onClick={() => generatePDF(true)}
                variant="outline"
                disabled={pdfProcessing}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 hover:dark:bg-gray-600"
              >
                <Eye className="mr-2 h-4 w-4" />
                Vista Previa
              </Button>
              
              {/* Descargar PDF */}
              <Button
                onClick={() => generatePDF(false)}
                variant="outline"
                disabled={pdfProcessing}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 hover:dark:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </>
          )}

          {/* Botón de actualizar (si está activa la actualización automática) */}
          {autoUpdate && (
            <Button
              onClick={validateAndGenerateReport}
              disabled={isLoading}
              variant="ghost"
              className="dark:text-gray-300"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {/* Botón de generar reporte */}
          <Button
            onClick={validateAndGenerateReport}
            disabled={isLoading || loadingOptions}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </>
            ) : (
              <>
                <FileBarChart className="mr-2 h-4 w-4" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
