import { addUser, getAllUsers } from "@/services/users.service";
import { useQuery } from "@tanstack/react-query";


export const useAllUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    staleTime: 5 * 60 * 1000,
  });


export const useUser = (id) => {
  useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    scaleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export const useAddUser = ()=>{
  const  qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>addUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })
}

export const useUpdatePatient = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => patients.updatePatient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}