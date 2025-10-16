import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import driversService from "@/services/drivers.service";

export const useAllDrivers = () =>
  useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversService.getDrivers(),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      // La API devuelve { drivers: [...], total: number }
      const driversList = Array.isArray(data) ? data : data.drivers || [];
      return driversList;
    },
  });

export const useDriver = (id) =>
  useQuery({
    queryKey: ["drivers", id],
    queryFn: () => driversService.getDriver(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

export const useCreateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => driversService.createDriver(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useUpdateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, payload }) => 
      driversService.updateDriver(driverId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["drivers", variables.driverId] });
    },
  });
};

export const useDeleteDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId) => driversService.deleteDriver(driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};
