import { jwtDecode } from "jwt-decode";

function parseMaybeLong(value) {
  if (value == null) return null;

  if (typeof value === "object") {
    if (typeof value.low === "number") {
      return value.low;
    }
    if ("value" in value && typeof value.value === "number") {
      return value.value;
    }
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((role) => ({
        roleId: parseMaybeLong(role?.roleId ?? role?.id ?? role),
        name: role?.name ?? String(role?.roleCode ?? role ?? ""),
      }))
    : [];

  const userId =
    parseMaybeLong(payload.userId) ?? parseMaybeLong(payload.sub) ?? null;

  return {
    ...payload,
    userId,
    centerId: parseMaybeLong(payload.centerId),
    email: payload.email ?? null,
    roles,
  };
}

/**
 * Decodifica el token JWT guardado en localStorage y normaliza la estructura
 */
export function getDecodedToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return normalizePayload(payload);
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
}

export function getUserCenterId() {
  const decoded = getDecodedToken();
  return decoded?.centerId ?? null;
}

export function getUserId() {
  const decoded = getDecodedToken();
  return decoded?.userId ?? null;
}

export function getUserEmail() {
  const decoded = getDecodedToken();
  return decoded?.email ?? null;
}

export function getUserRoles() {
  const decoded = getDecodedToken();
  return decoded?.roles?.map((role) => role?.name ?? "") ?? [];
}
