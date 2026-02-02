export type Product = {
  title: string;
  price: string | null;
  oldPrice: string | null;
  stock: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

export async function fetchProducts(categoryUrl: string) {
  const res = await fetch(`/api/products?url=${encodeURIComponent(categoryUrl)}`);
  if (!res.ok) throw new Error("Failed to load products");
  return (await res.json()) as { products: Product[]; count: number; source: string };
}
