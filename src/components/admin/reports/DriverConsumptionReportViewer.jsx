import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { FileDown, Loader2 } from "lucide-react";
import DriverConsumptionReportPDF from "./DriverConsumptionReportPDF";

export default function DriverConsumptionReportViewer({
  reportData,
  startDate,
  endDate,
  open,
  onOpenChange,
}) {
  if (!reportData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[98vw] w-[98vw] h-[95vh] p-0 flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Vista Previa del Reporte PDF - Consumo por Chofer
            </DialogTitle>
            <PDFDownloadLink
              document={
                <DriverConsumptionReportPDF
                  reportData={reportData}
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={`reporte-choferes-${startDate}-${endDate}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" />
                      Descargar PDF
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6 min-h-0">
          <div
            className="w-full h-full border border-border rounded-md overflow-hidden"
            style={{ minHeight: "600px" }}
          >
            <PDFViewer width="100%" height="100%">
              <DriverConsumptionReportPDF
                reportData={reportData}
                startDate={startDate}
                endDate={endDate}
              />
            </PDFViewer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

