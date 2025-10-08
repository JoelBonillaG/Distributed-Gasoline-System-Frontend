import api from "./api";
import { clearTokens, setAccessToken } from "@/utils/tokenStorage";

const baseUrl = import.meta.env.VITE_API_URL;

const authService = {
  login: async (email, password) => {
    const response = await fetch(`${baseUrl}/auth/log-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data?.statusCode && data.statusCode !== 200) {
      throw {
        success: false,
        errorData: {
          statusCode: data.statusCode,
          message: data.message,
          code: data.code,
          grpc: data.grpc,
          details: data.details,
          errors: data.errors,
        },
      };
    }

    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }

    return data;
  },

  // Logout (solo limpia el almacenamiento local)
  logout: async () => {
    clearTokens();
    return { success: true };
  },

  // Obtener perfil del usuario autenticado
  getProfile: async () => {
    const response = await api.get(`${baseUrl}/auth/me`);
    return response.data;
  },
};

export default authService;
