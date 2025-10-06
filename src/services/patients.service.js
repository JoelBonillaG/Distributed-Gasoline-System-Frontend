import api from "./api";

export const listPatients = async ({ centerId, page = 0, size = 10 }) => {
  const res = await api.get("/api/consulting/patients", { params: { centerId, page, size } });
  return res.data; // ya viene camelCase
};

export const getPatient = async (id) => {
  const res = await api.get(`/api/consulting/patients/${id}`);
  return { data: res.data };
};

export const createPatient = async (payload) => {
  const res = await api.post("/api/consulting/patients", payload);
  return { data: res.data };
};

export const updatePatient = async (id, payload) => {
  const res = await api.put(`/api/consulting/patients/${id}`, payload);
  return { data: res.data };
};

export const deletePatient = async (id) => {
  await api.delete(`/api/consulting/patients/${id}`);
  return true;
};

export const parseFieldErrors = (error) => {
  const errs = error?.data?.errors;
  return errs && typeof errs === "object" ? errs : {};
};

export const listAllPatients = async (centerId) => {
  const res = await api.get("/api/consulting/patients/all", { params: { centerId } });
  return res.data;
};

export default {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  parseFieldErrors,
  listAllPatients
};
