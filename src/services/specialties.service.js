import api from "./api";

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const toCamel = (obj) => {
    if (Array.isArray(obj)) return obj.map(toCamel);
    if (!isObj(obj)) return obj;
    return Object.keys(obj).reduce((acc, k) => {
        const c = k.replace(/_([a-z])/g, (_, g1) => g1.toUpperCase());
        acc[c] = toCamel(obj[k]);
        return acc;
    }, {});
};

const camelizePage = (page) => {
    if (!isObj(page)) return page;
    const c = toCamel(page);
    if (Array.isArray(c.content)) c.content = c.content.map(toCamel);
    return c;
};

export const listSpecialties = async ({ includeDeleted = false, page = 0, size = 10, sort } = {}) => {
    const params = { includeDeleted, page, size };
    if (sort) params.sort = sort;
    const res = await api.get("/admin/specialties", { params });
    return camelizePage(res.data); // => { content, totalElements, totalPages, ... }
};

export const listAllSpecialties = async ({ includeDeleted = false } = {}) => {
    const res = await api.get("/admin/specialties/all", { params: { includeDeleted } });
    return toCamel(res.data); // array simple
};

export const getSpecialty = async (id, { includeDeleted = false } = {}) => {
    const res = await api.get(`/admin/specialties/${id}`, { params: { includeDeleted } });
    return { data: toCamel(res.data) }; // mantenemos la forma { data }
};

export const createSpecialty = async (payload) => {
    const res = await api.post("/admin/specialties", payload);
    return { data: toCamel(res.data) };
};

export const updateSpecialty = async (id, payload) => {
    const res = await api.put(`/admin/specialties/${id}`, payload);
    return { data: toCamel(res.data) };
};

export const deleteSpecialty = async (id) => {
    await api.delete(`/admin/specialties/${id}`);
    return true;
};

export const parseFieldErrors = (error) => {
    const errs = error?.data?.errors; // ojo: axios error shape
    if (!errs || typeof errs !== "object") return {};
    return toCamel(errs);
};

export default {
    listSpecialties,
    listAllSpecialties,
    getSpecialty,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    parseFieldErrors,
};
