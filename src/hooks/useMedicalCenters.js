import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import medicalCenters from "@/services/medicalCenters.service.js";

export const useCentersPage = (params) =>
    useQuery({
        queryKey: ["centers", params],
        queryFn: () => medicalCenters.listCenters(params),
        keepPreviousData: true,
    });

    export const useAllCenters = (params) =>
    useQuery({
        queryKey: ["centers-all", params],
        queryFn: () => medicalCenters.listAllCenters(params),
    });
    export const useCenter = (id, options = {}) => {
  return useQuery({
    queryKey: ["center", id, options],
    queryFn: () => medicalCenters.getCenter(id, options),
    enabled: !!id, 
  });
};

export const useCreateCenter = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => medicalCenters.createCenter(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["centers"] });
            qc.invalidateQueries({ queryKey: ["centers-all"] });
        },
    });
};

export const useUpdateCenter = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => medicalCenters.updateCenter(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["centers"] });
            qc.invalidateQueries({ queryKey: ["center", id] });
            qc.invalidateQueries({ queryKey: ["centers-all"] });
        },
    });
};

export const useDeleteCenter = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => medicalCenters.deleteCenter(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["centers"] });
            qc.invalidateQueries({ queryKey: ["centers-all"] });
        },
    });
};
