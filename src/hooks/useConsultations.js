import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import consultations from "@/services/consultations.service";

// Paginación de consultas médicas por doctor
export const useMedicalConsultationsPage = (params) =>
  useQuery({
    queryKey: ["consultations", params],
    queryFn: () => consultations.listMedicalConsultations(params),
    keepPreviousData: true,
  });

// Consulta médica individual por ID
export const useMedicalConsultation = (id, options = {}) =>
  useQuery({
    queryKey: ["consultation", id],
    queryFn: () => consultations.getMedicalConsultation(id),
    enabled: !!id,
    ...options,
  });

// Crear consulta médica
export const useCreateMedicalConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => consultations.createMedicalConsultation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultations"] }),
  });
};

// Actualizar consulta médica
export const useUpdateMedicalConsultation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => consultations.updateMedicalConsultation(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["consultation", id] });
    },
  });
};

// Eliminar consulta médica
export const useDeleteMedicalConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => consultations.deleteMedicalConsultation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultations"] }),
  });
};
