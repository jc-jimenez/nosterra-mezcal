"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface AmbassadorConfig {
  tierNormal: number;
  tierPlata: number;
  tierOro: number;
  customerDiscount: number;
}

export interface StoreSettings {
  whatsappNumber: string;
  shippingNote: string;
  freeShippingFrom: number;
  shippingCost: number;
  currency: string;
  ambassador: AmbassadorConfig;
}

const AMB_DEFAULT: AmbassadorConfig = { tierNormal: 2, tierPlata: 3, tierOro: 5, customerDiscount: 5 };

const DEFAULTS: StoreSettings = {
  whatsappNumber: "527775238569",
  shippingNote: "Envío a todo México · 3–5 días hábiles",
  freeShippingFrom: 1500,
  shippingCost: 150,
  currency: "MXN",
  ambassador: AMB_DEFAULT,
};

export function useStoreSettings(): StoreSettings {
  const s = useQuery(api.settings.get);
  if (!s) return DEFAULTS;
  return {
    whatsappNumber: s.whatsappNumber ?? DEFAULTS.whatsappNumber,
    shippingNote: s.shippingNote ?? DEFAULTS.shippingNote,
    freeShippingFrom: s.freeShippingFrom ?? DEFAULTS.freeShippingFrom,
    shippingCost: ("shippingCost" in s && s.shippingCost != null) ? s.shippingCost : DEFAULTS.shippingCost,
    currency: s.currency ?? DEFAULTS.currency,
    ambassador: ("ambassador" in s && s.ambassador) ? s.ambassador : AMB_DEFAULT,
  };
}
