import api from "./api";

// Listado paginado de consultas médicas por doctor
export const listMedicalConsultations = async ({ doctorId, page = 0, size = 10 }) => {
  const res = await api.get("/api/consulting/medical-consultations", { params: { doctorId, page, size } });
  return res.data; // ya viene camelCase
};

// Obtener una consulta por ID
export const getMedicalConsultation = async (id) => {
  const res = await api.get(`/api/consulting/medical-consultations/${id}`);
  return { data: res.data };
};

// Crear nueva consulta médica
export const createMedicalConsultation = async (payload) => {
  const res = await api.post("/api/consulting/medical-consultations", payload);
  return { data: res.data };
};

// Actualizar consulta médica
export const updateMedicalConsultation = async (id, payload) => {
  const res = await api.put(`/api/consulting/medical-consultations/${id}`, payload);
  return { data: res.data };
};

// Eliminar consulta médica
export const deleteMedicalConsultation = async (id) => {
  await api.delete(`/api/consulting/medical-consultations/${id}`);
  return true;
};

// Parsear errores de validación del backend
export const parseFieldErrors = (error) => {
  const errs = error?.data?.errors;
  return errs && typeof errs === "object" ? errs : {};
};

export default {
  listMedicalConsultations,
  getMedicalConsultation,
  createMedicalConsultation,
  updateMedicalConsultation,
  deleteMedicalConsultation,
  parseFieldErrors,
};
