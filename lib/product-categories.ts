import type { Product } from "@pi/contracts"

export const PRODUCT_CATEGORIES = [
  "comida",
  "bebida",
  "porcao",
  "sobremesa",
  "outros",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  comida: "Comida",
  bebida: "Bebida",
  porcao: "Porção",
  sobremesa: "Sobremesa",
  outros: "Outros",
}

/** O backend devolve `category`; o pacote publicado de contracts ainda nao. */
export type ProductWithCategory = Product & { category?: ProductCategory }

export function categoryOf(product: ProductWithCategory): ProductCategory {
  return product.category ?? "outros"
}
