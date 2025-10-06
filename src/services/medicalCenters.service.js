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

export const listCenters = async ({ includeDeleted = false, page = 0, size = 10, sort } = {}) => {
    const params = { includeDeleted, page, size };
    if (sort) params.sort = sort;
    const res = await api.get("/admin/centers", { params });
    return camelizePage(res.data);
};

export const listAllCenters = async ({ includeDeleted = false } = {}) => {
    try {
        const res = await api.get("/admin/centers/all", { params: { includeDeleted } });
        return toCamel(res.data); // array simple
    } catch (error) {
        console.error('Error fetching all medical centers:', error);
        return [];
    }
};

export const getCenter = async (id, { includeDeleted = false } = {}) => {
    const res = await api.get(`/admin/centers/${id}`, { params: { includeDeleted } });
    return { data: toCamel(res.data) }; // mantenemos la forma { data }
};

export const createCenter = async (payload) => {
    const res = await api.post("/admin/centers", payload);
    return { data: toCamel(res.data) };
};

export const updateCenter = async (id, payload) => {
    const res = await api.put(`/admin/centers/${id}`, payload);
    return { data: toCamel(res.data) };
};

export const deleteCenter = async (id) => {
    await api.delete(`/admin/centers/${id}`);
    return true;
};

export const parseFieldErrors = (error) => {
    const errs = error?.data?.errors;
    if (!errs || typeof errs !== "object") return {};
    return toCamel(errs);
};

export default {
    listCenters,
    listAllCenters,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    parseFieldErrors,
};
