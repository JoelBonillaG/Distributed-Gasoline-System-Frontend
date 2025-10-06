// pdf/utils.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PDF_STYLES } from './styles.js';

export const PDFUtils = {
  addHeader(doc, title, subtitle = null) {
    const { margin, header } = PDF_STYLES.spacing;
    
    doc.setDrawColor(...PDF_STYLES.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, header - 5, 210 - margin, header - 5);

    doc.setFont(PDF_STYLES.fonts.title.font, PDF_STYLES.fonts.title.style);
    doc.setFontSize(PDF_STYLES.fonts.title.size);
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.text('HOSPITAL MANAGEMENT SYSTEM', margin, header - 10);

    if (subtitle) {
      doc.setFontSize(PDF_STYLES.fonts.subtitle.size);
      doc.text(subtitle, margin, header - 2);
    }

    doc.setLineWidth(0.2);
    doc.line(margin, header + 2, 210 - margin, header + 2);
  },

  addReportInfo(doc, filters, yPosition) {
    const { margin } = PDF_STYLES.spacing;
    let currentY = yPosition;
    
    doc.setFontSize(PDF_STYLES.fonts.small.size);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_STYLES.colors.secondary);

    const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm:ss", { locale: es });
    doc.text(`Generado el: ${currentDate}`, margin, currentY);

    const reportTypes = {
      'specialty': 'Consultas por Especialidad',
      'doctor': 'Consultas por Médico',
      'medical-center': 'Consultas por Centro Médico',
      'monthly': 'Estadísticas Mensuales'
    };
    
    currentY += 4;
    doc.text(`Tipo de Reporte: ${reportTypes[filters.reportType] || filters.reportType}`, margin, currentY);

    const activeFilters = [];
    
    if (filters.startDate && filters.endDate) {
      activeFilters.push(`Periodo: ${this.formatDateRange(filters.startDate, filters.endDate)}`);
    }
    
    if (filters.specialty) {
      activeFilters.push(`Especialidad: ${filters.specialty}`);
    }
    
    if (filters.doctor) {
      activeFilters.push(`Médico: ${filters.doctor}`);
    }
    
    if (filters.medicalCenter) {
      activeFilters.push(`Centro Médico: ${filters.medicalCenter}`);
    }

    if (activeFilters.length > 0) {
      currentY += 4;
      doc.text(`Filtros aplicados: ${activeFilters.join(' | ')}`, margin, currentY);
    }

    return currentY + 6;
  },

  addExecutiveSummary(doc, metrics, yPosition) {
    const { margin } = PDF_STYLES.spacing;
    const startY = yPosition;
    
    doc.setFontSize(PDF_STYLES.fonts.section.size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_STYLES.colors.primary);
    doc.text('RESUMEN EJECUTIVO', margin, startY);
    
    doc.setDrawColor(...PDF_STYLES.colors.mediumGray);
    doc.setLineWidth(0.3);
    doc.line(margin, startY + 1, 60, startY + 1);
    
    let currentY = startY + 8;
    doc.setFontSize(PDF_STYLES.fonts.small.size);
    
    // metrics es un array de { label, value }
    const half = Math.ceil(metrics.length / 2);
    
    metrics.forEach((metric, index) => {
      const col = index < half ? 0 : 1;
      const row = index < half ? index : index - half;
      
      const x = margin + (col * 90);
      const y = currentY + (row * 12);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_STYLES.colors.secondary);
      doc.text(metric.label, x, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_STYLES.colors.primary);
      doc.text(metric.value, x + 40, y);
    });
    
    return currentY + (half * 12) + 10;
  },

  addFooter(doc, pageNumber, totalPages) {
    const { margin } = PDF_STYLES.spacing;
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    doc.text(`Hospital Management System - Confidencial`, margin, pageHeight - 10);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageSize.width - margin, pageHeight - 10, { align: 'right' });
  },

  formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return 'Periodo completo';

    // Convertir las cadenas a objetos Date si es necesario
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
  },

  formatPercentage(value) {
    return `${Number(value).toFixed(1)}%`;
  }
};