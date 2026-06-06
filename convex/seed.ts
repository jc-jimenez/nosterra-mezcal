import { mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

// Importa los productos iniciales si la tabla está vacía (idempotente).
export const seedProducts = mutation({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    const existing = await ctx.db.query("products").collect();
    if (existing.length > 0) return { seeded: 0, message: "Ya había productos, no se hizo nada." };

    await ctx.db.insert("products", {
      slug: "joven-cristalino",
      name: "NOSTERRA Joven Cristalino",
      tagline: "El espíritu de nuestra tierra",
      description:
        "Mezcal joven de agave Espadín, cocido en horno cónico de piedra, molido en tahona y destilado en alambique de cobre. Cristalino, limpio y profundamente oaxaqueño.",
      price: 880,
      imageUrl: "/images/botella-cristalino.png",
      agave: "Espadín",
      alcohol: "40% Alc. Vol.",
      volume: "750 ml",
      origin: "Santiago Matatlán, Oaxaca",
      process: "Artesanal",
      stock: 100,
      featured: true,
      isActive: true,
      isLimited: false,
      sortOrder: 1,
    });

    await ctx.db.insert("products", {
      slug: "edicion-artemio",
      name: "Edición Conmemorativa",
      tagline: "Gral. Artemio Brito Abarca",
      description:
        "Una edición limitada de 84 botellas numeradas, homenaje a 84 años de legado. Cada botella lleva su número grabado — una pieza de colección irrepetible.",
      price: 2400,
      imageUrl: "/images/artemio-etiqueta.png",
      agave: "Espadín",
      alcohol: "40% Alc. Vol.",
      volume: "750 ml",
      origin: "Santiago Matatlán, Oaxaca",
      process: "Artesanal · Edición limitada",
      stock: 84,
      featured: false,
      isActive: true,
      isLimited: true,
      bottlesTotal: 84,
      bottlesAvailable: 84,
      sortOrder: 2,
    });

    return { seeded: 2, message: "Productos importados." };
  },
});
