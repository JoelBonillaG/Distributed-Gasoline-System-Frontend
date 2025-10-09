import api from "./api";

// // Listado paginado de consultas médicas por doctor
// export const listMedicalConsultations = async ({ doctorId, page = 0, size = 10 }) => {
//   const res = await api.get("/api/consulting/medical-consultations", { params: { doctorId, page, size } });
//   return res.data; // ya viene camelCase
// };

export const getAllUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

export const getUser = async (id) => {
  const res = await api.get(`/users/${id}`);
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

export const parseFieldErrors = (error) => {
  const errs = errors?.data?.errors;
  return errs && typeof errs === "object" ? errs : {};
};
