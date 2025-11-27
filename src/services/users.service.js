import api from "./api";

// // Listado paginado de consultas médicas por doctor
// export const listMedicalConsultations = async ({ doctorId, page = 0, size = 10 }) => {
//   const res = await api.get("/api/consulting/medical-consultations", { params: { doctorId, page, size } });
//   return res.data; // ya viene camelCase
// };

export const getAllUsers = async () => {
  const res = await api.get("/users");
  const users = Array.isArray(res.data) ? [...res.data] : [];

  return users.sort((a, b) => {
    const aId = typeof a.userId === "number" ? a.userId : a.id ?? 0;
    const bId = typeof b.userId === "number" ? b.userId : b.id ?? 0;
    return aId - bId;
  });
};

export const getUser = async (id, includeInactive = false) => {
  const url = includeInactive 
    ? `/users/${id}?includeInactive=true`
    : `/users/${id}`;
  const res = await api.get(url);
  return res.data;
};

export const addUser= async(payload)=>{

    const res = await api.post("/users", payload);
    return res.data;
}

export const updateUser= async(id,payload)=>{
const res = await api.put(`/users/${id}`, payload);
return res.data;
}
export const deleteUser=async(id)=>{
  const res = await api.delete(`/users/${id}`);
  return res.data;
}

export const getInactiveUsers = async () => {
  const res = await api.get("/users/inactive");
  const users = Array.isArray(res.data) ? [...res.data] : [];

  return users.sort((a, b) => {
    const aId = typeof a.userId === "number" ? a.userId : a.id ?? 0;
    const bId = typeof b.userId === "number" ? b.userId : b.id ?? 0;
    return aId - bId;
  });
};

export const restoreUser = async (id) => {
  const res = await api.post(`/users/undelete/${id}`);
  return res.data;
};

export const parseFieldErrors = (error) => {
  const errs = error?.data?.errors;
  return errs && typeof errs === "object" ? errs : {};
};

export const getErrorDetail = (error, fallback = "Ha ocurrido un error") => {
  return (
    error?.data?.detail ||
    error?.message ||
    error?.data?.message ||
    fallback
  );
};
