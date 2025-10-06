import api from "./api";
import { clearTokens, setAccessToken } from "@/utils/tokenStorage";

const baseUrl = import.meta.env.VITE_API_URL;

const authService = {
  // Login con DNI y contraseña
  login: async (dni, password) => {
    const response = await api.post("/auth/login", {
      username: dni,
      password,
    });

    const data = response.data;

    if (data?.token) {
      setAccessToken(data.token);
    }

    return data;
  },

  // Logout (solo cliente, no llama backend)
  logout: async () => {
    clearTokens();
    return { success: true };
  },

  // Obtener perfil del usuario autenticado
  getProfile: async () => {
    const response = await api.get(`${baseUrl}/auth/users/me`);
    return response.data;
  },
};

export default authService;
