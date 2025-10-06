import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Label } from "@/components/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { CalendarIcon, FileBarChart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import specialtiesService from "../../../services/specialties.service";
import doctorsService from "../../../services/doctors.service";
import medicalCentersService from "../../../services/medicalCenters.service";

const ReportFilters = ({ filters, onFilterChange, onGenerateReport, isLoading }) => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Cargar opciones iniciales
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      const [specialtiesRes, doctorsRes, centersRes] = await Promise.all([
        specialtiesService.listAllSpecialties(),
        doctorsService.listAllDoctors(),
        medicalCentersService.listAllMedicalCenters()
      ]);

      setSpecialties(specialtiesRes || []);
      setDoctors(doctorsRes || []);
      setMedicalCenters(centersRes || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleFilterChange = (key, value) => {
    // Si se selecciona un doctor específico, auto-seleccionar su especialidad
    if (key === 'doctor' && value !== 'ALL') {
      const selectedDoctor = doctors.find(doc => doc.id.toString() === value.toString());
      if (selectedDoctor && selectedDoctor.specialty) {
        onFilterChange('specialty', selectedDoctor.specialty.id.toString());
      }
    }
    
    onFilterChange(key, value);
  };

  const validateAndGenerateReport = () => {
    const errors = [];

    // Validaciones obligatorias según tipo de reporte
    if (filters.reportType === 'specialty' && (!filters.specialty || filters.specialty === 'ALL')) {
      errors.push('Debe seleccionar una especialidad para el reporte por especialidad');
    }

    if (filters.reportType === 'doctor' && (!filters.doctor || filters.doctor === 'ALL')) {
      errors.push('Debe seleccionar un médico para el reporte por médico');
    }

    if (filters.reportType === 'medical-center' && (!filters.medicalCenter || filters.medicalCenter === 'ALL')) {
      errors.push('Debe seleccionar un centro médico para el reporte por centro médico');
    }

    // Validar fechas
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const today = new Date();
      
      if (endDate > today) {
        errors.push('La fecha fin no puede ser superior a la fecha actual');
      }
      
      if (startDate > endDate) {
        errors.push('La fecha de inicio no puede ser posterior a la fecha fin');
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    onGenerateReport();
  };

  // Obtener fecha máxima (hoy)
  const getMaxDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Obtener especialidades filtradas por doctor
  const getFilteredSpecialties = () => {
    if (filters.doctor && filters.doctor !== 'ALL') {
      const selectedDoctor = doctors.find(doc => doc.id.toString() === filters.doctor.toString());
      if (selectedDoctor && selectedDoctor.specialty) {
        return specialties.filter(spec => spec.id === selectedDoctor.specialty.id);
      }
    }
    return specialties;
  };

  const filteredSpecialties = getFilteredSpecialties();

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-white flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          Configuración del Reporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Reporte */}
        <div className="space-y-2">
          <Label htmlFor="reportType" className="dark:text-white">Tipo de Reporte *</Label>
          <Select
            value={filters.reportType}
            onValueChange={(value) => handleFilterChange('reportType', value)}
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

        {/* Filtros condicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doctor - Solo visible para reporte por doctor */}
          {filters.reportType === 'doctor' && (
            <div className="space-y-2">
              <Label htmlFor="doctor" className="dark:text-white">Médico *</Label>
              <Select
                value={filters.doctor}
                onValueChange={(value) => handleFilterChange('doctor', value)}
                disabled={loadingOptions}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione médico" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      {doctor.firstName} {doctor.lastName} - {doctor.specialty?.name || 'Sin especialidad'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Especialidad - Solo visible para reporte por especialidad o cuando hay doctor seleccionado */}
          {(filters.reportType === 'specialty' || (filters.reportType === 'doctor' && filters.doctor !== 'ALL')) && (
            <div className="space-y-2">
              <Label htmlFor="specialty" className="dark:text-white">
                Especialidad {filters.reportType === 'specialty' ? '*' : ''}
              </Label>
              <Select
                value={filters.specialty}
                onValueChange={(value) => handleFilterChange('specialty', value)}
                disabled={loadingOptions || (filters.reportType === 'doctor' && filters.doctor !== 'ALL')}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione especialidad" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {filters.reportType !== 'specialty' && (
                    <SelectItem value="ALL">Todas las especialidades</SelectItem>
                  )}
                  {filteredSpecialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id.toString()}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Centro Médico - Solo visible para reporte por centro médico */}
          {filters.reportType === 'medical-center' && (
            <div className="space-y-2">
              <Label htmlFor="medicalCenter" className="dark:text-white">Centro Médico *</Label>
              <Select
                value={filters.medicalCenter}
                onValueChange={(value) => handleFilterChange('medicalCenter', value)}
                disabled={loadingOptions}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Seleccione centro médico" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {medicalCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Rango de Fechas */}
        <div className="space-y-4">
          <Label className="dark:text-white">Rango de Fechas</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm dark:text-gray-300">Fecha Inicio</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  max={getMaxDate()}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm dark:text-gray-300">Fecha Fin</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  max={getMaxDate()}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Generar Reporte */}
        <div className="flex justify-end pt-4">
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