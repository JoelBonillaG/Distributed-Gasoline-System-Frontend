import {
  addRoute,
  deleteRoute,
  getAllRoutes,
  getRoute,
  updateRoute,
} from "@/services/routes.service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Obtener todas las rutas
 * @param {string} vehicleType - Filtro opcional por tipo de vehículo
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useAllRoutes = (vehicleType = null) =>
  useQuery({
    queryKey: ["routes", vehicleType],
    queryFn: () => getAllRoutes(vehicleType),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Obtener una ruta específica por ID
 * @param {string} id - ID de la ruta
 * @returns {Object} Query result con data, isLoading, error, etc.
 */
export const useRoute = (id) =>
  useQuery({
    queryKey: ["routes", id],
    queryFn: () => getRoute(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

/**
 * Hook para crear una nueva ruta
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useAddRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addRoute,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

/**
 * Hook para actualizar una ruta existente
 * @param {string} id - ID de la ruta
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useUpdateRoute = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateRoute(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
      qc.invalidateQueries({ queryKey: ["routes", id] });
    },
  });
};

/**
 * Hook para eliminar una ruta
 * @returns {Object} Mutation result con mutate, mutateAsync, isLoading, etc.
 */
export const useDeleteRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

