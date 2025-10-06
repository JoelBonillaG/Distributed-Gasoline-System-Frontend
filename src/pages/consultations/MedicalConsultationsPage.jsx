import React, { useState, useCallback } from "react";
import { getUserCenterId, getUserId } from "@/utils/auth";
import { useDoctorByUser } from "@/hooks/useDoctors";
import {
    useMedicalConsultationsPage,
    useDeleteMedicalConsultation,
} from "@/hooks/useConsultations";
import { Button } from "@/components/ui/shadcn/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/shadcn/alert-dialog";
import DataTable from "@/components/ui/table/data-table-pb";
import { Plus, Pencil, Trash2, Eye, ClipboardList } from "lucide-react";
import { PageHeading } from "@/components/ui/typography/Heading";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCenter } from "@/hooks/useMedicalCenters";



export default function MedicalConsultationsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [consultationToDelete, setConsultationToDelete] = useState(null);

    const userId = getUserId();
    const { data: doctorData } = useDoctorByUser(userId);
    const doctorId = doctorData?.data?.id;
    const centerId = getUserCenterId();

    const { data, isLoading, refetch } = useMedicalConsultationsPage({
        doctorId,
        page,
        size: pageSize,
    });

    const { data: centerData } = useCenter(centerId);
    const centers = centerData ? [centerData.data] : []; // (si lo usas luego)
    const consultations = data?.content ?? [];
    const totalPages = data?.totalPages ?? 1;
    const totalRows = data?.totalElements ?? 0;

    const deleteMut = useDeleteMedicalConsultation();

    const resetModalStates = useCallback(() => {
        setConsultationToDelete(null);
    }, []);

    const truncateText = (text, maxLength = 20) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "…" : text;
    };

    const columns = [
        { accessorKey: "id", header: "ID", cell: ({ row }) => row.original.id },
        {
            accessorKey: "patient",
            header: "Paciente",
            cell: ({ row }) =>
                `${row.original.patient.firstName} ${row.original.patient.lastName}`,
        },
        {
            accessorKey: "date",
            header: "Fecha",
            cell: ({ row }) =>
                new Date(row.original.date).toLocaleDateString("es-EC"),
        },
        {
            accessorKey: "diagnosis",
            header: "Diagnóstico",
            cell: ({ row }) => truncateText(row.original.diagnosis),
        },
        {
            accessorKey: "treatment",
            header: "Tratamiento",
            cell: ({ row }) => truncateText(row.original.treatment),
        },
        {
            accessorKey: "notes",
            header: "Notas",
            cell: ({ row }) => truncateText(row.original.notes),
        },
    ];

    const rowActions = (row) => {
        const consultation = row.original;
        return (
            <div className="flex gap-1 justify-end">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                        navigate("/consultations/form", {
                            state: { consultationId: consultation.id, mode: "view" },
                        })
                    }
                    title="Ver"
                >
                    <Eye className="size-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                        navigate("/consultations/form", {
                            state: { consultationId: consultation.id, mode: "edit" },
                        })
                    }
                    title="Editar"
                >
                    <Pencil className="size-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        setConsultationToDelete(consultation);
                        setConfirmOpen(true);
                    }}
                    title="Eliminar"
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            </div>
        );
    };

    const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }) => {
        if (pageIndex !== page || newPageSize !== pageSize) {
            setPage(pageIndex);
            setPageSize(newPageSize);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <PageHeading
                title="Consultas Médicas"
                subtitle="Registra cada atención con precisión, y asegura una atención continua y confiable."
                icon={ClipboardList}
                actions={
                    <Button
                        onClick={() =>
                            navigate("/consultations/form", { state: { mode: "create" } })
                        }
                    >
                        <Plus className="mr-2 size-4" />
                        Nueva consulta
                    </Button>
                }
            />

            {/* Contenido en CARD: subtítulo + tabla (sin secciones) */}
            <div className="rounded-xl border bg-card">
                {/* Subtítulo tipo label */}
                <div className="px-4 pt-3">
                    <p className="text-sm font-medium text-muted-foreground">
                        Listado de consultas
                    </p>
                </div>

                {/* Tabla */}
                <div className="p-4 pt-1">
                    <DataTable
                        columns={columns}
                        data={consultations}
                        rowActions={rowActions}
                        manualPagination={true}
                        pageCount={totalPages}
                        totalRows={totalRows}
                        state={{ pagination: { pageIndex: page, pageSize: pageSize } }}
                        onPaginationChange={handlePaginationChange}
                        emptyMessage="Sin datos"
                        searchable={false}
                        loading={isLoading}
                    />
                </div>
            </div>

            {/* Modal Confirmar Eliminación */}
         {/* Modal Confirmar Eliminación */}
<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar consulta médica?</AlertDialogTitle>
      <AlertDialogDescription>
        {consultationToDelete ? (
          <>
            Esta acción eliminará la consulta del paciente{" "}
            <strong>
              {consultationToDelete.patient.firstName}{" "}
              {consultationToDelete.patient.lastName}
            </strong>{" "}
            con fecha{" "}
            <strong>
              {new Date(consultationToDelete.date).toLocaleDateString("es-EC")}
            </strong>.
          </>
        ) : (
          "Esta acción no se puede deshacer."
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (!consultationToDelete) return;
          try {
            await deleteMut.mutateAsync(consultationToDelete.id);
            toast.success("Consulta médica eliminada", {
              description: `ID ${consultationToDelete.id}`,
            });
            setConfirmOpen(false);
            resetModalStates();
            refetch();
          } catch (e) {
            toast.error(
              e?.data?.detail || "Error al eliminar la consulta médica"
            );
          }
        }}
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

        </div>
    );
}
