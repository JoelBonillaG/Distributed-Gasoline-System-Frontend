import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserId, getUserCenterId } from "@/utils/auth";
import { useDoctorByUser } from "@/hooks/useDoctors";
import {
  useCreateMedicalConsultation,
  useUpdateMedicalConsultation,
  useMedicalConsultation,
} from "@/hooks/useConsultations";
import { useAllPatients } from "@/hooks/usePatient";
import { useCenter } from "@/hooks/useMedicalCenters";
import { Button } from "@/components/ui/shadcn/button";
import { PageHeading } from "@/components/ui/typography/Heading";
import ConsultationForm from "@/components/consultations/ConsultationForm";
import { toast } from "sonner";

export default function MedicalConsultationFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId, mode } = location.state || {};
  const readOnly = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create" || (!isEdit && !readOnly);

  const [serverErrors, setServerErrors] = useState({});
  const [editData, setEditData] = useState(null);

  const createMut = useCreateMedicalConsultation();
  const updateMut = useUpdateMedicalConsultation(consultationId);

  const userId = getUserId();
  const centerId = getUserCenterId();

  const { data: doctorData } = useDoctorByUser(userId);
  const doctorId = doctorData?.data?.id;
  const doctorName = doctorData
    ? `${doctorData.data.firstName} ${doctorData.data.lastName}`
    : "";

  const { data: centerData } = useCenter(centerId);
  const centerName = centerData?.data?.name ?? "";

  const { data: patients } = useAllPatients(centerId);

  const { data: consultationData, isLoading: consultationLoading } =
    useMedicalConsultation(consultationId, { enabled: !!consultationId });

  useEffect(() => {
    if (consultationData?.data) {
      setEditData(consultationData.data);
    }
  }, [consultationData]);

  const handleSave = async (formData) => {
    try {
      setServerErrors({});
      const payload = {
        patientId: formData.patientId,
        doctorId,
        doctorName,
        centerId,
        centerName,
        date: formData.date,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        notes: formData.notes,
      };

      if (isEdit) {
        await updateMut.mutateAsync(payload);
        toast.success("Consulta médica actualizada");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Consulta médica creada");
      }

      navigate(-1);
    } catch (e) {
      setServerErrors(e?.data?.errors ?? {});
      toast.error(e?.data?.detail || "Error al guardar la consulta médica");
    }
  };

  if (
    (isEdit && (consultationLoading || !editData)) ||
    !patients ||
    patients.length === 0
  ) {
    return <p className="p-6 text-center">Cargando consulta médica...</p>;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full min-w-0">
      <PageHeading
        title={
          isCreate
            ? "Crear consulta médica"
            : readOnly
            ? "Ver consulta médica"
            : "Editar consulta médica"
        }
        subtitle={
          isCreate
            ? "Llena los datos para crear la consulta médica"
            : readOnly
            ? "Detalle de la consulta médica"
            : "Actualiza los datos de la consulta médica"
        }
      />

      <ConsultationForm
        defaultValues={
          isCreate
            ? { doctorId, doctorName, centerId, centerName }
            : editData
        }
        onSubmit={handleSave}
        serverErrors={serverErrors}
        readOnly={readOnly}
        patients={patients || []}
        isCreate={isCreate}
        formId="consultation-form"
      />

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" form="consultation-form">
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}
