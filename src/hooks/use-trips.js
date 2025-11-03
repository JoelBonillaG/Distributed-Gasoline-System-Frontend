import {
  addTrip,
  calculateTripMetrics,
  finishTrip,
  getAllTrips,
  getAssignableDrivers,
  getAssignableSupervisors,
  getAssignableVehicles,
  getTrip,
  reviewTrip,
  startTrip,
  updateTrip,
  updateTripLocation,
} from "@/services/trips.service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Obtener todos los viajes segmentados por estado
 * @param {string} status - Filtro opcional por estado
 * @param {string} driverId - Filtro opcional por ID de conductor
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useAllTrips = (status = null, driverId = null) =>
  useQuery({
    queryKey: ["trips", status, driverId],
    queryFn: () => getAllTrips(status, driverId),
    staleTime: 0, // Siempre considerar los datos como obsoletos para refrescar al volver
    refetchOnMount: true, // Refrescar cuando se monta el componente
    refetchOnWindowFocus: true, // Refrescar cuando se vuelve a la ventana
  });

/**
 * Obtener un viaje específico por ID
 * @param {string} id - ID del viaje
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useTrip = (id) =>
  useQuery({
    queryKey: ["trips", id],
    queryFn: () => getTrip(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

/**
 * Hook para crear un nuevo viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useAddTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addTrip,
    onSuccess: () => {
      // Invalidar todas las queries de trips para forzar refetch
      qc.invalidateQueries({ queryKey: ["trips"] });
      // También forzar refetch inmediato
      qc.refetchQueries({ queryKey: ["trips"] });
    },
  });
};

/**
 * Hook para actualizar un viaje existente
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useUpdateTrip = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateTrip(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trips", id] });
    },
  });
};

/**
 * Hook para iniciar un viaje
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useStartTrip = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => startTrip(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trips", id] });
    },
  });
};

/**
 * Hook para finalizar un viaje
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useFinishTrip = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => finishTrip(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trips", id] });
    },
  });
};

/**
 * Hook para revisar un viaje
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useReviewTrip = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => reviewTrip(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trips", id] });
    },
  });
};

/**
 * Hook para actualizar ubicación de un viaje
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useUpdateTripLocation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => updateTripLocation(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips", id] });
    },
  });
};

/**
 * Hook para calcular métricas de un viaje
 * @param {string} id - ID del viaje
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useCalculateTripMetrics = (id) => {
  return useMutation({
    mutationFn: (body) => calculateTripMetrics(id, body),
    // No invalidate queries porque es solo una previsualización
  });
};

/**
 * Hook para obtener conductores asignables
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useAssignableDrivers = () =>
  useQuery({
    queryKey: ["assignable-drivers"],
    queryFn: getAssignableDrivers,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

/**
 * Hook para obtener vehículos asignables
 * @param {Object} filters - Filtros opcionales
 * @param {string[]} filters.driverLicenseTypeCodes - Códigos de licencia del conductor
 * @param {string} filters.routeVehicleType - Tipo de vehículo de la ruta
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useAssignableVehicles = (filters = {}) => {
  const hasFilters = !!(filters.driverLicenseTypeCodes?.length || filters.routeVehicleType);
  
  return useQuery({
    queryKey: ["assignable-vehicles", filters.driverLicenseTypeCodes, filters.routeVehicleType],
    queryFn: () => getAssignableVehicles(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: hasFilters, // Solo ejecutar cuando hay filtros (conductor y ruta seleccionados)
  });
};

/**
 * Hook para obtener supervisores asignables
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useAssignableSupervisors = () =>
  useQuery({
    queryKey: ["assignable-supervisors"],
    queryFn: getAssignableSupervisors,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

