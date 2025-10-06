import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import patients, { listAllPatients } from "@/services/patients.service";

export const usePatientsPage = (params) =>
  useQuery({
    queryKey: ["patients", params],
    queryFn: () => patients.listPatients(params),
    keepPreviousData: true,
  });

export const usePatient = (id) =>
  useQuery({
    queryKey: ["patient", id],
    queryFn: () => patients.getPatient(id),
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => patients.createPatient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useUpdatePatient = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => patients.updatePatient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
    },
  });
};

export const useDeletePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => patients.deletePatient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useAllPatients = (centerId, options = {}) =>
  useQuery({
    queryKey: ["patients", "all", centerId],
    queryFn: () => listAllPatients(centerId),
    enabled: !!centerId, 
    ...options,
  });