import api from "./api";

export const licenseTypesService = {
  async findAll() {
    const response = await api.get('/license-types');
    return response.data;
  },

  async findOne(id) {
    const response = await api.get(`/license-types/${id}`);
    return response.data;
  },

  async findByCode(code) {
    const response = await api.get('/license-types/by-code', { params: { code } });
    return response.data;
  },

  async create(data) {
    const response = await api.post('/license-types', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/license-types/${id}`, data);
    return response.data;
  },

  async remove(id) {
    const response = await api.delete(`/license-types/${id}`);
    return response.data;
  },

  async addInclusion(parentId, childId) {
    const response = await api.post(`/license-types/${parentId}/includes`, { childId });
    return response.data;
  },

  async removeInclusion(parentId, childId) {
    const response = await api.delete(`/license-types/${parentId}/includes/${childId}`);
    return response.data;
  },

  async getClosure(id) {
    const response = await api.get(`/license-types/${id}/closure`);
    return response.data;
  },
};