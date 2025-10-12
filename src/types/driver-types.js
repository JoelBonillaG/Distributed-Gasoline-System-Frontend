/**
 * @typedef {Object} Driver
 * @property {number} driverId - ID único del conductor
 * @property {number} userId - ID del usuario asociado
 * @property {string} availability - Estado de disponibilidad
 * @property {DriverSummary} [summary] - Resumen de licencias
 * @property {DriverLicense[]} [licenses] - Licencias del conductor
 * @property {number} version - Versión para optimistic locking
 * @property {string} createdAt - Fecha de creación
 * @property {string} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} DriverSummary
 * @property {number} totalLicenses - Total de licencias
 * @property {number} activeLicenses - Licencias activas (VALID)
 * @property {number} expiredLicenses - Licencias vencidas
 * @property {number} suspendedLicenses - Licencias suspendidas
 */

/**
 * @typedef {Object} DriverLicense
 * @property {number} licenseId - ID de la licencia
 * @property {number} driverId - ID del conductor
 * @property {number} licenseTypeId - ID del tipo de licencia
 * @property {string} number - Número de licencia
 * @property {string} issuedAt - Fecha de emisión (ISO string)
 * @property {string} expiresAt - Fecha de vencimiento (ISO string)
 * @property {string} status - Estado de la licencia (VALID, EXPIRED, SUSPENDED)
 * @property {LicenseType} [licenseType] - Tipo de licencia (si está incluido)
 * @property {string} createdAt - Fecha de creación
 * @property {string} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} LicenseType
 * @property {number} licenseTypeId - ID del tipo
 * @property {string} code - Código (A, B, C, D, etc.)
 * @property {string} name - Nombre descriptivo
 * @property {string} description - Descripción
 * @property {LicenseInclude[]} [includes] - Incluye otros tipos
 */

/**
 * @typedef {Object} LicenseInclude
 * @property {number} licenseTypeId - ID del tipo que incluye
 * @property {number} includedLicenseTypeId - ID del tipo incluido
 * @property {LicenseType} [includedLicenseType] - Tipo incluido (si está expandido)
 */

/**
 * @typedef {Object} CreateDriverDto
 * @property {number} userId - ID del usuario
 * @property {string} availability - Estado inicial (AVAILABLE o INACTIVE)
 */

/**
 * @typedef {Object} UpdateDriverDto
 * @property {string} availability - Nuevo estado
 * @property {number} version - Versión actual para optimistic locking
 */

/**
 * @typedef {Object} CreateLicenseDto
 * @property {number} driverId - ID del conductor
 * @property {number} licenseTypeId - ID del tipo de licencia
 * @property {string} number - Número de licencia
 * @property {string} issuedAt - Fecha de emisión (ISO string)
 * @property {string} expiresAt - Fecha de vencimiento (ISO string)
 */

/**
 * @typedef {Object} UpdateLicenseDto
 * @property {string} [number] - Nuevo número
 * @property {string} [expiresAt] - Nueva fecha de vencimiento
 */

// ========== ENUMS ==========

/**
 * Estados de disponibilidad del conductor
 */
export const AVAILABILITY = {
  AVAILABLE: 'AVAILABLE',
  ON_ROUTE: 'ON_ROUTE',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  INACTIVE: 'INACTIVE'
};

/**
 * Mapeo de estados a etiquetas en español
 */
export const AVAILABILITY_MAP = {
  AVAILABLE: 'Disponible',
  ON_ROUTE: 'En Ruta',
  LICENSE_EXPIRED: 'Licencia Vencida',
  INACTIVE: 'Inactivo'
};

/**
 * Estados de licencia
 */
export const LICENSE_STATUS = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED'
};

/**
 * Mapeo de estados de licencia a español
 */
export const LICENSE_STATUS_MAP = {
  VALID: 'Vigente',
  EXPIRED: 'Vencida',
  SUSPENDED: 'Suspendida'
};

// ========== COLORES PARA UI ==========

/**
 * Clases Tailwind para badges de availability
 * Optimizados para modo claro y oscuro con alto contraste
 */
export const AVAILABILITY_COLORS = {
  AVAILABLE: "bg-green-500 text-white hover:bg-green-600",
  ON_ROUTE: "bg-blue-500 text-white hover:bg-blue-600",
  LICENSE_EXPIRED: "bg-orange-500 text-white hover:bg-orange-600",
  INACTIVE: "bg-gray-500 text-white hover:bg-gray-600"
};

/**
 * Clases Tailwind para badges de license status
 * Optimizados para modo claro y oscuro con alto contraste
 */
export const LICENSE_STATUS_COLORS = {
  VALID: "bg-emerald-500 text-white hover:bg-emerald-600",
  EXPIRED: "bg-red-500 text-white hover:bg-red-600",
  SUSPENDED: "bg-amber-500 text-white hover:bg-amber-600"
};

// ========== HELPERS ==========

/**
 * Calcula días hasta vencimiento de licencia
 * @param {string} expiresAt - Fecha de vencimiento (ISO string)
 * @returns {number} - Días hasta vencer (negativo si ya venció)
 */
export const getDaysUntilExpiry = (expiresAt) => {
  const expiry = new Date(expiresAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Obtiene clase de color según días hasta vencer
 * @param {number} days - Días hasta vencimiento
 * @returns {string} - Clase Tailwind
 */
export const getDaysColor = (days) => {
  if (days < 0) return "text-red-600 font-bold"; // vencida
  if (days < 30) return "text-orange-600 font-semibold"; // por vencer pronto
  if (days < 90) return "text-yellow-600"; // advertencia
  return "text-green-600"; // ok
};

/**
 * Formatea fecha para display
 * @param {string} isoDate - Fecha ISO string
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Valida si una licencia está vigente
 * @param {DriverLicense} license - Licencia a validar
 * @returns {boolean}
 */
export const isLicenseValid = (license) => {
  return license.status === LICENSE_STATUS.VALID && 
         getDaysUntilExpiry(license.expiresAt) >= 0;
};
