import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import doctors from "@/services/doctors.service";

export const useDoctorsPage = (params) =>
    useQuery({
        queryKey: ["doctors", params],
        queryFn: () => doctors.listDoctors(params),
        keepPreviousData: true,
    });

export const useDoctor = (id, options = {}) =>
    useQuery({
        queryKey: ["doctor", id],
        queryFn: () => doctors.getDoctor(id),
        enabled: !!id,
        ...options,
    });

export const useDoctorByUser = (userId, options = {}) =>
    useQuery({
        queryKey: ["doctor-by-user", userId],
        queryFn: () => doctors.getDoctorByUser(userId),
        enabled: !!userId,
        ...options,
    });    

export const useDoctorsBySpecialty = (specialtyId, params, options = {}) =>
    useQuery({
        queryKey: ["doctors-by-specialty", specialtyId, params],
        queryFn: () => doctors.listDoctorsBySpecialty(specialtyId, params),
        enabled: !!specialtyId,
        keepPreviousData: true,
        ...options,
    });

export const useCreateDoctor = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => doctors.createDoctor(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["doctors"] });
            qc.invalidateQueries({ queryKey: ["doctors-all"] });
        },
    });
};

export const useRegisterDoctor = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => doctors.registerDoctor(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["doctors"] });
            qc.invalidateQueries({ queryKey: ["doctors-all"] });
        },
    });
};

export const useUpdateDoctor = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => doctors.updateDoctor(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["doctors"] });
            qc.invalidateQueries({ queryKey: ["doctor", id] });
            qc.invalidateQueries({ queryKey: ["doctors-all"] });
        },
    });
};

export const useDeleteDoctor = (id) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => doctors.deleteDoctor(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["doctors"] });
            qc.invalidateQueries({ queryKey: ["doctors-all"] });
        },
    });
};
