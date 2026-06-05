// Configuración de la tienda NOSTERRA.
// ⚠️ Reemplaza WHATSAPP_NUMBER con el número real de ventas (formato internacional sin +).
export const STORE_CONFIG = {
  // Ej. México: 52 + 10 dígitos. Placeholder — cámbialo por el real.
  WHATSAPP_NUMBER: "527775238569",
  shippingNote: "Envío a todo México · 3–5 días hábiles",
  freeShippingFrom: 1500, // MXN
  currency: "MXN",
};

export function formatMXN(n: number): string {
  return `$${n.toLocaleString("es-MX")}`;
}
