import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PDFUtils } from './utils';
import { PDF_STYLES } from './styles';

/**
 * Genera un PDF para el reporte de especialidades
 * @param {Object} reportData Datos del reporte de especialidad
 * @param {Object} filters Filtros aplicados
 * @returns {Blob} PDF generado
 */
export const generateSpecialtyPDF = async (reportData, filters) => {
  const doc = new jsPDF();
  const { margin, header } = PDF_STYLES.spacing;
  let currentY = header + 10;

  // Añadir encabezado y título
  PDFUtils.addHeader(doc, 'Reporte de Especialidades Médicas', 'Análisis de consultas por especialidad');

  // Información del reporte y filtros
  currentY = PDFUtils.addReportInfo(doc, filters, currentY);
  currentY += 10;

  // Resumen ejecutivo
  if (reportData.executiveSummary) {
    const summary = reportData.executiveSummary;
    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Resumen Ejecutivo', margin, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_STYLES.colors.text);
    doc.setFontSize(PDF_STYLES.fonts.normal.size);

    const summaryData = [
      ['Total de Consultas', summary.totalConsultations || 0],
      ['Periodo Analizado', PDFUtils.formatDateRange(summary.dateRangeStart, summary.dateRangeEnd)]
    ];

    doc.autoTable({
      startY: currentY,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.small.size,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.previousAutoTable.finalY + 10;
  }

  // Estadísticas por especialidad
  if (reportData.specialtyStatistics && reportData.specialtyStatistics.length > 0) {
    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Estadísticas por Especialidad', margin, currentY);
    currentY += 8;

    const tableData = reportData.specialtyStatistics.map(stat => [
      stat.specialty,
      stat.totalConsultations,
      stat.uniqueDoctors,
      stat.uniquePatients,
      stat.avgConsultationsPerDoctor.toFixed(2)
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Especialidad', 'Total Consultas', 'Médicos', 'Pacientes', 'Prom. Consultas/Médico']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.small.size,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.previousAutoTable.finalY + 10;
  }

  // Médicos más activos
  if (reportData.topActiveDoctors && reportData.topActiveDoctors.length > 0) {
    // Verificar si necesitamos una nueva página
    if (currentY > 240) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte de Especialidades Médicas', 'Médicos más activos');
    }

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Médicos más Activos', margin, currentY);
    currentY += 8;

    const doctorsData = reportData.topActiveDoctors.map(doctor => [
      doctor.doctorName,
      doctor.totalConsultations,
      `${doctor.consultationShare}%`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Médico', 'Consultas', '% del Total']],
      body: doctorsData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.small.size,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.previousAutoTable.finalY + 10;
  }

  // Distribución semanal
  if (reportData.weeklyDistribution) {
    // Verificar si necesitamos una nueva página
    if (currentY > 240) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte de Especialidades Médicas', 'Distribución semanal');
    }

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Distribución Semanal', margin, currentY);
    currentY += 8;

    const weeklyData = Object.entries(reportData.weeklyDistribution).map(([day, count]) => [
      day,
      count,
      `${((count / reportData.executiveSummary.totalConsultations) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Día', 'Consultas', '% del Total']],
      body: weeklyData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.small.size,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.previousAutoTable.finalY + 10;
  }

  // KPIs
  if (reportData.kpis) {
    // Verificar si necesitamos una nueva página
    if (currentY > 240) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte de Especialidades Médicas', 'Indicadores clave');
    }

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Indicadores Clave de Rendimiento', margin, currentY);
    currentY += 8;

    const kpisData = [
      ['Especialidades Distintas', reportData.kpis.distinctSpecialties],
      ['Médicos Involucrados', reportData.kpis.doctorsInvolved],
      ['Centros Médicos', reportData.kpis.medicalCentersInvolved],
      ['Total Pacientes Únicos', reportData.kpis.uniquePatientsTotal],
      ['Promedio Consultas por Médico', reportData.kpis.avgConsultationsPerDoctor.toFixed(2)],
      ['Consultas con Diagnóstico', reportData.kpis.dataQuality.consultationsWithDiagnosis],
      ['Consultas con Tratamiento', reportData.kpis.dataQuality.consultationsWithTreatment],
      ['Completitud de Datos (%)', `${reportData.kpis.dataQuality.dataCompletenessPercentage}%`]
    ];

    doc.autoTable({
      startY: currentY,
      head: [['Indicador', 'Valor']],
      body: kpisData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.small.size,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.previousAutoTable.finalY + 10;
  }

  // Pie de página en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    PDFUtils.addFooter(doc, i, pageCount);
  }

  return doc.output('blob');
};
