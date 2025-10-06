import api from "./api"; // tu wrapper de fetch/axios

const employees = {
  async listEmployees({ page = 0, size = 10, includeDeleted = false }) {
    const res = await api.get("/auth/users", {
      params: {
        page,
        size,
        includeDeleted,
      },
    });
    return res.data;
  },

  async deleteEmployee(id, hard = false) {
    const res = await api.delete(`/auth/${id}`, {
      params: { hard },
    });
    return res.data;
  },

  async createEmployee(data) {
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      gender: data.gender,
      first_name: data.firstName,
      last_name: data.lastName,
      center_id: data.centerId,
      roles: [{ name: "ADMIN" }],
    };
    console.log("Payload", payload);

    const res = await api.post("/auth/register", payload);
    return res.data;
  },

  async updateEmployee(id, data) {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
    };

    const res = await api.put(`/auth/users/${id}`, payload);
    return res.data;
  },

  async updateProfile(id, data) {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
    };

    console.log("Sending", payload);
    console.log("Id", id);

    const res = await api.put(`/auth/users/${id}`, payload);
    console.log("Res", res);
    return res.data;
  },
};

export default employees;
