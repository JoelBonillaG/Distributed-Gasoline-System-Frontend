import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PDFUtils } from './utils';
import { PDF_STYLES } from './styles';

/**
 * Genera un PDF para el reporte mensual de consultas
 * @param {Object} reportData Datos del reporte mensual
 * @param {Object} filters Filtros aplicados
 * @returns {Blob} PDF generado
 */
export const generateMonthlyPDF = async (reportData, filters) => {
  const doc = new jsPDF();
  const { margin, header } = PDF_STYLES.spacing;
  let currentY = header + 10;

  // Añadir encabezado y título
  PDFUtils.addHeader(doc, 'Reporte Mensual de Actividad', 'Análisis de tendencias mensuales');

  // Información del reporte y filtros
  currentY = PDFUtils.addReportInfo(doc, filters, currentY);
  currentY += 10;

  // Resumen ejecutivo
  if (reportData.executiveSummary) {
    const summary = reportData.executiveSummary;

    const summaryMetrics = [
      { label: 'Total Consultas:', value: summary.totalConsultations.toString() },
      { label: 'Meses Analizados:', value: summary.monthsAnalyzed.toString() },
      { label: 'Fecha Inicio:', value: summary.dateRangeStart ? new Date(summary.dateRangeStart).toLocaleDateString() : 'N/A' },
      { label: 'Fecha Fin:', value: summary.dateRangeEnd ? new Date(summary.dateRangeEnd).toLocaleDateString() : 'N/A' },
      { label: 'Reporte Generado:', value: new Date(summary.reportGeneratedAt).toLocaleString() }
    ];

    currentY = PDFUtils.addExecutiveSummary(doc, summaryMetrics, currentY);
  }

  // Estadísticas mensuales
  if (reportData.monthlyStatistics && reportData.monthlyStatistics.length > 0) {
    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Tendencias Mensuales', margin, currentY);
    currentY += 8;

    const tableData = reportData.monthlyStatistics.map(stat => [
      stat.period,
      stat.totalConsultations,
      stat.uniqueDoctors,
      stat.uniquePatients,
      stat.specialtyCount,
      `${stat.growth > 0 ? '+' : ''}${stat.growth}%`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Periodo', 'Consultas', 'Médicos', 'Pacientes', 'Especialidades', 'Crecimiento']],
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
      columnStyles: {
        5: { // Columna de crecimiento
          cellCallback: function(cell, data) {
            const value = parseFloat(cell.text[0].replace(/[^-0-9.]/g, ''));
            if (value > 0) {
              cell.styles.textColor = [0, 128, 0]; // Verde para crecimiento positivo
            } else if (value < 0) {
              cell.styles.textColor = [192, 0, 0]; // Rojo para crecimiento negativo
            }
          }
        }
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
      PDFUtils.addHeader(doc, 'Reporte Mensual de Actividad', 'Indicadores de rendimiento');
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
      if (additionalMetrics.monthsAnalyzed) {
        kpisData.push(['Meses Analizados', additionalMetrics.monthsAnalyzed]);
      }
      if (additionalMetrics.seasonalityPattern) {
        const patterns = {
          'SEASONAL_VARIATIONS': 'Variaciones Estacionales',
          'STABLE_PATTERN': 'Patrón Estable',
          'INSUFFICIENT_DATA': 'Datos Insuficientes'
        };
        kpisData.push(['Patrón de Estacionalidad', patterns[additionalMetrics.seasonalityPattern] || additionalMetrics.seasonalityPattern]);
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

  // Análisis de crecimiento mensual (gráfico textual)
  if (reportData.monthlyStatistics && reportData.monthlyStatistics.length > 2) {
    // Verificar si necesitamos una nueva página
    if (currentY > 220) {
      doc.addPage();
      currentY = header + 10;
      PDFUtils.addHeader(doc, 'Reporte Mensual de Actividad', 'Análisis de tendencia');
    }

    doc.setFont(PDF_STYLES.fonts.subtitle.font, 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
    doc.text('Análisis de Tendencia de Crecimiento', margin, currentY);
    currentY += 8;

    // Crear representación textual de la tendencia
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_STYLES.colors.text);
    doc.setFontSize(PDF_STYLES.fonts.normal.size);

    // Calcular estadísticas de crecimiento
    const growthValues = reportData.monthlyStatistics
      .filter(stat => stat.growth !== null && stat.growth !== undefined)
      .map(stat => stat.growth);

    if (growthValues.length > 0) {
      const avgGrowth = growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length;
      const maxGrowth = Math.max(...growthValues);
      const minGrowth = Math.min(...growthValues);

      doc.text([
        `• Crecimiento Promedio: ${avgGrowth.toFixed(1)}%`,
        `• Mayor Crecimiento: ${maxGrowth.toFixed(1)}%`,
        `• Menor Crecimiento: ${minGrowth.toFixed(1)}%`,
      ], margin, currentY, { lineHeightFactor: 1.5 });

      currentY += 25;

      // Determinar tendencia
      let trendMessage = '';
      if (avgGrowth > 5) {
        trendMessage = 'La tendencia general es de fuerte crecimiento en el volumen de consultas.';
      } else if (avgGrowth > 0) {
        trendMessage = 'La tendencia general es de crecimiento estable en el volumen de consultas.';
      } else if (avgGrowth > -5) {
        trendMessage = 'La tendencia general es de leve decrecimiento en el volumen de consultas.';
      } else {
        trendMessage = 'La tendencia general muestra una disminución significativa en el volumen de consultas.';
      }

      doc.text(trendMessage, margin, currentY);
      currentY += 10;

      // Recomendaciones basadas en tendencias
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendaciones:', margin, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'normal');
      if (avgGrowth > 0) {
        doc.text([
          '1. Asegurar disponibilidad de recursos para soportar el crecimiento continuo.',
          '2. Evaluar la capacidad instalada para satisfacer la demanda creciente.',
          '3. Identificar factores de éxito en los meses de mayor crecimiento.'
        ], margin + 5, currentY, { lineHeightFactor: 1.3 });
      } else {
        doc.text([
          '1. Investigar causas de la disminución en el volumen de consultas.',
          '2. Implementar estrategias para mejorar la captación de pacientes.',
          '3. Revisar la satisfacción de pacientes y médicos para identificar áreas de mejora.'
        ], margin + 5, currentY, { lineHeightFactor: 1.3 });
      }
    }
  }

  // Pie de página en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    PDFUtils.addFooter(doc, i, pageCount);
  }

  return doc.output('blob');
};
