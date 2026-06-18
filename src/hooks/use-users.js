import {
  addUser,
  deleteUser,
  getAllUsers,
  getInactiveUsers,
  getUser,
  restoreUser,
  updateUser,
} from "@/services/users.service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const useAllUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    staleTime: 5 * 60 * 1000,
  });

export const useUser = (id) =>
  useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

export const useAddUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useInactiveUsers = (options = {}) =>
  useQuery({
    queryKey: ["users", "inactive"],
    queryFn: getInactiveUsers,
    staleTime: 5 * 60 * 1000,
    ...options,
  });

export const useRestoreUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => restoreUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "inactive"] });
    },
  });
};

export const useUpdateUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", id] });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};