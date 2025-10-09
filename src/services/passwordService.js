import { mapApiError } from "@/utils/mapApiError";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const passwordService = {
  requestReset: async (email) => {
    try {
      const response = await fetch(`${baseUrl}/auth/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data);

      if (!response.ok) {
        // "maquillar" la respuesta
        if (data?.statusCode === 404) {
          return {
            message:
              "Si existe una cuenta asociada a este correo, recibirás un enlace de recuperación.",
            safe: true,
          };
        }
        throw new Error(data?.message || "No se pudo procesar la solicitud");
      }

      return data;
    } catch (err) {
      console.error("Error en requestReset:", err);
      throw new Error(
        err.message ||
          "Error de red. Verifica tu conexión e inténtalo otra vez."
      );
    }
  },

  reset: async (token, newPassword) => {
    try {
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data);

      // Si no fue exitoso, mapear el error
      if (!response.ok) {
        const message = mapApiError(response, data);
        throw new Error(message);
      }
      return data;
    } catch (err) {
      console.error("Error en reset:", err);

      // Si el backend no respondió, devolvemos error genérico
      throw new Error(
        err.message ||
          "Error de red. Verifica tu conexión e inténtalo otra vez."
      );
    }
  },
};

export default passwordService;
