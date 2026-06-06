import { Doc } from "@/convex/_generated/dataModel";

// Producto tal como lo devuelven las queries de la tienda (con la URL de imagen resuelta).
export type Product = Doc<"products"> & { image: string };
