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
      qc.invalidateQueries({ queryKey: ["drivers", "inactive"] });
    },
  });
};

export const useInactiveDrivers = (options = {}) =>
  useQuery({
    queryKey: ["drivers", "inactive"],
    queryFn: () => driversService.getInactiveDrivers(),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const driversList = Array.isArray(data) ? data : data.drivers || [];
      return driversList;
    },
    ...options,
  });

export const useRestoreDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId) => driversService.restoreDriver(driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["drivers", "inactive"] });
    },
  });
};

export const useCreateLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, data }) => driversService.createLicense(driverId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["drivers", variables.driverId] });
    },
  });
};

export const useUpdateLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, licenseId, data }) => driversService.updateLicense(driverId, licenseId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["drivers", variables.driverId] });
    },
  });
};

export const useSuspendLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, licenseId }) => driversService.suspendLicense(driverId, licenseId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["drivers", variables.driverId] });
    },
  });
};

export const useReactivateLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, licenseId }) => driversService.reactivateLicense(driverId, licenseId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["drivers", variables.driverId] });
    },
  });
};
