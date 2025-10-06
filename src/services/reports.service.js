import api from './api';
import { REPORT_TYPES, EXPORT_FORMATS } from '@/types/report-types';
import { generateSpecialtyPDF, generateDoctorPDF, generateMedicalCenterPDF, generateMonthlyPDF } from '@/utils/pdfGenerator';

const REPORTS_BASE_URL = '/api/reports';

// Configuración común de headers
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json; charset=utf-8'
};

// Mapeo de tipos de reporte a endpoints
const REPORT_ENDPOINTS = {
  [REPORT_TYPES.SPECIALTY]: `${REPORTS_BASE_URL}/consultation/specialty`,
  [REPORT_TYPES.DOCTOR]: `${REPORTS_BASE_URL}/consultation/doctor`,
  [REPORT_TYPES.MEDICAL_CENTER]: `${REPORTS_BASE_URL}/consultation/center`,
  [REPORT_TYPES.MONTHLY]: `${REPORTS_BASE_URL}/consultation/monthly`
};

// Generador de nombres de archivo
const generateFilename = (reportType, format, timestamp = new Date()) => {
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const typeNames = {
    [REPORT_TYPES.SPECIALTY]: 'especialidades',
    [REPORT_TYPES.DOCTOR]: 'medicos',
    [REPORT_TYPES.MEDICAL_CENTER]: 'centros-medicos',
    [REPORT_TYPES.MONTHLY]: 'mensual'
  };
  
  return `reporte-${typeNames[reportType]}-${dateStr}_${timeStr}.${format}`;
};

// Normaliza distintos nombres de campos provenientes del UI a los esperados por el backend
const toIntArray = (value) => {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return Array.from(new Set(arr
    .map(v => parseInt(v))
    .filter(v => !Number.isNaN(v))));
};

// Convertir los filtros del UI a DTO del backend (claves en español y arrays)
const prepareFilters = (filters = {}) => {
  // Fechas
  const fechaInicio = filters.fechaInicio || filters.startDate || null;
  const fechaFin = filters.fechaFin || filters.endDate || null;

  // Colecciones (IDs en arrays)
  const medicos = filters.medicos
    ? toIntArray(filters.medicos)
    : (filters.doctors ? toIntArray(filters.doctors)
      : (filters.doctorId != null ? toIntArray([filters.doctorId])
        : (filters.doctor != null ? toIntArray([filters.doctor]) : [])));

  const especialidades = filters.especialidades
    ? toIntArray(filters.especialidades)
    : (filters.specialties ? toIntArray(filters.specialties)
      : (filters.specialtyId != null ? toIntArray([filters.specialtyId])
        : (filters.specialty != null ? toIntArray([filters.specialty]) : [])));

  const centrosMedicos = filters.centrosMedicos
    ? toIntArray(filters.centrosMedicos)
    : (filters.medicalCenters ? toIntArray(filters.medicalCenters)
      : (filters.medicalCenterId != null ? toIntArray([filters.medicalCenterId])
        : (filters.medicalCenter != null ? toIntArray([filters.medicalCenter]) : [])));

  // Orden/paginación/estado (con valores por defecto seguros)
  const estado = filters.estado || filters.status || null;
  const ordenarPor = filters.ordenarPor || filters.orderBy || null;
  const direccionOrden = filters.direccionOrden || filters.sortDirection || filters.direccion || null;
  const pagina = (filters.pagina ?? filters.page ?? 0);
  const tamanio = (filters.tamanio ?? filters.pageSize ?? 20);

  return {
    fechaInicio,
    fechaFin,
    centrosMedicos,
    especialidades,
    medicos,
    estado,
    ordenarPor,
    direccionOrden,
    pagina,
    tamanio
  };
};

// Servicio de reportes
const reportsService = {
  /**
   * Obtiene un reporte por especialidad
   */
  getConsultationsBySpecialty: async (filters) => {
    const preparedFilters = prepareFilters(filters);
    const response = await api.post(REPORT_ENDPOINTS[REPORT_TYPES.SPECIALTY], preparedFilters, {
      headers: JSON_HEADERS
    });
    return response.data;
  },

  /**
   * Obtiene un reporte por médico
   */
  getConsultationsByDoctor: async (filters) => {
    const preparedFilters = prepareFilters(filters);
    const response = await api.post(REPORT_ENDPOINTS[REPORT_TYPES.DOCTOR], preparedFilters, {
      headers: JSON_HEADERS
    });
    return response.data;
  },

  /**
   * Obtiene un reporte por centro médico
   */
  getConsultationsByMedicalCenter: async (filters) => {
    const preparedFilters = prepareFilters(filters);
    const response = await api.post(REPORT_ENDPOINTS[REPORT_TYPES.MEDICAL_CENTER], preparedFilters, {
      headers: JSON_HEADERS
    });
    return response.data;
  },

  /**
   * Obtiene un reporte mensual
   */
  getConsultationsByMonth: async (filters) => {
    const preparedFilters = prepareFilters(filters);
    const response = await api.post(REPORT_ENDPOINTS[REPORT_TYPES.MONTHLY], preparedFilters, {
      headers: JSON_HEADERS
    });
    return response.data;
  },

  /**
   * Genera un PDF para el reporte especificado
   */
  generatePDF: async (reportType, reportData, filters) => {
    if (!reportData) {
      throw new Error('No hay datos para generar el reporte');
    }

    let pdfBlob;

    switch (reportType) {
      case REPORT_TYPES.SPECIALTY:
        pdfBlob = await generateSpecialtyPDF(reportData, filters);
        break;
      case REPORT_TYPES.DOCTOR:
        pdfBlob = await generateDoctorPDF(reportData, filters);
        break;
      case REPORT_TYPES.MEDICAL_CENTER:
        pdfBlob = await generateMedicalCenterPDF(reportData, filters);
        break;
      case REPORT_TYPES.MONTHLY:
        pdfBlob = await generateMonthlyPDF(reportData, filters);
        break;
      default:
        throw new Error(`Tipo de reporte no soportado para PDF: ${reportType}`);
    }
    
    const filename = generateFilename(reportType, 'pdf');

    // Crea un enlace temporal y lo usa para descargar el archivo
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpieza
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return {
      success: true,
      filename
    };
  },

  /**
   * Exporta el reporte en un formato específico
   */
  exportReport: async (reportType, reportData, filters, format = EXPORT_FORMATS.PDF) => {
    if (format === EXPORT_FORMATS.PDF) {
      return await reportsService.generatePDF(reportType, reportData, filters);
    }

    // Para otros formatos, implementar lógica de exportación o llamar al backend
    throw new Error(`Formato de exportación no implementado: ${format}`);
  }
,

  /**
   * Llama al backend para generar el reporte (binary) y fuerza la descarga.
   * Expects a ReportRequest-like object: { reportType, exportFormat, filterId, startDate, endDate, month }
   */
  generateReport: async (reportRequest) => {
    // Map and sanitize request keys
    const payload = { ...reportRequest };

    // Request the binary from backend
    const response = await api.post(`${REPORTS_BASE_URL}/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer'
    });

    // Try to get filename from Content-Disposition
    const disposition = response.headers && response.headers['content-disposition'];
    let filename = 'report';
    if (disposition) {
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^\";]+)"?/.exec(disposition);
      if (match) {
        filename = decodeURIComponent(match[1] || match[2]);
      }
    } else {
      // fallback build name
      filename = `report-${(new Date()).toISOString().slice(0,19).replace(/[:T]/g,'_')}.${(payload.exportFormat||'pdf').toLowerCase()}`;
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  }
};

export default reportsService;