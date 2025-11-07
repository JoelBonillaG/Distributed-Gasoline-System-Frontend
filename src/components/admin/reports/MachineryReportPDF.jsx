import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MachineryReportPDF({ reportData, startDate, endDate }) {
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 12,
      fontFamily: "Helvetica",
      color: "#1e293b",
      backgroundColor: "#ffffff",
    },
    header: {
      fontSize: 20,
      marginBottom: 12,
      fontWeight: "bold",
      color: "#22c55e", // Verde esmeralda
    },
    subtitle: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 8,
    },
    line: {
      borderBottomWidth: 1,
      borderBottomColor: "#22c55e",
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#22c55e",
      marginBottom: 6,
      marginTop: 12,
    },
    sectionLine: {
      borderBottomWidth: 1,
      borderBottomColor: "#22c55e",
      marginBottom: 8,
    },
    kpiItem: {
      marginBottom: 4,
      fontSize: 11,
    },
    kpiLabel: {
      fontWeight: "normal",
      color: "#1e293b",
    },
    kpiValue: {
      fontWeight: "bold",
      color: "#1e293b",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#22c55e",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#16a34a",
      paddingVertical: 6,
      marginTop: 8,
    },
    tableHeaderText: {
      flex: 1,
      textAlign: "center",
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#e2e8f0",
      paddingVertical: 5,
      backgroundColor: "#ffffff",
    },
    tableCell: {
      flex: 1,
      textAlign: "center",
      fontSize: 9,
      color: "#1e293b",
    },
    tableCellType: {
      flex: 2,
      textAlign: "left",
      fontSize: 9,
      fontWeight: "bold",
      color: "#1e293b",
      paddingLeft: 8,
    },
    differencePositive: {
      color: "#ef4444", // Rojo para sobreconsumo
      fontWeight: "bold",
    },
    differenceNegative: {
      color: "#22c55e", // Verde para ahorro
      fontWeight: "bold",
    },
    placeholderSection: {
      marginTop: 20,
      padding: 10,
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderStyle: "dashed",
      borderRadius: 4,
    },
    placeholderText: {
      fontSize: 10,
      color: "#64748b",
      fontStyle: "italic",
      textAlign: "center",
    },
  });

  // Mapear tipos de maquinaria
  const typeMap = {
    LIVIANO: "Liviana",
    PESADO: "Pesada",
    CUALQUIERA: "Cualquiera",
  };

  // Calcular sobrecosto
  const pricePerLiter = 1;
  const overcost =
    ((reportData.totalActual || 0) - (reportData.totalEstimated || 0)) *
    pricePerLiter;

  // Formatear fecha en formato ISO 8601 (YYYY-MM-DD)
  const generatedDate = reportData.generatedAt
    ? format(new Date(reportData.generatedAt), "yyyy-MM-dd", { locale: es })
    : format(new Date(), "yyyy-MM-dd", { locale: es });

  const periodText = reportData.period || `${startDate} - ${endDate}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <Text style={styles.header}>
          Reporte de Consumo por Tipo de Maquinaria
        </Text>
        <View style={styles.line} />

        {/* Información del período */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subtitle}>Periodo: {periodText}</Text>
          <Text style={styles.subtitle}>Generado: {generatedDate}</Text>
        </View>

        <View style={styles.line} />

        {/* KPI PRINCIPALES */}
        <Text style={styles.sectionTitle}>KPI PRINCIPALES:</Text>
        <View style={styles.sectionLine} />

        <View style={{ marginBottom: 8 }}>
          <Text style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>• Total de Viajes: </Text>
            <Text style={styles.kpiValue}>{reportData.totalTrips || 0}</Text>
          </Text>
          <Text style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>• Consumo Estimado: </Text>
            <Text style={styles.kpiValue}>
              {(reportData.totalEstimated || 0).toLocaleString("es-ES", {
                maximumFractionDigits: 2,
              })}{" "}
              L
            </Text>
          </Text>
          <Text style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>• Consumo Real: </Text>
            <Text style={styles.kpiValue}>
              {(reportData.totalActual || 0).toLocaleString("es-ES", {
                maximumFractionDigits: 2,
              })}{" "}
              L
            </Text>
          </Text>
          <Text style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>• Eficiencia Global: </Text>
            <Text style={styles.kpiValue}>
              {(reportData.globalEfficiency || 0).toFixed(1)}%
            </Text>
          </Text>
        </View>

        {/* RESUMEN COMPARATIVO */}
        <Text style={styles.sectionTitle}>RESUMEN COMPARATIVO:</Text>
        <View style={styles.sectionLine} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Tipo</Text>
          <Text style={styles.tableHeaderText}>Viajes</Text>
          <Text style={styles.tableHeaderText}>Est. (L)</Text>
          <Text style={styles.tableHeaderText}>Real (L)</Text>
          <Text style={styles.tableHeaderText}>Dif. (L)</Text>
          <Text style={styles.tableHeaderText}>Efic. (%)</Text>
        </View>

        {reportData.machineryTypes &&
          reportData.machineryTypes.map((m) => {
            const difference = m.difference || 0;
            const diffStyle =
              difference > 0
                ? styles.differencePositive
                : styles.differenceNegative;

            return (
              <View style={styles.tableRow} key={m.type}>
                <Text style={styles.tableCellType}>
                  {typeMap[m.type] || m.type}
                </Text>
                <Text style={styles.tableCell}>{m.trips || 0}</Text>
                <Text style={styles.tableCell}>
                  {(m.estimated || 0).toFixed(2)}
                </Text>
                <Text style={styles.tableCell}>
                  {(m.actual || 0).toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, diffStyle]}>
                  {difference >= 0 ? "+" : ""}
                  {difference.toFixed(2)}
                </Text>
                <Text style={styles.tableCell}>
                  {(m.efficiency || 0).toFixed(1)}%
                </Text>
              </View>
            );
          })}
      </Page>
    </Document>
  );
}
