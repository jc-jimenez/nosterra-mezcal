export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  comparePrice?: number;
  image: string;
  agave: string;
  alcohol: string;
  origin: string;
  volume: string;
  process: string;
  stock: number;
  featured?: boolean;
  numbered?: { total: number; available: number };
}

export const products: Product[] = [
  {
    slug: "joven-cristalino",
    name: "NOSTERRA Joven Cristalino",
    tagline: "El espíritu de nuestra tierra",
    description:
      "Mezcal joven de agave Espadín, cocido en horno cónico de piedra, molido en tahona y destilado en alambique de cobre. Cristalino, limpio y profundamente oaxaqueño.",
    price: 880,
    image: "/images/botella-cristalino.png",
    agave: "Espadín",
    alcohol: "40% Alc. Vol.",
    origin: "Santiago Matatlán, Oaxaca",
    volume: "750 ml",
    process: "Artesanal",
    stock: 100,
    featured: true,
  },
  {
    slug: "edicion-artemio",
    name: "Edición Conmemorativa",
    tagline: "Gral. Artemio Brito Abarca",
    description:
      "Una edición limitada de 84 botellas numeradas, homenaje a 84 años de legado. Cada botella lleva su número grabado — una pieza de colección irrepetible.",
    price: 2400,
    image: "/images/artemio-etiqueta.png",
    agave: "Espadín",
    alcohol: "40% Alc. Vol.",
    origin: "Santiago Matatlán, Oaxaca",
    volume: "750 ml",
    process: "Artesanal · Edición limitada",
    stock: 84,
    numbered: { total: 84, available: 84 },
  },
];

export const featuredProduct = products.find((p) => p.featured)!;
export const numberedEdition = products.find((p) => p.numbered)!;
