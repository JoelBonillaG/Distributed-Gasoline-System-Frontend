const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const passwordService = {
  requestReset: async (input) => {
    try {
      const response = await fetch(`${baseUrl}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error("No se pudo procesar la solicitud");
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

      if (!response.ok) {
        throw new Error("No se pudo restablecer la contraseña");
      }

      return data;
    } catch (err) {
      console.error("Error en reset:", err);
      throw new Error(
        err.message ||
          "Error de red. Verifica tu conexión e inténtalo otra vez."
      );
    }
  },
};

export default passwordService;
