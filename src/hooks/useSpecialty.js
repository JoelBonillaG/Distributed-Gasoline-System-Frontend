import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import specialties from "@/services/specialties.service";

export const useSpecialtiesPage = (params) =>
    useQuery({
        queryKey: ["specialties", params],
        queryFn: () => specialties.listSpecialties(params),
        keepPreviousData: true,
    });

export const useCreateSpecialty = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => specialties.createSpecialty(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["specialties"] });
            qc.invalidateQueries({ queryKey: ["specialties-all"] });
        },
    });
};

export const useUpdateSpecialty = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => specialties.updateSpecialty(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["specialties"] });
            qc.invalidateQueries({ queryKey: ["specialty", id] });
            qc.invalidateQueries({ queryKey: ["specialties-all"] });
        },
    });
};

export const useDeleteSpecialty = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => specialties.deleteSpecialty(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["specialties"] });
            qc.invalidateQueries({ queryKey: ["specialties-all"] });
        },
    });
};
