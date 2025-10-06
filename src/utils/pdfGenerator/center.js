import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PDFUtils } from './utils';
import { PDF_STYLES } from './styles';

/**
 * Genera un PDF para el reporte de centros médicos
 * @param {Object} reportData Datos del reporte de centro médico
 * @param {Object} filters Filtros aplicados
 * @returns {Blob} PDF generado
 */
export const generateMedicalCenterPDF = async (reportData, filters) => {
  const doc = new jsPDF();
  const { margin, header } = PDF_STYLES.spacing;
  let currentY = header + 10;

  // Añadir encabezado y título
  PDFUtils.addHeader(doc, 'Reporte de Centros Médicos', 'Análisis de actividad por centro médico');

  // Información del reporte y filtros
  currentY = PDFUtils.addReportInfo(doc, filters, currentY);
  currentY += 10;

  // Resumen ejecutivo
  if (reportData.executiveSummary) {
    const summary = reportData.executiveSummary;

    const summaryMetrics = [
      { label: 'Total Consultas:', value: summary.totalConsultations.toString() },
      { label: 'Centros Distintos:', value: summary.uniqueCenters.toString() },
      { label: 'Fecha Inicio:', value: summary.dateRangeStart ? new Date(summary.dateRangeStart).toLocaleDateString() : 'N/A' },
      { label: 'Fecha Fin:', value: summary.dateRangeEnd ? new Date(summary.dateRangeEnd).toLocaleDateString() : 'N/A' },
      { label: 'Reporte Generado:', value: new Date(summary.reportGeneratedAt).toLocaleString() }
    ];

    currentY = PDFUtils.addExecutiveSummary(doc, summaryMetrics, currentY);
  }

  // Estadísticas por centro médico
  if (reportData.centerStatistics && reportData.centerStatistics.length > 0) {
    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Actividad por Centro Médico', margin, currentY);
    currentY += 8;

    const tableData = reportData.centerStatistics.map(stat => [
      stat.centerName,
      stat.totalConsultations,
      stat.uniqueDoctors,
      stat.uniquePatients,
      stat.consultationsPerDoctor.toFixed(2),
      `${stat.marketShare}%`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Centro Médico', 'Consultas', 'Médicos', 'Pacientes', 'Cons./Médico', '% Mercado']],
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

  // Distribución semanal
  if (reportData.weeklyDistribution) {
    // Verificar si necesitamos una nueva página
    if (currentY > 240) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte de Centros Médicos', 'Distribución semanal');
    }

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Distribución Semanal de Actividad', margin, currentY);
    currentY += 8;

    const weeklyData = Object.entries(reportData.weeklyDistribution).map(([day, count]) => [
      day,
      count,
      `${count > 0 && reportData.executiveSummary.totalConsultations > 0 ?
        ((count / reportData.executiveSummary.totalConsultations) * 100).toFixed(1) : 0}%`
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

  // KPIs - Indicadores de rendimiento
  if (reportData.kpis) {
    // Verificar si necesitamos una nueva página
    if (currentY > 240) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte de Centros Médicos', 'Indicadores de rendimiento');
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
      ['Promedio Consultas por Médico', reportData.kpis.avgConsultationsPerDoctor.toFixed(2)]
    ];

    // Agregar métricas adicionales si existen
    if (reportData.kpis.additionalMetrics) {
      const { additionalMetrics } = reportData.kpis;
      if (additionalMetrics.busiestCenterConsultations) {
        kpisData.push(['Consultas en Centro más Activo', additionalMetrics.busiestCenterConsultations]);
      }
      if (additionalMetrics.centerUtilizationRate) {
        kpisData.push(['Tasa de Utilización (%)', `${additionalMetrics.centerUtilizationRate}%`]);
      }
    }

    // Métricas de calidad de datos
    if (reportData.kpis.dataQuality) {
      kpisData.push(
        ['Consultas con Diagnóstico', reportData.kpis.dataQuality.consultationsWithDiagnosis],
        ['Consultas con Tratamiento', reportData.kpis.dataQuality.consultationsWithTreatment],
        ['Completitud de Datos (%)', `${reportData.kpis.dataQuality.dataCompletenessPercentage}%`]
      );
    }

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

  // Consultas detalladas
  if (reportData.detailedConsultations && reportData.detailedConsultations.length > 0) {
    // Siempre agregar una nueva página para las consultas detalladas
    doc.addPage();
    currentY = header + 10;
    PDFUtils.addHeader(doc, 'Reporte de Centros Médicos', 'Detalle de consultas por centro');

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Consultas Detalladas', margin, currentY);
    currentY += 8;

    const tableData = reportData.detailedConsultations.map(cons => [
      cons.consultationDate ? new Date(cons.consultationDate).toLocaleDateString() : 'N/A',
      cons.centerName,
      cons.doctorName,
      cons.patientName,
      cons.specialty || 'N/A',
      cons.diagnosis || 'N/A'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Fecha', 'Centro', 'Médico', 'Paciente', 'Especialidad', 'Diagnóstico']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7, // Tamaño más pequeño para esta tabla que tiene más columnas
        cellPadding: 2
      },
      columnStyles: {
        5: { cellWidth: 40 } // Diagnóstico
      },
      margin: { left: margin, right: margin }
    });
  }

  // Pie de página en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    PDFUtils.addFooter(doc, i, pageCount);
  }

  return doc.output('blob');
};
