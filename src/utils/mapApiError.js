// src/utils/mapApiError.js
export function mapApiError(response, data) {
  if (!data || typeof data !== "object") {
    return "Error desconocido del servidor.";
  }

  // 1️⃣ Errores de validación (campo -> lista de errores)
  if (data.errors && typeof data.errors === "object") {
    const messages = [];
    for (const [field, errs] of Object.entries(data.errors)) {
      if (Array.isArray(errs)) messages.push(...errs);
      else if (typeof errs === "string") messages.push(errs);
    }
    if (messages.length > 0) return messages.join(" • ");
  }

  // 2️⃣ Campo `details`
  if (
    data.details &&
    typeof data.details === "string" &&
    data.details.trim() !== ""
  ) {
    return data.details;
  }

  // 3️⃣ Campo `message`
  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  // 4️⃣ Campo `code`
  if (data.code && typeof data.code === "string") {
    return `Error: ${data.code.replace(/_/g, " ").toLowerCase()}`;
  }

  // 5️⃣ Fallback
  return `Error inesperado (${response?.status || "?"})`;
}
